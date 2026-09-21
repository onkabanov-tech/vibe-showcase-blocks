import { getDb } from "./db.js";
import { nowIso } from "./time.js";
import { ApiError } from "./http/respond.js";

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: !!row.is_active,
  };
}

export function listMasters({ includeInactive = false } = {}) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, name, description, is_active FROM masters
       ${includeInactive ? "" : "WHERE is_active = 1"}
       ORDER BY id`,
    )
    .all();
  return rows.map(serialize);
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

export function createMaster(input) {
  const db = getDb();
  const now = nowIso();
  const id = db
    .prepare("INSERT INTO masters (name, description, is_active, created_at) VALUES (?, ?, ?, ?)")
    .run(input.name, input.description, input.isActive ? 1 : 0, now).lastInsertRowid;
  return serialize(db.prepare("SELECT * FROM masters WHERE id = ?").get(id));
}

export function updateMaster(id, patch) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM masters WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "not_found", "Мастер не найден");

  const next = {
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    is_active: patch.isActive === undefined ? existing.is_active : patch.isActive ? 1 : 0,
  };
  db.prepare("UPDATE masters SET name=?, description=?, is_active=? WHERE id=?").run(
    next.name,
    next.description,
    next.is_active,
    id,
  );
  return serialize(db.prepare("SELECT * FROM masters WHERE id = ?").get(id));
}

export function softDeleteMaster(id) {
  const db = getDb();
  const result = db.prepare("UPDATE masters SET is_active = 0 WHERE id = ?").run(id);
  if (result.changes === 0) throw new ApiError(404, "not_found", "Мастер не найден");
}
