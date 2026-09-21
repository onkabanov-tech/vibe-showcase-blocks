-- Защита от пересечения записей одного мастера на уровне БД — последний
-- рубеж на случай гонки (два процесса/два запроса почти одновременно),
-- который не зависит от того, правильно ли отработал код приложения.
-- Условие пересечения ровно по ТЗ: начало одного визита раньше конца
-- другого, а конец одного визита позже начала другого. Записи впритык
-- (конец одной = начало другой) пересечением не считаются, потому что
-- сравнение строгое (<, >), а не нестрогое. Отменённые записи
-- (status = 'cancelled') слот не блокируют — оба триггера смотрят
-- только на активные записи и не реагируют, если сама вставляемая/
-- обновляемая запись отменена (WHEN NEW.status <> 'cancelled').
--
-- Сообщение об ошибке ('booking_overlap') — фиксированная строка, по
-- которой код приложения (server/src/bookings.js) отличает именно этот
-- конфликт от прочих ошибок SQLite и не показывает пользователю сырой
-- текст из базы. См. docs/db-notes.md.

CREATE TRIGGER trg_bookings_no_overlap_insert
BEFORE INSERT ON bookings
WHEN NEW.status <> 'cancelled'
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

-- Тот же самый триггер нужен и для UPDATE: перенос записи (starts_at/
-- ends_at) и смена мастера (master_id) — оба меняют строку через UPDATE,
-- а не INSERT, и оба обязаны пройти ту же проверку. Исключаем саму
-- обновляемую строку по id, иначе она бы "пересекалась сама с собой".
CREATE TRIGGER trg_bookings_no_overlap_update
BEFORE UPDATE ON bookings
WHEN NEW.status <> 'cancelled'
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
