// Хеширование паролей для admin_users.password_hash. Только хеш — сам
// пароль в базу никогда не попадает (docs/db-schema.md, требование 5).
import { randomBytes, scryptSync } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}
