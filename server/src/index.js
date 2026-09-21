// Точка входа HTTP-сервера. Запуск: npm start (см. package.json).
import { createServer } from "node:http";
import { loadEnv } from "./env.js";
import { handleRequest } from "./app.js";
import { purgeExpiredSessions } from "./sessions.js";
import { purgeExpiredHolds } from "./holds.js";

loadEnv();

const PORT = Number(process.env.PORT ?? 3000);

const server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error("Необработанная ошибка запроса:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    }
    res.end(JSON.stringify({ error: { code: "internal_error", message: "Внутренняя ошибка сервера" } }));
  });
});

// Долгоживущий процесс (в отличие от migrate/seed) — можно позволить себе
// периодическую подчистку истёкших сессий и удержаний слотов, а не только
// ленивую чистку "по факту обращения".
const CLEANUP_INTERVAL_MS = 60_000;
const cleanupTimer = setInterval(() => {
  try {
    purgeExpiredSessions();
    purgeExpiredHolds();
  } catch (error) {
    console.error("Ошибка фоновой очистки:", error);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

server.listen(PORT, () => {
  console.log(`API слушает на http://localhost:${PORT}`);
});
