import { getDb } from "./db.js";
import { ApiError } from "./http/respond.js";

// Нужен только для admin.routes.js (создание записи от имени клиента) —
// полноценного CRUD клиентов не строим, его никто не просил.
export function getClientOrThrow(id) {
  const client = getDb().prepare("SELECT id, name, contact FROM clients WHERE id = ?").get(id);
  if (!client) throw new ApiError(400, "invalid_field", "Клиент не найден", { field: "clientId" });
  return client;
}
