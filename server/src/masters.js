import { getDb } from "./db.js";
import { nowIso } from "./time.js";
import { hashPassword } from "./password.js";
import { ApiError } from "./http/respond.js";

// Публичный вид (каталог мастеров на лендинге/в записи) — без email.
// email — это логин мастера для входа, а не публичная информация о нём;
// раньше он по ошибке уходил в общий serialize() и был виден в открытом
// GET /api/masters кому угодно без авторизации.
function serializePublic(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: !!row.is_active,
  };
}

// Админский вид — плюс email, админу он нужен, чтобы знать/менять логин мастера.
function serializeAdmin(row) {
  return { ...serializePublic(row), email: row.email ?? null };
}

function throwIfEmailTaken(error) {
  if (String(error.message).includes("UNIQUE constraint failed: masters.email")) {
    throw new ApiError(409, "email_taken", "Этот email уже используется другим мастером");
  }
  throw error;
}

// Публичный каталог — только активные мастера, без email.
export function listMasters() {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, name, description, is_active FROM masters WHERE is_active = 1 ORDER BY id")
    .all();
  return rows.map(serializePublic);
}

// Для админки — все мастера (включая неактивных) и с email.
export function listMastersForAdmin() {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, name, description, email, is_active FROM masters ORDER BY id")
    .all();
  return rows.map(serializeAdmin);
}

export function getMasterOrThrow(id, { requireActive = false } = {}) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM masters WHERE id = ?").get(id);
  if (!row) throw new ApiError(400, "invalid_field", "Мастер не найден", { field: "masterId" });
  if (requireActive && !row.is_active) {
    throw new ApiError(400, "invalid_field", "Мастер больше не принимает записи", { field: "masterId" });
  }
  return row;
}

// Мастера не регистрируются сами — учётку (email/пароль) заводит и меняет
// администратор здесь же, при создании/редактировании мастера. Оба поля
// необязательны: можно завести мастера без входа в систему (как раньше)
// и включить ему логин позже через updateMaster.
export function createMaster(input) {
  const db = getDb();
  const now = nowIso();
  const passwordHash = input.password ? hashPassword(input.password) : null;
  try {
    const id = db
      .prepare(
        "INSERT INTO masters (name, description, email, password_hash, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(input.name, input.description, input.email ?? null, passwordHash, input.isActive ? 1 : 0, now)
      .lastInsertRowid;
    return serializeAdmin(db.prepare("SELECT * FROM masters WHERE id = ?").get(id));
  } catch (error) {
    throwIfEmailTaken(error);
  }
}

export function updateMaster(id, patch) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM masters WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "not_found", "Мастер не найден");

  const next = {
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    email: patch.email === undefined ? existing.email : patch.email,
    password_hash: patch.password ? hashPassword(patch.password) : existing.password_hash,
    is_active: patch.isActive === undefined ? existing.is_active : patch.isActive ? 1 : 0,
  };
  try {
    db.prepare("UPDATE masters SET name=?, description=?, email=?, password_hash=?, is_active=? WHERE id=?").run(
      next.name,
      next.description,
      next.email,
      next.password_hash,
      next.is_active,
      id,
    );
  } catch (error) {
    throwIfEmailTaken(error);
  }
  return serializeAdmin(db.prepare("SELECT * FROM masters WHERE id = ?").get(id));
}

export function softDeleteMaster(id) {
  const db = getDb();
  const result = db.prepare("UPDATE masters SET is_active = 0 WHERE id = ?").run(id);
  if (result.changes === 0) throw new ApiError(404, "not_found", "Мастер не найден");
}
