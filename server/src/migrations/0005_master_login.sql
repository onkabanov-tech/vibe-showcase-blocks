-- Роль "мастер": собственный вход и собственное создание записи — через
-- то же ядро createBookingCore, что и у клиента с администратором (см.
-- server/src/bookings.js). До этой миграции у masters вообще не было
-- полей для логина, а sessions.actor_type допускал только 'client'/
-- 'admin' — мастер физически не мог ничего создать сам.

ALTER TABLE masters ADD COLUMN email TEXT;
ALTER TABLE masters ADD COLUMN password_hash TEXT;
CREATE UNIQUE INDEX ux_masters_email ON masters(email);

-- sessions.actor_type — CHECK-ограничение с фиксированным списком
-- значений; SQLite не даёт изменить CHECK через ALTER TABLE, только
-- пересоздать таблицу (стандартная процедура из документации SQLite для
-- изменений схемы, которые ALTER TABLE не поддерживает напрямую).
-- AUTOINCREMENT-нумерация не сбрасывается: копируем существующие id
-- явно, INSERT с явным id того же INTEGER PRIMARY KEY AUTOINCREMENT
-- обновляет sqlite_sequence так же, как обычная вставка.
ALTER TABLE sessions RENAME TO sessions_old;

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  token      TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('client', 'admin', 'master')),
  actor_id   INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

INSERT INTO sessions (id, token, actor_type, actor_id, created_at, expires_at)
  SELECT id, token, actor_type, actor_id, created_at, expires_at FROM sessions_old;

DROP TABLE sessions_old;

CREATE UNIQUE INDEX ux_sessions_token ON sessions(token);
CREATE INDEX ix_sessions_actor ON sessions(actor_type, actor_id);
CREATE INDEX ix_sessions_expires_at ON sessions(expires_at);
