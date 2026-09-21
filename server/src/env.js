// Общая загрузка .env для остальных скриптов (db.js, reset.js).
import { existsSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");

let loaded = false;

export function loadEnv() {
  if (loaded) return;
  loaded = true;
  const envPath = path.join(projectRoot, ".env");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}
