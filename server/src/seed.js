// Тестовые/демонстрационные данные для локальной разработки.
// Скрипт идемпотентен: перед вставкой очищает те же таблицы, которые заполняет,
// так что его можно запускать повторно. Не трогает schema_migrations.
import { getDb } from "./db.js";
import { nowIso, toIso } from "./time.js";

const SERVICES = [
  {
    name: "UX-аудит интерфейса",
    description: "Разбор вашего продукта и рекомендации по улучшению UX.",
    duration_minutes: 60,
    price: 800000, // 8 000 ₽ в копейках
    sort_order: 1,
  },
  {
    name: "Персональная консультация",
    description: "Обсуждение задачи, вопросы по дизайну и стратегии.",
    duration_minutes: 45,
    price: 500000, // 5 000 ₽
    sort_order: 2,
  },
  {
    name: "Аудит дизайн-системы",
    description: "Проверка компонентов и гайдлайнов на масштабируемость.",
    duration_minutes: 90,
    price: 1200000, // 12 000 ₽
    sort_order: 3,
  },
  {
    name: "Разбор прототипа",
    description: "Проверка пользовательских сценариев и логики флоу.",
    duration_minutes: 60,
    price: 700000, // 7 000 ₽
    sort_order: 4,
  },
];

// Пн-Пт рабочие, Вс/Сб — выходные (0 = воскресенье, как в docs/db-schema.md).
const WORK_SCHEDULE = [
  { weekday: 0, start_time: "00:00", end_time: "00:00", is_working: 0 },
  { weekday: 1, start_time: "10:00", end_time: "18:00", is_working: 1 },
  { weekday: 2, start_time: "10:00", end_time: "18:00", is_working: 1 },
  { weekday: 3, start_time: "10:00", end_time: "18:00", is_working: 1 },
  { weekday: 4, start_time: "10:00", end_time: "18:00", is_working: 1 },
  { weekday: 5, start_time: "10:00", end_time: "18:00", is_working: 1 },
  { weekday: 6, start_time: "00:00", end_time: "00:00", is_working: 0 },
];

// Те же вымышленные имена, что уже используются как мок-данные в
// prototypes/booking-prototype/Booking Prototype.dc.html.
const BOOKINGS = [
  {
    client: { name: "Анна Волкова", contact: "+7 999 123-45-67" },
    serviceName: "Персональная консультация",
    startsAt: "2026-09-24T14:30:00Z",
    status: "confirmed",
  },
  {
    client: { name: "Дмитрий Орлов", contact: "dmitry.orlov@mail.ru" },
    serviceName: "UX-аудит интерфейса",
    startsAt: "2026-09-26T11:30:00Z",
    status: "pending",
  },
  {
    client: { name: "Мария Соколова", contact: "+7 916 555-22-11" },
    serviceName: "Аудит дизайн-системы",
    startsAt: "2026-09-25T16:00:00Z",
    status: "cancelled",
  },
];

function run() {
  const db = getDb();
  const now = nowIso();

  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM bookings");
    db.exec("DELETE FROM clients");
    db.exec("DELETE FROM schedule_blocks");
    db.exec("DELETE FROM work_schedule");
    db.exec("DELETE FROM services");

    const insertService = db.prepare(`
      INSERT INTO services (name, description, duration_minutes, price, is_active, sort_order, created_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `);
    for (const s of SERVICES) {
      insertService.run(s.name, s.description, s.duration_minutes, s.price, s.sort_order, now);
    }

    const insertSchedule = db.prepare(`
      INSERT INTO work_schedule (weekday, start_time, end_time, is_working)
      VALUES (?, ?, ?, ?)
    `);
    for (const d of WORK_SCHEDULE) {
      insertSchedule.run(d.weekday, d.start_time, d.end_time, d.is_working);
    }

    const insertClient = db.prepare(`
      INSERT INTO clients (name, contact, created_at) VALUES (?, ?, ?)
    `);
    const insertBooking = db.prepare(`
      INSERT INTO bookings (code, client_id, service_id, starts_at, ends_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const serviceByName = new Map(
      db.prepare("SELECT id, name, duration_minutes FROM services").all().map((row) => [row.name, row]),
    );

    let bookingNumber = 1042;
    for (const b of BOOKINGS) {
      const clientId = insertClient.run(b.client.name, b.client.contact, now).lastInsertRowid;
      const service = serviceByName.get(b.serviceName);
      const endsAt = toIso(
        new Date(new Date(b.startsAt).getTime() + service.duration_minutes * 60_000),
      );

      insertBooking.run(
        `BK-${bookingNumber++}`,
        clientId,
        service.id,
        b.startsAt,
        endsAt,
        b.status,
        now,
        now,
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  console.log("Тестовые данные добавлены: services, work_schedule, clients, bookings.");
}

run();
