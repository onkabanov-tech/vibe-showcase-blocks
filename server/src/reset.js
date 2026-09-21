// Пересоздаёт базу с нуля: удаляет файл БД (и его -wal/-shm/-journal
// спутники), затем заново прогоняет все миграции с чистого листа.
// Отличие от migrate.js: тот только доливает недостающие миграции поверх
// существующего файла, этот стирает файл целиком.
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import url from "node:url";
import { loadEnv, projectRoot } from "./env.js";

loadEnv();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH ?? "./data/app.db";

if (dbPath === ":memory:") {
  console.log("DB_PATH=:memory: — удалять нечего, каждый запуск и так начинает с пустой базы.");
} else {
  const resolvedPath = path.resolve(projectRoot, dbPath);
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = resolvedPath + suffix;
    if (existsSync(file)) {
      rmSync(file);
      console.log(`Удалён файл: ${path.relative(projectRoot, file)}`);
    }
  }
}

console.log("Применяю миграции на чистую базу...");
execFileSync(process.execPath, [path.join(__dirname, "migrate.js")], { stdio: "inherit" });
console.log("База пересоздана с нуля.");
