// web/js/store.js
//
// Хранение выбора клиента в процессе записи (услуги, мастер — дальше сюда
// же лягут дата/время/контакты, когда дойдём до тех шагов), чтобы выбор не
// терялся между шагами и при перезагрузке страницы.
//
// Готового паттерна для этого в проекте не было: ни в web/, ни в черновом
// src/ файла store.js или чего-то подобного не существовало. Сделан по
// тому же принципу, что и web/js/session.js (простая обёртка над
// localStorage), — то есть "в стиле остального кода", раз копировать
// было неоткуда.

const STORAGE_KEY = "booking_draft";

function read() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function write(patch) {
  const next = { ...read(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getDraft() {
  return read();
}

export function setServiceIds(serviceIds) {
  return write({ serviceIds });
}

export function setMasterId(masterId) {
  return write({ masterId });
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}
