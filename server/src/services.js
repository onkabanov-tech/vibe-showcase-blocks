// Доступ к каталогу услуг: список (публичный/админский), создание,
// изменение и мягкое удаление (is_active = 0 — записи на услугу могли
// уже существовать, ON DELETE RESTRICT не даст удалить строку по-настоящему).
import { getDb } from "./db.js";
import { nowIso } from "./time.js";
import { ApiError } from "./http/respond.js";

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: row.price,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
  };
}

export function listServices({ includeInactive = false } = {}) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, name, description, duration_minutes, price, is_active, sort_order
       FROM services
       ${includeInactive ? "" : "WHERE is_active = 1"}
       ORDER BY sort_order, id`,
    )
    .all();
  return rows.map(serialize);
}

export function getServicesByIds(ids) {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, name, description, duration_minutes, price, is_active, sort_order
       FROM services WHERE id IN (${placeholders})`,
    )
    .all(...ids);
  if (rows.length !== ids.length) {
    throw new ApiError(400, "invalid_field", "Одна или несколько услуг не найдены", { field: "serviceIds" });
  }
  const inactive = rows.filter((r) => !r.is_active);
  if (inactive.length > 0) {
    throw new ApiError(400, "invalid_field", "Одна или несколько услуг больше не доступны", {
      field: "serviceIds",
    });
  }
  return rows;
}

export function createService(input) {
  const db = getDb();
  const now = nowIso();
  try {
    const id = db
      .prepare(
        `INSERT INTO services (name, description, duration_minutes, price, is_active, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.name,
        input.description,
        input.durationMinutes,
        input.price,
        input.isActive ? 1 : 0,
        input.sortOrder,
        now,
      ).lastInsertRowid;
    return serialize(db.prepare("SELECT * FROM services WHERE id = ?").get(id));
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed: services.name")) {
      throw new ApiError(409, "name_taken", "Услуга с таким названием уже существует");
    }
    throw error;
  }
}

export function updateService(id, patch) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "not_found", "Услуга не найдена");

  const next = {
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    duration_minutes: patch.durationMinutes ?? existing.duration_minutes,
    price: patch.price ?? existing.price,
    is_active: patch.isActive === undefined ? existing.is_active : patch.isActive ? 1 : 0,
    sort_order: patch.sortOrder ?? existing.sort_order,
  };

  try {
    db.prepare(
      `UPDATE services SET name=?, description=?, duration_minutes=?, price=?, is_active=?, sort_order=?
       WHERE id=?`,
    ).run(next.name, next.description, next.duration_minutes, next.price, next.is_active, next.sort_order, id);
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed: services.name")) {
      throw new ApiError(409, "name_taken", "Услуга с таким названием уже существует");
    }
    throw error;
  }
  return serialize(db.prepare("SELECT * FROM services WHERE id = ?").get(id));
}

export function softDeleteService(id) {
  const db = getDb();
  const result = db.prepare("UPDATE services SET is_active = 0 WHERE id = ?").run(id);
  if (result.changes === 0) throw new ApiError(404, "not_found", "Услуга не найдена");
}
