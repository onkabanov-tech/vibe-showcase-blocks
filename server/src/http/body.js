import { ApiError } from "./respond.js";

const MAX_BODY_BYTES = 1_000_000;

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new ApiError(400, "payload_too_large", "Тело запроса слишком большое"));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on("end", () => {
      if (!data.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(data);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          reject(new ApiError(400, "invalid_json", "Тело запроса должно быть JSON-объектом"));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new ApiError(400, "invalid_json", "Некорректный JSON в теле запроса"));
      }
    });
    req.on("error", reject);
  });
}
