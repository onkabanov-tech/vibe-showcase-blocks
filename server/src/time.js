// Единый формат даты-времени для всей БД: ISO-8601 UTC без миллисекунд
// (см. docs/db-schema.md, раздел 5) — например "2026-09-24T14:30:00Z".
export function toIso(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function nowIso() {
  return toIso(new Date());
}

// Часовой пояс салона как фиксированное смещение в минутах от UTC (например,
// 180 = UTC+3, Москва). Один часовой пояс на весь бизнес — то же допущение,
// что и в docs/db-schema.md §5/§9: work_schedule.start_time/end_time — это
// местное время салона, а не UTC.
export const SALON_UTC_OFFSET_MINUTES = Number(process.env.SALON_UTC_OFFSET_MINUTES ?? 180);

function pad2(n) {
  return String(n).padStart(2, "0");
}

// "2026-09-24" + "10:00" (местное время салона) -> ISO-8601 UTC.
export function salonLocalToUtcIso(dateStr, hhmm) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const utcMs = Date.UTC(y, mo - 1, d, hh, mm, 0) - SALON_UTC_OFFSET_MINUTES * 60_000;
  return toIso(new Date(utcMs));
}

// ISO-8601 UTC -> { date, weekday, hhmm } в местном времени салона.
// weekday: 0 = воскресенье … 6 = суббота, как в work_schedule.weekday.
export function utcIsoToSalonLocalParts(isoUtc) {
  const localMs = new Date(isoUtc).getTime() + SALON_UTC_OFFSET_MINUTES * 60_000;
  const d = new Date(localMs);
  return {
    date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    weekday: d.getUTCDay(),
    hhmm: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`,
  };
}

// Календарный день недели самой даты — не зависит от часового пояса
// (0 = воскресенье, как в work_schedule.weekday).
export function weekdayOfDate(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

// "2026-09-28" -> "2026-09-29".
export function nextDateStr(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d + 1));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}
