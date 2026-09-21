import { readJsonBody } from "../http/body.js";
import { sendJson, ApiError } from "../http/respond.js";
import { requireString, requireEmail, requirePassword } from "../validation.js";
import { registerClient, loginClient, logout } from "../auth.js";
import { bearerToken, requireClient } from "../authz.js";

export function registerAuthRoutes(router) {
  // Регистрация клиента: создаёт аккаунт (пароль сразу хешируется) и
  // возвращает токен сессии — клиент сразу авторизован.
  router.post("/api/auth/register", async (req, res) => {
    const body = await readJsonBody(req);
    const name = requireString(body, "name", { maxLength: 200 });
    const email = requireEmail(body);
    const password = requirePassword(body);
    const contact = requireString(body, "contact", { maxLength: 200 });

    const { session, client } = registerClient({ name, email, password, contact });
    sendJson(res, 201, { client, session: { token: session.token, expiresAt: session.expiresAt } });
  });

  router.post("/api/auth/login", async (req, res) => {
    const body = await readJsonBody(req);
    const email = requireEmail(body);
    const password = requirePassword(body);

    const { session, client } = loginClient({ email, password });
    sendJson(res, 200, { client, session: { token: session.token, expiresAt: session.expiresAt } });
  });

  router.post("/api/auth/logout", async (req, res) => {
    requireClient(req); // 401/403 если не залогинен как клиент
    logout(bearerToken(req));
    sendJson(res, 204, undefined);
  });
}
