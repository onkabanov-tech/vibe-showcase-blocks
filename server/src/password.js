// Хеширование паролей для admin_users.password_hash, clients.password_hash
// и masters.password_hash (и для тех же полей в тестовых данных — seed.js
// хеширует пароли через эту же функцию, отдельного пути там нет). Только
// хеш и соль — сам пароль в базу никогда не попадает (docs/db-schema.md,
// требование 5).
//
// scrypt из встроенного node:crypto, а не bcrypt/argon2: те — нативные
// модули, собираются под конкретную платформу/ABI при установке, а на
// дешёвом хостинге вроде Beget нет гарантии, что там будет чем их
// собрать (см. docs/db-notes.md, почему это же соображение уже определило
// выбор драйвера SQLite). scrypt в node:crypto — часть самого Node.js,
// собирать нечего.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
// Параметр стойкости scrypt (N — объём CPU/памяти на один хеш, степень
// двойки). Хранится в самом хеше (формат ниже), а не берётся из этой
// константы при проверке — так более позднее увеличение стойкости для
// новых паролей не сломает проверку уже сохранённых хешей со старым N.
const SCRYPT_COST = 16384;

// Формат: scrypt:<N>:<соль-hex>:<хеш-hex>. Соль генерируется заново на
// каждый вызов (randomBytes(16)) — у двух одинаковых паролей разных
// пользователей получатся разные хеши.
export function hashPassword(password, cost = SCRYPT_COST) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH, { N: cost }).toString("hex");
  return `scrypt:${cost}:${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const [scheme, costRaw, salt, hashHex] = stored.split(":");
  const cost = Number(costRaw);
  if (scheme !== "scrypt" || !Number.isInteger(cost) || cost <= 0 || !salt || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  let actual;
  try {
    actual = scryptSync(password, salt, expected.length, { N: cost });
  } catch {
    // Некорректный N (не степень двойки, требует больше maxmem и т.п.) —
    // трактуем как "не совпало", а не роняем запрос входа с 500-й.
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
