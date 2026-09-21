// Удержание выбранного слота на время оформления записи. Живёт в БД, а не
// в памяти процесса, — переживает рестарт и одинаково видно всем запросам.
// Истечение — "ленивое" (чистим при каждом обращении) плюс периодическая
// подчистка из index.js, см. HOLD_TTL_MINUTES в .env.example.
import { getDb } from "./db.js";
import { nowIso, toIso } from "./time.js";
import { getServicesByIds } from "./services.js";
import { getMasterOrThrow } from "./masters.js";
import { assertSlotIsFree } from "./availability.js";
import { ApiError } from "./http/respond.js";

const HOLD_TTL_MINUTES = Number(process.env.HOLD_TTL_MINUTES ?? 10);

export function purgeExpiredHolds() {
  getDb().prepare("DELETE FROM slot_holds WHERE expires_at <= ?").run(nowIso());
}

function serialize(db, hold) {
  const serviceIds = db
    .prepare("SELECT service_id FROM slot_hold_services WHERE hold_id = ?")
    .all(hold.id)
    .map((r) => r.service_id);
  return {
    id: hold.id,
    masterId: hold.master_id,
    startsAt: hold.starts_at,
    endsAt: hold.ends_at,
    expiresAt: hold.expires_at,
    serviceIds,
  };
}

export function createHold({ clientId, masterId, serviceIds, startsAt }) {
  purgeExpiredHolds();
  getMasterOrThrow(masterId, { requireActive: true });
  const services = getServicesByIds(serviceIds);
  const totalDurationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);
  const endsAt = toIso(new Date(Date.parse(startsAt) + totalDurationMinutes * 60_000));

  assertSlotIsFree({ masterId, startsAt, endsAt });

  const db = getDb();
  const now = nowIso();
  const expiresAt = toIso(new Date(Date.now() + HOLD_TTL_MINUTES * 60_000));

  db.exec("BEGIN");
  try {
    const holdId = db
      .prepare(
        `INSERT INTO slot_holds (master_id, client_id, starts_at, ends_at, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(masterId, clientId, startsAt, endsAt, expiresAt, now).lastInsertRowid;
    const insertHoldService = db.prepare(
      "INSERT INTO slot_hold_services (hold_id, service_id) VALUES (?, ?)",
    );
    for (const service of services) insertHoldService.run(holdId, service.id);
    db.exec("COMMIT");
    return serialize(db, db.prepare("SELECT * FROM slot_holds WHERE id = ?").get(holdId));
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function releaseHold({ holdId, clientId }) {
  const db = getDb();
  const hold = db.prepare("SELECT * FROM slot_holds WHERE id = ?").get(holdId);
  if (!hold) throw new ApiError(404, "not_found", "Удержание не найдено");
  if (hold.client_id !== clientId) throw new ApiError(403, "forbidden", "Это не ваше удержание слота");
  db.prepare("DELETE FROM slot_holds WHERE id = ?").run(holdId);
}

export function getHoldForClient(holdId, clientId) {
  const db = getDb();
  const hold = db.prepare("SELECT * FROM slot_holds WHERE id = ?").get(holdId);
  if (!hold) return null;
  if (hold.client_id !== clientId) {
    throw new ApiError(403, "forbidden", "Это не ваше удержание слота");
  }
  if (hold.expires_at <= nowIso()) return null;
  return hold;
}
