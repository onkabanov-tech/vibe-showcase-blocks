// Прогоняет .sql-файлы из src/migrations по порядку имён и запоминает,
// какие уже применены, в служебной таблице schema_migrations.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import url from "node:url";
import { getDb } from "./db.js";
import { nowIso } from "./time.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function appliedMigrations(db) {
  const rows = db.prepare("SELECT id FROM schema_migrations").all();
  return new Set(rows.map((row) => row.id));
}

function run() {
  const db = getDb();
  ensureMigrationsTable(db);
  const applied = appliedMigrations(db);

  const pending = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log("Миграции не нужны — база уже актуальна.");
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Применяю миграцию: ${file}`);
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run(
        file,
        nowIso(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  console.log("Готово.");
}

run();
