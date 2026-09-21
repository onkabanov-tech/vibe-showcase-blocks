// Единый формат ошибки и отправки JSON-ответа для всего API.
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendJson(res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(payload);
}

export function sendError(res, error) {
  if (error instanceof ApiError) {
    sendJson(res, error.status, {
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }
  console.error(error);
  sendJson(res, 500, { error: { code: "internal_error", message: "Внутренняя ошибка сервера" } });
}
