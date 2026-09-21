import { randomBytes } from "node:crypto";
import { getDb } from "./db.js";
import { nowIso, toIso } from "./time.js";
import { getServicesByIds } from "./services.js";
import { getMasterOrThrow } from "./masters.js";
import { assertSlotIsFree, slotTakenError } from "./availability.js";
import { purgeExpiredHolds, getHoldForClient } from "./holds.js";
import { ApiError } from "./http/respond.js";

const STATUSES = ["pending", "confirmed", "cancelled"];

function loadBooking(db, id) {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  if (!booking) return null;
  const services = db
    .prepare(
      `SELECT s.id, s.name, s.duration_minutes, s.price
       FROM booking_services bs JOIN services s ON s.id = bs.service_id
       WHERE bs.booking_id = ?`,
    )
    .all(id);
  const master = db.prepare("SELECT id, name FROM masters WHERE id = ?").get(booking.master_id);
  const client = db
    .prepare("SELECT id, name, contact, email FROM clients WHERE id = ?")
    .get(booking.client_id);
  return { booking, services, master, client };
}

// Вид для клиента, которому принадлежит запись — без чужих данных, ему и
// так известны свои контакты.
function toClientView({ booking, services, master }) {
  return {
    id: booking.id,
    code: booking.code,
    status: booking.status,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    comment: booking.comment,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
    master: master ? { id: master.id, name: master.name } : null,
    services: services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.duration_minutes, price: s.price })),
    totalDurationMinutes: services.reduce((sum, s) => sum + s.duration_minutes, 0),
    totalPrice: services.reduce((sum, s) => sum + s.price, 0),
  };
}

// Вид для админки — плюс минимально нужные данные клиента (имя/контакт),
// без email/пароля посторонних. Ни то, ни другое не хеш пароля — их и так
// нет в этой выборке.
function toAdminView({ booking, services, master, client }) {
  return {
    ...toClientView({ booking, services, master }),
    client: client ? { id: client.id, name: client.name, contact: client.contact } : null,
  };
}

function generateTempCode() {
  return `tmp-${randomBytes(8).toString("hex")}`;
}

// Срабатывает и на "лишнюю подстраховку" — частичный уникальный индекс
// ux_bookings_master_active_start (docs/db-schema.md §7), и на настоящую
// защиту — триггеры 0003_no_overlap_triggers.sql (RAISE(ABORT,
// 'booking_overlap')). И то, и другое — один и тот же смысл: "это время
// у этого мастера уже занято", поэтому оба ведут к одному 409 с готовым
// списком ближайшего свободного времени, а не к сырому тексту ошибки БД.
function isBookingOverlapError(error) {
  return (
    error.message === "booking_overlap" ||
    String(error.message).includes("UNIQUE constraint failed: bookings")
  );
}

export function createBooking({ clientId, masterId, serviceIds, startsAt, holdId, comment }) {
  getMasterOrThrow(masterId, { requireActive: true });
  const services = getServicesByIds(serviceIds);
  const totalDurationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const endsAt = toIso(new Date(Date.parse(startsAt) + totalDurationMinutes * 60_000));

  const db = getDb();
  const now = nowIso();

  // BEGIN IMMEDIATE, а не обычный BEGIN (= BEGIN DEFERRED). Обычная
  // транзакция берёт блокировку на запись только когда внутри неё
  // выполнится первая INSERT/UPDATE/DELETE — до этого момента другой
  // процесс (второй запрос, скрипт, другой воркер) вполне может успеть
  // прочитать "слот свободен" и начать вставлять свою запись в то же
  // окно между нашей проверкой и нашей вставкой. IMMEDIATE берёт
  // RESERVED-блокировку сразу на BEGIN — ещё до первого чтения — поэтому
  // второй такой же BEGIN IMMEDIATE от другого соединения будет ждать
  // (или сразу получит SQLITE_BUSY) до конца нашей транзакции. Проверка
  // "слот свободен" и сама вставка становятся одной неделимой операцией
  // не только для этого процесса, но и для конкурентных. Триггер
  // (0003_no_overlap_triggers.sql) — это последний рубеж на случай, если
  // что-то всё же пройдёт мимо проверки; блокировка транзакции нужна,
  // чтобы такое "пройдёт мимо" было маловероятным, а не единственной
  // линией обороны.
  db.exec("BEGIN IMMEDIATE");
  try {
    purgeExpiredHolds();

    let hold = null;
    if (holdId != null) {
      hold = getHoldForClient(holdId, clientId);
      if (!hold) throw new ApiError(409, "hold_expired", "Удержание слота истекло, выберите время заново");
      const heldServiceIds = db
        .prepare("SELECT service_id FROM slot_hold_services WHERE hold_id = ?")
        .all(holdId)
        .map((r) => r.service_id)
        .sort((a, b) => a - b);
      const requestedSorted = [...serviceIds].sort((a, b) => a - b);
      if (
        hold.master_id !== masterId ||
        hold.starts_at !== startsAt ||
        JSON.stringify(heldServiceIds) !== JSON.stringify(requestedSorted)
      ) {
        throw new ApiError(409, "hold_mismatch", "Параметры записи не совпадают с удержанием слота");
      }
    }

    assertSlotIsFree({ masterId, startsAt, endsAt, ignoreHoldId: hold?.id });

    const bookingId = db
      .prepare(
        `INSERT INTO bookings (code, client_id, master_id, starts_at, ends_at, status, comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      )
      .run(generateTempCode(), clientId, masterId, startsAt, endsAt, comment ?? null, now, now).lastInsertRowid;

    db.prepare("UPDATE bookings SET code = ? WHERE id = ?").run(`BK-${1000 + bookingId}`, bookingId);

    const insertBookingService = db.prepare(
      "INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)",
    );
    for (const service of services) insertBookingService.run(bookingId, service.id);

    if (hold) db.prepare("DELETE FROM slot_holds WHERE id = ?").run(hold.id);

    db.exec("COMMIT");
    return toClientView(loadBooking(db, bookingId));
  } catch (error) {
    db.exec("ROLLBACK");
    if (isBookingOverlapError(error)) throw slotTakenError({ masterId, startsAt, endsAt });
    throw error;
  }
}

export function listClientBookings(clientId) {
  const db = getDb();
  const ids = db
    .prepare("SELECT id FROM bookings WHERE client_id = ? ORDER BY starts_at DESC")
    .all(clientId)
    .map((r) => r.id);
  return ids.map((id) => toClientView(loadBooking(db, id)));
}

export function getClientBookingOrThrow(bookingId, clientId) {
  const db = getDb();
  const loaded = loadBooking(db, bookingId);
  if (!loaded) throw new ApiError(404, "not_found", "Запись не найдена");
  if (loaded.booking.client_id !== clientId) throw new ApiError(403, "forbidden", "Это не ваша запись");
  return toClientView(loaded);
}

export function rescheduleBooking({ bookingId, clientId, startsAt }) {
  const db = getDb();
  const loaded = loadBooking(db, bookingId);
  if (!loaded) throw new ApiError(404, "not_found", "Запись не найдена");
  if (loaded.booking.client_id !== clientId) throw new ApiError(403, "forbidden", "Это не ваша запись");
  if (loaded.booking.status === "cancelled") {
    throw new ApiError(409, "booking_cancelled", "Отменённую запись нельзя перенести");
  }

  const totalDurationMinutes = loaded.services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const endsAt = toIso(new Date(Date.parse(startsAt) + totalDurationMinutes * 60_000));
  const masterId = loaded.booking.master_id;
  const now = nowIso();

  // Тот же принцип BEGIN IMMEDIATE, что и в createBooking: перенос — это
  // тоже "проверить, что время свободно" + "записать", и должен быть
  // одной неделимой операцией, а не двумя отдельными шагами с окном
  // гонки между ними.
  db.exec("BEGIN IMMEDIATE");
  try {
    assertSlotIsFree({ masterId, startsAt, endsAt, ignoreBookingId: bookingId });
    db.prepare("UPDATE bookings SET starts_at=?, ends_at=?, status='pending', updated_at=? WHERE id=?").run(
      startsAt,
      endsAt,
      now,
      bookingId,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    if (isBookingOverlapError(error)) throw slotTakenError({ masterId, startsAt, endsAt });
    throw error;
  }
  return toClientView(loadBooking(db, bookingId));
}

export function cancelBooking({ bookingId, clientId }) {
  const db = getDb();
  const loaded = loadBooking(db, bookingId);
  if (!loaded) throw new ApiError(404, "not_found", "Запись не найдена");
  if (loaded.booking.client_id !== clientId) throw new ApiError(403, "forbidden", "Это не ваша запись");
  if (loaded.booking.status === "cancelled") {
    throw new ApiError(409, "already_cancelled", "Запись уже отменена");
  }
  db.prepare("UPDATE bookings SET status='cancelled', updated_at=? WHERE id=?").run(nowIso(), bookingId);
  return toClientView(loadBooking(db, bookingId));
}

export function listAllBookings({ status, masterId } = {}) {
  const db = getDb();
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push("status = ?");
    params.push(status);
  }
  if (masterId) {
    clauses.push("master_id = ?");
    params.push(masterId);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const ids = db
    .prepare(`SELECT id FROM bookings ${where} ORDER BY starts_at DESC`)
    .all(...params)
    .map((r) => r.id);
  return ids.map((id) => toAdminView(loadBooking(db, id)));
}

export function adminSetBookingStatus({ bookingId, status }) {
  if (!STATUSES.includes(status)) {
    throw new ApiError(400, "invalid_field", "Недопустимый статус", { field: "status" });
  }
  const db = getDb();
  const loaded = loadBooking(db, bookingId);
  if (!loaded) throw new ApiError(404, "not_found", "Запись не найдена");
  if (loaded.booking.status === "cancelled") {
    throw new ApiError(409, "booking_cancelled", "Отменённую запись нельзя изменить");
  }
  if (loaded.booking.status === status) {
    throw new ApiError(409, "no_change", "Запись уже в этом статусе");
  }
  db.prepare("UPDATE bookings SET status=?, updated_at=? WHERE id=?").run(status, nowIso(), bookingId);
  return toAdminView(loadBooking(db, bookingId));
}
