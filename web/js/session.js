// web/js/session.js
//
// Хранение токена сессии в браузере. Отдельно от api.js специально:
// api.js — только про обращения к серверу (правило 3 из
// docs/frontend-rules.md), а это — работа с localStorage, к серверу
// никак не относится.
//
// Куки сервер не ставит (server/src/routes/auth.routes.js отдаёт токен
// в теле JSON-ответа, Set-Cookie нигде не используется), поэтому токен
// приходится сохранять на стороне браузера самим — иначе после входа
// не с чем будет ходить в личный кабинет.

const STORAGE_KEY = "auth_session";

export function saveSession({ client, session }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ client, session }));
}

export function getSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return getSession()?.session?.token ?? null;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
