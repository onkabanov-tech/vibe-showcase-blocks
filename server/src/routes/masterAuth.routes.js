import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { requireEmail, requirePassword } from "../validation.js";
import { loginMaster, logout } from "../auth.js";
import { bearerToken, requireMaster } from "../authz.js";

export function registerMasterAuthRoutes(router) {
  // Мастера не регистрируются сами — учётку заводит администратор
  // (POST/PATCH /api/admin/masters). Здесь только вход/выход.
  router.post("/api/master/login", async (req, res) => {
    const body = await readJsonBody(req);
    const email = requireEmail(body);
    const password = requirePassword(body);

    const { session, master } = loginMaster({ email, password });
    sendJson(res, 200, { master, session: { token: session.token, expiresAt: session.expiresAt } });
  });

  router.post("/api/master/logout", async (req, res) => {
    requireMaster(req);
    logout(bearerToken(req));
    sendJson(res, 204, undefined);
  });
}
