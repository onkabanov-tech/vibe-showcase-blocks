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

export class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiGet(path) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch (networkError) {
    // fetch бросает исключение, когда сервер вообще недоступен
    // (не запущен, неверный адрес, CORS-блокировка браузером и т.п.)
    throw new ApiError("Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.");
  }

  if (!response.ok) {
    throw new ApiError("Сервер ответил с ошибкой. Попробуйте обновить страницу.");
  }

  return response.json();
}

// GET /api/services — публичный список услуг (без авторизации).
export async function getServices() {
  const data = await apiGet("/api/services");
  return data.services;
}

// GET /api/masters — публичный список мастеров (без авторизации).
export async function getMasters() {
  const data = await apiGet("/api/masters");
  return data.masters;
}
