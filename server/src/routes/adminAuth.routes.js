import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { requireString, requirePassword } from "../validation.js";
import { loginAdmin, logout } from "../auth.js";
import { bearerToken, requireAdmin } from "../authz.js";

export function registerAdminAuthRoutes(router) {
  router.post("/api/admin/login", async (req, res) => {
    const body = await readJsonBody(req);
    const username = requireString(body, "username", { maxLength: 200 });
    const password = requirePassword(body);

    const { session, admin } = loginAdmin({ username, password });
    sendJson(res, 200, { admin, session: { token: session.token, expiresAt: session.expiresAt } });
  });

  router.post("/api/admin/logout", async (req, res) => {
    requireAdmin(req);
    logout(bearerToken(req));
    sendJson(res, 204, undefined);
  });
}
