// Подключение к SQLite. Отвечает только за то, чтобы вернуть открытое
// соединение с файлом базы из папки server/data — никакой бизнес-логики.
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// .env — необязателен: в проде переменные обычно приходят из окружения
// напрямую, а не из файла.
const envPath = path.join(projectRoot, ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const dbPath = process.env.DB_PATH ?? "./data/app.db";
const resolvedPath = dbPath === ":memory:" ? dbPath : path.resolve(projectRoot, dbPath);

if (resolvedPath !== ":memory:") {
  mkdirSync(path.dirname(resolvedPath), { recursive: true });
}

let db;

// Одно соединение на процесс: SQLite — это файл, а не сетевой сервис,
// плодить пул подключений незачем.
export function getDb() {
  if (!db) {
    db = new DatabaseSync(resolvedPath);
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}
