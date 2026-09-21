// Токен-сессии для клиентов, администраторов и мастеров в одной таблице
// (sessions). Логаут — это реальное удаление строки, а не просто "забыть
// токен на клиенте", поэтому не JWT: у JWT нет отзыва без чёрного списка.
//
// В базе лежит не сам токен, а его SHA-256 (sessions.token_hash) — без
// соли: это не пароль, а готовая случайная строка из randomBytes(32),
// у неё и так нет угадываемой структуры, которую соль защищала бы от
// словарной/rainbow-table атаки. Смысл хеширования здесь другой: если
// файл БД утечёт, из хешей нельзя восстановить рабочие токены и войти
// под чужой сессией — нужен исходный токен, которого в базе нет.
import { randomBytes, createHash } from "node:crypto";
import { getDb } from "./db.js";
import { nowIso, toIso } from "./time.js";

const CLIENT_SESSION_TTL_HOURS = Number(process.env.CLIENT_SESSION_TTL_HOURS ?? 720); // 30 дней
const ADMIN_SESSION_TTL_HOURS = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12);
const MASTER_SESSION_TTL_HOURS = Number(process.env.MASTER_SESSION_TTL_HOURS ?? 24);

function ttlHoursFor(actorType) {
  if (actorType === "admin") return ADMIN_SESSION_TTL_HOURS;
  if (actorType === "master") return MASTER_SESSION_TTL_HOURS;
  return CLIENT_SESSION_TTL_HOURS;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

// Токен с ограниченным сроком действия — expires_at считается от TTL
// роли (см. константы выше) и проверяется на каждый запрос в getSession.
export function createSession(actorType, actorId) {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const createdAt = nowIso();
  const expiresAt = toIso(new Date(Date.now() + ttlHoursFor(actorType) * 3_600_000));
  db.prepare(
    "INSERT INTO sessions (token_hash, actor_type, actor_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
  ).run(hashToken(token), actorType, actorId, createdAt, expiresAt);
  // Наружу — исходный токен (клиент положит его в Authorization); в базе
  // остался только его хеш, обратно токен из хеша не восстановить.
  return { token, expiresAt };
}

// Возвращает строку сессии, если токен существует и ещё не истёк;
// попутно удаляет саму сессию, если она уже истекла. Принимает исходный
// токен (не хеш) — хеширует его тем же SHA-256 и ищет совпадение по
// уникальному индексу на token_hash.
export function getSession(token) {
  if (!token) return null;
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE token_hash = ?").get(hashToken(token));
  if (!row) return null;
  if (row.expires_at <= nowIso()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
    return null;
  }
  return row;
}

export function deleteSession(token) {
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

export function purgeExpiredSessions() {
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
}
