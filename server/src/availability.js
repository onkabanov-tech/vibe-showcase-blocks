// Расчёт свободного времени мастера — строго по docs/db-schema.md §6:
// (рабочие часы дня) минус (активные bookings) минус (schedule_blocks)
// минус (действующие slot_holds). Ничего не хранится заранее — считается
// на каждый запрос из уже существующих таблиц.
import { getDb } from "./db.js";
import { getServicesByIds } from "./services.js";
import { getMasterOrThrow } from "./masters.js";
import { purgeExpiredHolds } from "./holds.js";
import { nowIso, salonLocalToUtcIso, weekdayOfDate, utcIsoToSalonLocalParts } from "./time.js";
import { ApiError } from "./http/respond.js";

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function computeAvailability({ masterId, date, serviceIds }) {
  getMasterOrThrow(masterId, { requireActive: true });
  const services = getServicesByIds(serviceIds);
  const totalDurationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);

  const db = getDb();
  const weekday = weekdayOfDate(date);
  const schedule = db
    .prepare("SELECT * FROM work_schedule WHERE master_id = ? AND weekday = ?")
    .get(masterId, weekday);

  if (!schedule || !schedule.is_working) {
    return { masterId, date, totalDurationMinutes, slots: [] };
  }

  const rangeStart = salonLocalToUtcIso(date, schedule.start_time);
  const rangeEnd = salonLocalToUtcIso(date, schedule.end_time);
  if (rangeStart >= rangeEnd) {
    return { masterId, date, totalDurationMinutes, slots: [] };
  }

  purgeExpiredHolds();

  const busy = [];
  for (const row of db
    .prepare(
      `SELECT starts_at, ends_at FROM bookings
       WHERE master_id = ? AND status <> 'cancelled' AND starts_at < ? AND ends_at > ?`,
    )
    .all(masterId, rangeEnd, rangeStart)) {
    busy.push([row.starts_at, row.ends_at]);
  }
  for (const row of db
    .prepare(
      `SELECT starts_at, ends_at FROM schedule_blocks
       WHERE master_id = ? AND starts_at < ? AND ends_at > ?`,
    )
    .all(masterId, rangeEnd, rangeStart)) {
    busy.push([row.starts_at, row.ends_at]);
  }
  for (const row of db
    .prepare(
      `SELECT starts_at, ends_at FROM slot_holds
       WHERE master_id = ? AND expires_at > ? AND starts_at < ? AND ends_at > ?`,
    )
    .all(masterId, nowIso(), rangeEnd, rangeStart)) {
    busy.push([row.starts_at, row.ends_at]);
  }

  const stepMs = totalDurationMinutes * 60_000;
  const slots = [];
  for (let startMs = Date.parse(rangeStart); startMs + stepMs <= Date.parse(rangeEnd); startMs += stepMs) {
    const slotStart = new Date(startMs).toISOString().replace(/\.\d{3}Z$/, "Z");
    const slotEnd = new Date(startMs + stepMs).toISOString().replace(/\.\d{3}Z$/, "Z");
    const isFree = busy.every(([bStart, bEnd]) => !overlaps(slotStart, slotEnd, bStart, bEnd));
    if (isFree) slots.push({ startsAt: slotStart, endsAt: slotEnd });
  }

  return { masterId, date, totalDurationMinutes, slots };
}

// Используется при создании/переносе удержания и записи: убеждается, что
// именно этот интервал (а не сетка кратных слотов) свободен и укладывается
// в рабочие часы. ignoreHoldId/ignoreBookingId — чтобы не конфликтовать
// самим с собой при переносе/подтверждении удержания.
export function assertSlotIsFree({ masterId, startsAt, endsAt, ignoreHoldId, ignoreBookingId }) {
  const db = getDb();
  const startParts = utcIsoToSalonLocalParts(startsAt);
  const endParts = utcIsoToSalonLocalParts(endsAt);

  if (startParts.date !== endParts.date) {
    throw new ApiError(409, "outside_working_hours", "Слот выходит за пределы одного рабочего дня");
  }

  const schedule = db
    .prepare("SELECT * FROM work_schedule WHERE master_id = ? AND weekday = ?")
    .get(masterId, startParts.weekday);
  if (
    !schedule ||
    !schedule.is_working ||
    startParts.hhmm < schedule.start_time ||
    endParts.hhmm > schedule.end_time
  ) {
    throw new ApiError(409, "outside_working_hours", "Выбранное время вне рабочих часов мастера");
  }

  const bookingConflict = db
    .prepare(
      `SELECT 1 FROM bookings
       WHERE master_id = ? AND status <> 'cancelled' AND starts_at < ? AND ends_at > ?
       ${ignoreBookingId ? "AND id <> ?" : ""}
       LIMIT 1`,
    )
    .get(...[masterId, endsAt, startsAt, ...(ignoreBookingId ? [ignoreBookingId] : [])]);
  if (bookingConflict) throw new ApiError(409, "slot_taken", "На это время уже есть запись");

  const blockConflict = db
    .prepare(
      "SELECT 1 FROM schedule_blocks WHERE master_id = ? AND starts_at < ? AND ends_at > ? LIMIT 1",
    )
    .get(masterId, endsAt, startsAt);
  if (blockConflict) throw new ApiError(409, "slot_blocked", "Мастер недоступен в это время");

  const holdConflict = db
    .prepare(
      `SELECT 1 FROM slot_holds
       WHERE master_id = ? AND expires_at > ? AND starts_at < ? AND ends_at > ?
       ${ignoreHoldId ? "AND id <> ?" : ""}
       LIMIT 1`,
    )
    .get(...[masterId, nowIso(), endsAt, startsAt, ...(ignoreHoldId ? [ignoreHoldId] : [])]);
  if (holdConflict) throw new ApiError(409, "slot_held", "Слот сейчас удерживается другим клиентом");
}
