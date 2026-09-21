// Тестовые/демонстрационные данные для локальной разработки.
// Скрипт идемпотентен: перед вставкой очищает те же таблицы, которые заполняет,
// так что его можно запускать повторно. Не трогает schema_migrations.
import { getDb } from "./db.js";
import { nowIso, toIso } from "./time.js";
import { hashPassword } from "./password.js";

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

const MASTERS = [
  {
    name: "Олег Кабанов",
    description: "Продуктовый дизайнер — консультации по UX и дизайн-системам.",
    email: "oleg.kabanov@example.com",
  },
  { name: "Анна Светлова", description: "UX-дизайнер — аудит интерфейсов и прототипов.", email: null },
];

// weekday: 0 = воскресенье … 6 = суббота, как в docs/db-schema.md.
function buildWeek(workingWeekdays, startTime, endTime) {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    start_time: workingWeekdays.includes(weekday) ? startTime : "00:00",
    end_time: workingWeekdays.includes(weekday) ? endTime : "00:00",
    is_working: workingWeekdays.includes(weekday) ? 1 : 0,
  }));
}

const WORK_SCHEDULE_BY_MASTER = {
  "Олег Кабанов": buildWeek([1, 2, 3, 4, 5], "10:00", "18:00"), // Пн-Пт
  "Анна Светлова": buildWeek([2, 3, 4, 5, 6], "11:00", "19:00"), // Вт-Сб
};

// Те же вымышленные имена, что уже используются как мок-данные в
// prototypes/booking-prototype/Booking Prototype.dc.html, плюс один новый
// клиент и запись на несколько услуг сразу — показать booking_services.
const CLIENTS_AND_BOOKINGS = [
  {
    client: { name: "Анна Волкова", email: "anna.volkova@example.com", contact: "+7 999 123-45-67" },
    masterName: "Олег Кабанов",
    serviceNames: ["Персональная консультация"],
    startsAt: "2026-09-24T14:30:00Z",
    status: "confirmed",
  },
  {
    client: { name: "Дмитрий Орлов", email: "dmitry.orlov@example.com", contact: "dmitry.orlov@mail.ru" },
    masterName: "Олег Кабанов",
    serviceNames: ["UX-аудит интерфейса"],
    startsAt: "2026-09-26T11:30:00Z",
    status: "pending",
  },
  {
    client: { name: "Мария Соколова", email: "maria.sokolova@example.com", contact: "+7 916 555-22-11" },
    masterName: "Олег Кабанов",
    serviceNames: ["Аудит дизайн-системы"],
    startsAt: "2026-09-25T16:00:00Z",
    status: "cancelled",
  },
  {
    client: { name: "Игорь Петров", email: "igor.petrov@example.com", contact: "+7 903 777-88-99" },
    masterName: "Анна Светлова",
    serviceNames: ["Персональная консультация", "Разбор прототипа"],
    startsAt: "2026-09-29T12:00:00Z",
    status: "pending",
  },
];

function run() {
  const db = getDb();
  const now = nowIso();

  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM booking_services");
    db.exec("DELETE FROM slot_hold_services");
    db.exec("DELETE FROM slot_holds");
    db.exec("DELETE FROM bookings");
    db.exec("DELETE FROM sessions");
    db.exec("DELETE FROM clients");
    db.exec("DELETE FROM schedule_blocks");
    db.exec("DELETE FROM work_schedule");
    db.exec("DELETE FROM masters");
    db.exec("DELETE FROM services");
    db.exec("DELETE FROM admin_users");

    const insertService = db.prepare(`
      INSERT INTO services (name, description, duration_minutes, price, is_active, sort_order, created_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `);
    for (const s of SERVICES) {
      insertService.run(s.name, s.description, s.duration_minutes, s.price, s.sort_order, now);
    }
    const serviceByName = new Map(
      db.prepare("SELECT id, name, duration_minutes FROM services").all().map((row) => [row.name, row]),
    );

    // Один мастер с логином (Олег), один без — показывает, что
    // email/password_hash в masters действительно необязательны: мастер
    // без учётки по-прежнему обычная запись в каталоге, как и раньше.
    const masterPassword = process.env.SEED_MASTER_PASSWORD || "changeme";
    const insertMaster = db.prepare(`
      INSERT INTO masters (name, description, email, password_hash, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)
    `);
    const masterByName = new Map();
    for (const m of MASTERS) {
      const passwordHash = m.email ? hashPassword(masterPassword) : null;
      const id = insertMaster.run(m.name, m.description, m.email, passwordHash, now).lastInsertRowid;
      masterByName.set(m.name, id);
    }

    const insertSchedule = db.prepare(`
      INSERT INTO work_schedule (master_id, weekday, start_time, end_time, is_working)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const [masterName, days] of Object.entries(WORK_SCHEDULE_BY_MASTER)) {
      const masterId = masterByName.get(masterName);
      for (const d of days) {
        insertSchedule.run(masterId, d.weekday, d.start_time, d.end_time, d.is_working);
      }
    }

    const clientPassword = process.env.SEED_CLIENT_PASSWORD || "changeme";
    const insertClient = db.prepare(`
      INSERT INTO clients (name, contact, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)
    `);
    const insertBooking = db.prepare(`
      INSERT INTO bookings (code, client_id, master_id, starts_at, ends_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBookingService = db.prepare(`
      INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)
    `);

    let bookingNumber = 1042;
    for (const entry of CLIENTS_AND_BOOKINGS) {
      const clientId = insertClient.run(
        entry.client.name,
        entry.client.contact,
        entry.client.email,
        hashPassword(clientPassword),
        now,
      ).lastInsertRowid;

      const masterId = masterByName.get(entry.masterName);
      const services = entry.serviceNames.map((name) => serviceByName.get(name));
      const totalDurationMinutes = services.reduce((sum, s) => sum + s.duration_minutes, 0);
      const endsAt = toIso(new Date(new Date(entry.startsAt).getTime() + totalDurationMinutes * 60_000));

      const bookingId = insertBooking.run(
        `BK-${bookingNumber++}`,
        clientId,
        masterId,
        entry.startsAt,
        endsAt,
        entry.status,
        now,
        now,
      ).lastInsertRowid;

      for (const service of services) insertBookingService.run(bookingId, service.id);
    }

    const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme";
    db.prepare(`
      INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)
    `).run(adminUsername, hashPassword(adminPassword), now);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  console.log(
    "Тестовые данные добавлены: services, masters (один с логином), work_schedule, clients, bookings, booking_services, admin_users.",
  );
}

run();
