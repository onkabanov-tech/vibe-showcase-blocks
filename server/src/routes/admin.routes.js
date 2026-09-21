import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import {
  requireString,
  optionalString,
  requireInt,
  requireIntArray,
  requireIsoUtcDateTime,
  optionalBoolean,
  optionalEmail,
  optionalPassword,
  requireIntParam,
} from "../validation.js";
import { requireAdmin } from "../authz.js";
import { listAllBookings, adminSetBookingStatus, adminCreateBooking } from "../bookings.js";
import { getClientOrThrow } from "../clients.js";
import { listServices, createService, updateService, softDeleteService } from "../services.js";
import { listMastersForAdmin, createMaster, updateMaster, softDeleteMaster } from "../masters.js";

export function registerAdminRoutes(router) {
  // --- Записи ---------------------------------------------------------

  // Единственное место во всём API, где читается overrideOverlap — сразу
  // за проверкой роли. Клиентский POST /api/bookings (routes/bookings.routes.js)
  // это поле из тела запроса не читает вовсе, так что передать его клиенту
  // нечем: пришли бы им хоть overrideOverlap:true, хоть что угодно ещё —
  // это тело обрабатывает другой обработчик с другим набором полей, и
  // никакого пути от него к adminCreateBooking() нет.
  router.post("/api/admin/bookings", async (req, res) => {
    requireAdmin(req); // 401/403 — см. server/src/authz.js
    const body = await readJsonBody(req);
    const clientId = requireInt(body, "clientId", { min: 1 });
    getClientOrThrow(clientId);
    const masterId = requireInt(body, "masterId", { min: 1 });
    const serviceIds = requireIntArray(body, "serviceIds");
    const startsAt = requireIsoUtcDateTime(body, "startsAt");
    const comment = optionalString(body, "comment", { maxLength: 1000 });
    const overrideOverlap = optionalBoolean(body, "overrideOverlap", false);

    const booking = adminCreateBooking({ clientId, masterId, serviceIds, startsAt, comment, overrideOverlap });
    sendJson(res, 201, { booking });
  });

  router.get("/api/admin/bookings", (req, res, params, query) => {
    requireAdmin(req);
    const status = query.get("status") || undefined;
    const masterIdRaw = query.get("masterId");
    const masterId = masterIdRaw ? requireIntParam(masterIdRaw, "masterId") : undefined;
    sendJson(res, 200, { bookings: listAllBookings({ status, masterId }) });
  });

  router.post("/api/admin/bookings/:id/status", async (req, res, params) => {
    requireAdmin(req);
    const bookingId = requireIntParam(params.id, "id");
    const body = await readJsonBody(req);
    const status = requireString(body, "status", { maxLength: 20 });
    const booking = adminSetBookingStatus({ bookingId, status });
    sendJson(res, 200, { booking });
  });

  // --- Услуги -----------------------------------------------------------
  router.get("/api/admin/services", (req, res) => {
    requireAdmin(req);
    sendJson(res, 200, { services: listServices({ includeInactive: true }) });
  });

  router.post("/api/admin/services", async (req, res) => {
    requireAdmin(req);
    const body = await readJsonBody(req);
    const input = {
      name: requireString(body, "name", { maxLength: 200 }),
      description: requireString(body, "description", { maxLength: 2000 }),
      durationMinutes: requireInt(body, "durationMinutes", { min: 1, max: 24 * 60 }),
      price: requireInt(body, "price", { min: 0 }),
      isActive: optionalBoolean(body, "isActive", true),
      sortOrder: body.sortOrder === undefined ? 0 : requireInt(body, "sortOrder", { min: 0 }),
    };
    sendJson(res, 201, { service: createService(input) });
  });

  router.patch("/api/admin/services/:id", async (req, res, params) => {
    requireAdmin(req);
    const id = requireIntParam(params.id, "id");
    const body = await readJsonBody(req);
    const patch = {
      name: body.name === undefined ? undefined : requireString(body, "name", { maxLength: 200 }),
      description:
        body.description === undefined ? undefined : requireString(body, "description", { maxLength: 2000 }),
      durationMinutes:
        body.durationMinutes === undefined ? undefined : requireInt(body, "durationMinutes", { min: 1, max: 24 * 60 }),
      price: body.price === undefined ? undefined : requireInt(body, "price", { min: 0 }),
      isActive: body.isActive === undefined ? undefined : optionalBoolean(body, "isActive", undefined),
      sortOrder: body.sortOrder === undefined ? undefined : requireInt(body, "sortOrder", { min: 0 }),
    };
    sendJson(res, 200, { service: updateService(id, patch) });
  });

  router.delete("/api/admin/services/:id", (req, res, params) => {
    requireAdmin(req);
    const id = requireIntParam(params.id, "id");
    softDeleteService(id); // мягкое удаление: is_active = 0, строка остаётся (на неё ссылаются bookings)
    sendJson(res, 204, undefined);
  });

  // --- Мастера ------------------------------------------------------------
  router.get("/api/admin/masters", (req, res) => {
    requireAdmin(req);
    sendJson(res, 200, { masters: listMastersForAdmin() });
  });

  router.post("/api/admin/masters", async (req, res) => {
    requireAdmin(req);
    const body = await readJsonBody(req);
    const input = {
      name: requireString(body, "name", { maxLength: 200 }),
      description: optionalString(body, "description", { maxLength: 2000 }),
      isActive: optionalBoolean(body, "isActive", true),
      // email/password — необязательны: заводят вход мастеру, если он
      // им нужен. Без них мастер остаётся как раньше — просто запись в
      // каталоге, на которую можно ссылаться, но которая сама войти не может.
      email: optionalEmail(body, "email"),
      password: optionalPassword(body, "password"),
    };
    sendJson(res, 201, { master: createMaster(input) });
  });

  router.patch("/api/admin/masters/:id", async (req, res, params) => {
    requireAdmin(req);
    const id = requireIntParam(params.id, "id");
    const body = await readJsonBody(req);
    const patch = {
      name: body.name === undefined ? undefined : requireString(body, "name", { maxLength: 200 }),
      description:
        body.description === undefined ? undefined : optionalString(body, "description", { maxLength: 2000 }),
      isActive: body.isActive === undefined ? undefined : optionalBoolean(body, "isActive", undefined),
      email: optionalEmail(body, "email"),
      password: optionalPassword(body, "password"),
    };
    sendJson(res, 200, { master: updateMaster(id, patch) });
  });

  router.delete("/api/admin/masters/:id", (req, res, params) => {
    requireAdmin(req);
    const id = requireIntParam(params.id, "id");
    softDeleteMaster(id); // мягкое удаление: is_active = 0
    sendJson(res, 204, undefined);
  });
}
