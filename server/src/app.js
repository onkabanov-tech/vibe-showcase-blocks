import { createRouter } from "./http/router.js";
import { sendJson, sendError, ApiError } from "./http/respond.js";
import { registerAuthRoutes } from "./routes/auth.routes.js";
import { registerAdminAuthRoutes } from "./routes/adminAuth.routes.js";
import { registerCatalogRoutes } from "./routes/catalog.routes.js";
import { registerAvailabilityRoutes } from "./routes/availability.routes.js";
import { registerHoldsRoutes } from "./routes/holds.routes.js";
import { registerBookingsRoutes } from "./routes/bookings.routes.js";
import { registerAdminRoutes } from "./routes/admin.routes.js";

const router = createRouter();
router.get("/api/health", (req, res) => sendJson(res, 200, { ok: true }));
registerAuthRoutes(router);
registerAdminAuthRoutes(router);
registerCatalogRoutes(router);
registerAvailabilityRoutes(router);
registerHoldsRoutes(router);
registerBookingsRoutes(router);
registerAdminRoutes(router);

export async function handleRequest(req, res) {
  const url = new URL(req.url, "http://localhost");
  const match = router.match(req.method, url.pathname);
  if (!match) {
    sendJson(res, 404, { error: { code: "not_found", message: "Такого маршрута нет" } });
    return;
  }
  try {
    await match.handler(req, res, match.params, url.searchParams);
  } catch (error) {
    if (!(error instanceof ApiError) && res.headersSent) {
      // Ответ уже начал отправляться — соединение придётся просто закрыть.
      req.destroy();
      return;
    }
    sendError(res, error);
  }
}
