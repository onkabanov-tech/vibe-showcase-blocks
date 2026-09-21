// Подключение к SQLite. Отвечает только за то, чтобы вернуть открытое
// соединение с файлом базы из папки server/data — никакой бизнес-логики.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { loadEnv, projectRoot } from "./env.js";

loadEnv();

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
    // SQLite не проверяет внешние ключи по умолчанию — включать нужно на
    // каждом соединении отдельно, иначе REFERENCES в схеме ничего не значат.
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}
