-- Осознанное наложение записей администратором поверх занятого времени.
-- Флаг может выставить только код, обслуживающий POST /api/admin/bookings
-- (server/src/routes/admin.routes.js, за requireAdmin) — единственное
-- место во всём коде, которое вообще читает overrideOverlap из тела
-- запроса. Клиентский путь создания записи (POST /api/bookings) это
-- поле из запроса не читает вовсе, поэтому передать его клиенту нечем:
-- значение всегда 0, что бы ни было в теле запроса.
ALTER TABLE bookings ADD COLUMN override_overlap INTEGER NOT NULL DEFAULT 0
  CHECK (override_overlap IN (0, 1));

-- Наложение работает "в одну сторону": помеченная запись сама может лечь
-- поверх уже занятого времени, но не разрешает никому другому залезть
-- поверх неё — для этого триггеры пропускают проверку только когда флаг
-- стоит у ВСТАВЛЯЕМОЙ/ОБНОВЛЯЕМОЙ строки (NEW.override_overlap = 0 в
-- WHEN), а сам EXISTS(...) по-прежнему смотрит на все активные записи
-- мастера независимо от их override_overlap.
DROP TRIGGER trg_bookings_no_overlap_insert;
DROP TRIGGER trg_bookings_no_overlap_update;

CREATE TRIGGER trg_bookings_no_overlap_insert
BEFORE INSERT ON bookings
WHEN NEW.status <> 'cancelled' AND NEW.override_overlap = 0
BEGIN
  SELECT RAISE(ABORT, 'booking_overlap')
  WHERE EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.master_id = NEW.master_id
      AND b.status <> 'cancelled'
      AND NEW.starts_at < b.ends_at
      AND NEW.ends_at > b.starts_at
  );
END;

CREATE TRIGGER trg_bookings_no_overlap_update
BEFORE UPDATE ON bookings
WHEN NEW.status <> 'cancelled' AND NEW.override_overlap = 0
BEGIN
  SELECT RAISE(ABORT, 'booking_overlap')
  WHERE EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.master_id = NEW.master_id
      AND b.status <> 'cancelled'
      AND b.id <> NEW.id
      AND NEW.starts_at < b.ends_at
      AND NEW.ends_at > b.starts_at
  );
END;

-- Тот же принцип для частичного уникального индекса: помеченные записи
-- в него не попадают, иначе точное совпадение starts_at с уже занятым
-- временем упёрлось бы в UNIQUE ещё до того, как дело дойдёт до триггера.
DROP INDEX ux_bookings_master_active_start;
CREATE UNIQUE INDEX ux_bookings_master_active_start
  ON bookings(master_id, starts_at) WHERE status <> 'cancelled' AND override_overlap = 0;
