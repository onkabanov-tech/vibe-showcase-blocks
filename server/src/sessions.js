// Токен-сессии для клиентов и администраторов в одной таблице (sessions).
// Логаут — это реальное удаление строки, а не просто "забыть токен на
// клиенте", поэтому не JWT: у JWT нет отзыва без чёрного списка.
import { randomBytes } from "node:crypto";
import { getDb } from "./db.js";
import { nowIso, toIso } from "./time.js";

const CLIENT_SESSION_TTL_HOURS = Number(process.env.CLIENT_SESSION_TTL_HOURS ?? 720); // 30 дней
const ADMIN_SESSION_TTL_HOURS = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12);

function ttlHoursFor(actorType) {
  return actorType === "admin" ? ADMIN_SESSION_TTL_HOURS : CLIENT_SESSION_TTL_HOURS;
}

export function createSession(actorType, actorId) {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const createdAt = nowIso();
  const expiresAt = toIso(new Date(Date.now() + ttlHoursFor(actorType) * 3_600_000));
  db.prepare(
    "INSERT INTO sessions (token, actor_type, actor_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
  ).run(token, actorType, actorId, createdAt, expiresAt);
  return { token, expiresAt };
}

// Возвращает строку сессии, если токен существует и ещё не истёк;
// попутно удаляет саму сессию, если она уже истекла.
export function getSession(token) {
  if (!token) return null;
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!row) return null;
  if (row.expires_at <= nowIso()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
    return null;
  }
  return row;
}

export function deleteSession(token) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function purgeExpiredSessions() {
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
}
