// Проверка входных данных до обращения к базе. Каждая функция либо
// возвращает нормализованное значение, либо бросает ApiError(400, ...).
import { ApiError } from "./http/respond.js";

function invalid(field, message) {
  throw new ApiError(400, "invalid_field", message, { field });
}

export function requireString(body, field, { minLength = 1, maxLength = 255 } = {}) {
  const value = body[field];
  if (typeof value !== "string") invalid(field, `Поле "${field}" обязательно и должно быть строкой`);
  const trimmed = value.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    invalid(field, `Поле "${field}" должно быть длиной от ${minLength} до ${maxLength} символов`);
  }
  return trimmed;
}

export function optionalString(body, field, opts = {}) {
  if (body[field] === undefined || body[field] === null) return null;
  return requireString(body, field, opts);
}

export function requireEmail(body, field = "email") {
  const value = requireString(body, field, { maxLength: 255 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    invalid(field, "Некорректный email");
  }
  return value.toLowerCase();
}

export function requirePassword(body, field = "password") {
  const value = body[field];
  if (typeof value !== "string" || value.length < 8 || value.length > 200) {
    invalid(field, "Пароль должен быть от 8 до 200 символов");
  }
  return value;
}

export function optionalEmail(body, field = "email") {
  if (body[field] === undefined || body[field] === null) return undefined;
  return requireEmail(body, field);
}

export function optionalPassword(body, field = "password") {
  if (body[field] === undefined || body[field] === null) return undefined;
  return requirePassword(body, field);
}

export function requireInt(body, field, { min, max } = {}) {
  const value = body[field];
  if (!Number.isInteger(value)) invalid(field, `Поле "${field}" должно быть целым числом`);
  if (min !== undefined && value < min) invalid(field, `Поле "${field}" должно быть не меньше ${min}`);
  if (max !== undefined && value > max) invalid(field, `Поле "${field}" должно быть не больше ${max}`);
  return value;
}

export function optionalBoolean(body, field, fallback) {
  const value = body[field];
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") invalid(field, `Поле "${field}" должно быть true/false`);
  return value;
}

export function requireIntArray(body, field, { minItems = 1 } = {}) {
  const value = body[field];
  if (!Array.isArray(value) || value.length < minItems || !value.every(Number.isInteger)) {
    invalid(field, `Поле "${field}" должно быть непустым массивом целых чисел`);
  }
  return [...new Set(value)];
}

const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function requireIsoUtcDateTime(body, field) {
  const value = body[field];
  if (typeof value !== "string" || !ISO_UTC_RE.test(value) || Number.isNaN(Date.parse(value))) {
    invalid(field, `Поле "${field}" должно быть датой-временем в UTC вида YYYY-MM-DDTHH:MM:SSZ`);
  }
  return value;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function requireIsoDateParam(value, field) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    invalid(field, `Параметр "${field}" должен быть датой вида YYYY-MM-DD`);
  }
  return value;
}

export function requireIntParam(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n)) invalid(field, `Параметр "${field}" должен быть целым числом`);
  return n;
}

export function requireIntListParam(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    invalid(field, `Параметр "${field}" обязателен и должен быть списком id через запятую`);
  }
  const ids = value.split(",").map((part) => Number(part.trim()));
  if (ids.length === 0 || ids.some((n) => !Number.isInteger(n))) {
    invalid(field, `Параметр "${field}" должен быть списком целых чисел через запятую`);
  }
  return [...new Set(ids)];
}
