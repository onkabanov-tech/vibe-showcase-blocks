-- Расширяет схему из docs/db-schema.md по явному запросу: несколько
-- мастеров, полноценные аккаунты клиентов, удержания слотов на время
-- оформления и запись на несколько услуг сразу. Решения и их обоснование
-- см. docs/db-notes.md, раздел «Журнал изменений» (запись после 0001).

-- === Мастера ===============================================================
CREATE TABLE masters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);

-- === Аккаунты клиентов ======================================================
-- Nullable: у исходных клиентов (name+contact без аккаунта) этих полей нет.
-- Для новых регистраций email/password_hash обязательны — это проверяется
-- в коде приложения (src/validation.js), а не на уровне колонки, потому что
-- ALTER TABLE ADD COLUMN в SQLite не может задним числом сделать колонку
-- NOT NULL на непустой таблице без значения по умолчанию.
ALTER TABLE clients ADD COLUMN email TEXT;
ALTER TABLE clients ADD COLUMN password_hash TEXT;
CREATE UNIQUE INDEX ux_clients_email ON clients(email);

-- === Сессии (клиенты и администраторы) =====================================
CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  token      TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('client', 'admin')),
  actor_id   INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_sessions_token ON sessions(token);
CREATE INDEX ix_sessions_actor ON sessions(actor_type, actor_id);
CREATE INDEX ix_sessions_expires_at ON sessions(expires_at);

-- === Привязка графика/блокировок/записей к мастеру =========================
ALTER TABLE work_schedule ADD COLUMN master_id INTEGER REFERENCES masters(id);
DROP INDEX ux_work_schedule_weekday;
CREATE UNIQUE INDEX ux_work_schedule_master_weekday ON work_schedule(master_id, weekday);

ALTER TABLE schedule_blocks ADD COLUMN master_id INTEGER REFERENCES masters(id);
DROP INDEX ix_schedule_blocks_range;
CREATE INDEX ix_schedule_blocks_master_range ON schedule_blocks(master_id, starts_at, ends_at);

ALTER TABLE bookings ADD COLUMN master_id INTEGER REFERENCES masters(id);
DROP INDEX ux_bookings_active_start;
DROP INDEX ix_bookings_starts_at;
-- Уникальность времени начала теперь проверяется в разрезе мастера: два
-- разных мастера вполне могут принимать в один и тот же момент.
CREATE UNIQUE INDEX ux_bookings_master_active_start
  ON bookings(master_id, starts_at) WHERE status <> 'cancelled';
CREATE INDEX ix_bookings_master_starts_at ON bookings(master_id, starts_at);

-- === Запись на несколько услуг сразу =======================================
-- service_id был один на bookings; переносим связь в отдельную таблицу,
-- чтобы одна запись могла включать несколько услуг с суммарной длительностью.
CREATE TABLE booking_services (
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  PRIMARY KEY (booking_id, service_id)
);
INSERT INTO booking_services (booking_id, service_id)
  SELECT id, service_id FROM bookings WHERE service_id IS NOT NULL;

DROP INDEX IF EXISTS ix_bookings_service_id;
ALTER TABLE bookings DROP COLUMN service_id;

-- === Удержание слота на время оформления ===================================
CREATE TABLE slot_holds (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id  INTEGER NOT NULL REFERENCES masters(id),
  client_id  INTEGER NOT NULL REFERENCES clients(id),
  starts_at  TEXT NOT NULL,
  ends_at    TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_slot_holds_master_range ON slot_holds(master_id, starts_at, ends_at);
CREATE INDEX ix_slot_holds_expires_at ON slot_holds(expires_at);

CREATE TABLE slot_hold_services (
  hold_id    INTEGER NOT NULL REFERENCES slot_holds(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  PRIMARY KEY (hold_id, service_id)
);
