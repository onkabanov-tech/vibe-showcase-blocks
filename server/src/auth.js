import { getDb } from "./db.js";
import { nowIso } from "./time.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createSession, deleteSession } from "./sessions.js";
import { ApiError } from "./http/respond.js";

function serializeClient(row) {
  return { id: row.id, name: row.name, email: row.email, contact: row.contact };
}

export function registerClient({ name, email, password, contact }) {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM clients WHERE email = ?").get(email);
  if (existing) throw new ApiError(409, "email_taken", "Этот email уже зарегистрирован");

  const now = nowIso();
  const id = db
    .prepare("INSERT INTO clients (name, contact, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(name, contact, email, hashPassword(password), now).lastInsertRowid;

  const session = createSession("client", id);
  const client = db.prepare("SELECT id, name, email, contact FROM clients WHERE id = ?").get(id);
  return { session, client: serializeClient(client) };
}

export function loginClient({ email, password }) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM clients WHERE email = ?").get(email);
  if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    throw new ApiError(401, "invalid_credentials", "Неверный email или пароль");
  }
  const session = createSession("client", row.id);
  return { session, client: serializeClient(row) };
}

export function loginAdmin({ username, password }) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new ApiError(401, "invalid_credentials", "Неверный логин или пароль");
  }
  db.prepare("UPDATE admin_users SET last_login_at = ? WHERE id = ?").run(nowIso(), row.id);
  const session = createSession("admin", row.id);
  return { session, admin: { id: row.id, username: row.username } };
}

// Мастера не регистрируются сами — учётку (email/пароль) заводит
// администратор через POST/PATCH /api/admin/masters (server/src/masters.js),
// как и с admin_users. Здесь только вход.
export function loginMaster({ email, password }) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM masters WHERE email = ?").get(email);
  if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    throw new ApiError(401, "invalid_credentials", "Неверный email или пароль");
  }
  if (!row.is_active) throw new ApiError(403, "forbidden", "Учётная запись мастера отключена");
  const session = createSession("master", row.id);
  return { session, master: { id: row.id, name: row.name, email: row.email } };
}

export function logout(token) {
  deleteSession(token);
}
