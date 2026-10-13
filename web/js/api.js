// web/js/api.js
//
// Единственное место в проекте, где происходят обращения к серверу.
// Правило 3 из docs/frontend-rules.md: внутри страниц запросов быть не должно —
// страницы импортируют функции отсюда и работают только с готовыми данными
// или с объектом ошибки.

// Адрес сервера задан здесь одной константой, чтобы поменять его в одном
// месте, если сервер будет запущен не локально и не на этом порту
// (см. server/.env.example — PORT=3000).

const API_BASE_URL = "https://vibe-showcase-blocks.onrender.com";
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

async function apiRequest(method, path, body, token) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
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

// GET /api/masters/:masterId/availability — свободное время мастера на
// конкретную дату для суммы выбранных услуг. Возвращает
// { masterId, date, totalDurationMinutes, workingHours, busy, slots }.
export async function getAvailability(masterId, date, serviceIds) {
  const query = serviceIds.join(",");
  return apiRequest("GET", `/api/masters/${masterId}/availability?date=${date}&serviceIds=${query}`);
}

// GET /api/bookings — записи вошедшего клиента. Требует токен сессии.
export async function getMyBookings(token) {
  const data = await apiRequest("GET", "/api/bookings", undefined, token);
  return data.bookings;
}

// POST /api/bookings/:id/cancel — требует токен сессии; сервер сам
// проверяет, что запись принадлежит этому клиенту (иначе 403).
export async function cancelBookingRequest(bookingId, token) {
  const data = await apiRequest("POST", `/api/bookings/${bookingId}/cancel`, {}, token);
  return data.booking;
}
// POST /api/bookings — создать запись. Требует токен сессии.
// Возвращает объект booking с полями code, status, startsAt, services, master.
export async function createBooking({ masterId, serviceIds, startsAt, comment }, token) {
  const body = { masterId, serviceIds, startsAt };
  if (comment) body.comment = comment;
  const data = await apiRequest("POST", "/api/bookings", body, token);
  return data.booking;
}
// POST /api/auth/login — возвращает { client, session } при успехе.
export async function loginClient({ email, password }) {
  return apiRequest("POST", "/api/auth/login", { email, password });
}

// POST /api/auth/register — возвращает { client, session } при успехе.
export async function registerClient({ name, email, password, contact }) {
  return apiRequest("POST", "/api/auth/register", { name, email, password, contact });
}

// POST /api/auth/logout — требует токен сессии клиента (Authorization: Bearer).
export async function logoutClient(token) {
  return apiRequest("POST", "/api/auth/logout", undefined, token);
}
// POST /api/admin/login — вход администратора. Возвращает { admin, session }.
export async function loginAdmin({ username, password }) {
  return apiRequest("POST", "/api/admin/login", { username, password });
}

// POST /api/admin/logout — выход администратора.
export async function logoutAdmin(token) {
  return apiRequest("POST", "/api/admin/logout", undefined, token);
}

// GET /api/admin/bookings — все записи (для админки).
export async function getAllBookings(token, { status } = {}) {
  const query = status ? `?status=${status}` : "";
  const data = await apiRequest("GET", `/api/admin/bookings${query}`, undefined, token);
  return data.bookings;
}

// POST /api/admin/bookings/:id/status — сменить статус записи.
export async function setBookingStatus(bookingId, status, token) {
  const data = await apiRequest("POST", `/api/admin/bookings/${bookingId}/status`, { status }, token);
  return data.booking;
}
