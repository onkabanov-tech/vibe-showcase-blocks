// Единый формат даты-времени для всей БД: ISO-8601 UTC без миллисекунд
// (см. docs/db-schema.md, раздел 5) — например "2026-09-24T14:30:00Z".
export function toIso(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function nowIso() {
  return toIso(new Date());
}
