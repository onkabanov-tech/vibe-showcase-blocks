// Проверка Authorization: Bearer <token> для маршрутов клиента/админа.
// 401 — нет валидной сессии вообще; 403 — сессия валидна, но не та роль.
import { getDb } from "./db.js";
import { getSession } from "./sessions.js";
import { ApiError } from "./http/respond.js";

function bearerToken(req) {
  const header = req.headers["authorization"] || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

function requireSession(req, expectedType) {
  const token = bearerToken(req);
  const session = token ? getSession(token) : null;
  if (!session) throw new ApiError(401, "unauthorized", "Нужна авторизация");
  if (session.actor_type !== expectedType) {
    throw new ApiError(403, "forbidden", "Недостаточно прав для этого действия");
  }
  return session;
}

// Возвращает текущего клиента (без password_hash) или бросает 401/403.
export function requireClient(req) {
  const session = requireSession(req, "client");
  const client = getDb()
    .prepare("SELECT id, name, email, contact, created_at FROM clients WHERE id = ?")
    .get(session.actor_id);
  if (!client) throw new ApiError(401, "unauthorized", "Аккаунт клиента не найден");
  return client;
}

// Возвращает текущего администратора (без password_hash) или бросает 401/403.
export function requireAdmin(req) {
  const session = requireSession(req, "admin");
  const admin = getDb()
    .prepare("SELECT id, username, created_at, last_login_at FROM admin_users WHERE id = ?")
    .get(session.actor_id);
  if (!admin) throw new ApiError(401, "unauthorized", "Учётная запись администратора не найдена");
  return admin;
}

export { bearerToken };
