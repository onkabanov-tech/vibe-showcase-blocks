// web/js/api.js
//
// Единственное место в проекте, где происходят обращения к серверу.
// Правило 3 из docs/frontend-rules.md: внутри страниц запросов быть не должно —
// страницы импортируют функции отсюда и работают только с готовыми данными
// или с объектом ошибки.

// Адрес сервера задан здесь одной константой, чтобы поменять его в одном
// месте, если сервер будет запущен не локально и не на этом порту
// (см. server/.env.example — PORT=3000).
const API_BASE_URL = "http://localhost:3000";

// code и field — реальные code/details.field из ответа сервера
// (см. server/src/http/respond.js: { error: { code, message, details } }),
// а не выдуманные на фронте. field заполнен только когда сервер
// действительно указал, в каком поле проблема (ошибка validation.js,
// code "invalid_field") — для остальных ошибок (неверный пароль, email
// уже занят, слишком много попыток) сервер поле не называет, и здесь
// оно тоже останется пустым, а не будет угадано.
export class ApiError extends Error {
  constructor(message, { code, field } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.field = field;
  }
}

async function apiRequest(method, path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // fetch бросает исключение, когда сервер вообще недоступен
    // (не запущен, неверный адрес, CORS-блокировка браузером и т.п.)
    throw new ApiError("Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const serverError = payload?.error;
    throw new ApiError(
      serverError?.message || "Сервер ответил с ошибкой. Попробуйте обновить страницу.",
      { code: serverError?.code, field: serverError?.details?.field }
    );
  }

  return payload;
}

// GET /api/services — публичный список услуг (без авторизации).
export async function getServices() {
  const data = await apiRequest("GET", "/api/services");
  return data.services;
}

// GET /api/masters — публичный список мастеров (без авторизации).
export async function getMasters() {
  const data = await apiRequest("GET", "/api/masters");
  return data.masters;
}

// POST /api/auth/login — возвращает { client, session } при успехе.
export async function loginClient({ email, password }) {
  return apiRequest("POST", "/api/auth/login", { email, password });
}

// POST /api/auth/register — возвращает { client, session } при успехе.
export async function registerClient({ name, email, password, contact }) {
  return apiRequest("POST", "/api/auth/register", { name, email, password, contact });
}
