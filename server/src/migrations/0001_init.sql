-- Схема из docs/db-schema.md, раздел 8.

CREATE TABLE services (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price            INTEGER NOT NULL,
  is_active        INTEGER NOT NULL DEFAULT 1,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_services_name ON services(name);

CREATE TABLE clients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  contact    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_clients_contact ON clients(contact);

CREATE TABLE bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL,
  client_id   INTEGER NOT NULL REFERENCES clients(id),
  service_id  INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  comment     TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_bookings_code ON bookings(code);
CREATE UNIQUE INDEX ux_bookings_active_start
  ON bookings(starts_at) WHERE status <> 'cancelled';
CREATE INDEX ix_bookings_status     ON bookings(status);
CREATE INDEX ix_bookings_starts_at  ON bookings(starts_at);
CREATE INDEX ix_bookings_client_id  ON bookings(client_id);
CREATE INDEX ix_bookings_service_id ON bookings(service_id);

CREATE TABLE work_schedule (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time   TEXT NOT NULL,
  is_working INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_work_schedule_weekday ON work_schedule(weekday);

CREATE TABLE schedule_blocks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  starts_at  TEXT NOT NULL,
  ends_at    TEXT NOT NULL,
  reason     TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_schedule_blocks_range ON schedule_blocks(starts_at, ends_at);

CREATE TABLE admin_users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  last_login_at  TEXT
);
CREATE UNIQUE INDEX ux_admin_users_username ON admin_users(username);
