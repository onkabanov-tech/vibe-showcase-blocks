import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import {
  requireInt,
  requireIntArray,
  requireIsoUtcDateTime,
  optionalString,
  requireIntParam,
} from "../validation.js";
import {
  createBooking,
  listClientBookings,
  getClientBookingOrThrow,
  rescheduleBooking,
  cancelBooking,
} from "../bookings.js";
import { requireClient } from "../authz.js";

export function registerBookingsRoutes(router) {
  router.post("/api/bookings", async (req, res) => {
    const client = requireClient(req);
    const body = await readJsonBody(req);
    const masterId = requireInt(body, "masterId", { min: 1 });
    const serviceIds = requireIntArray(body, "serviceIds");
    const startsAt = requireIsoUtcDateTime(body, "startsAt");
    const holdId = body.holdId === undefined || body.holdId === null ? null : requireInt(body, "holdId", { min: 1 });
    const comment = optionalString(body, "comment", { maxLength: 1000 });

    const booking = createBooking({ clientId: client.id, masterId, serviceIds, startsAt, holdId, comment });
    sendJson(res, 201, { booking });
  });

  router.get("/api/bookings", (req, res) => {
    const client = requireClient(req);
    sendJson(res, 200, { bookings: listClientBookings(client.id) });
  });

  router.get("/api/bookings/:id", (req, res, params) => {
    const client = requireClient(req);
    const bookingId = requireIntParam(params.id, "id");
    sendJson(res, 200, { booking: getClientBookingOrThrow(bookingId, client.id) });
  });

  router.post("/api/bookings/:id/reschedule", async (req, res, params) => {
    const client = requireClient(req);
    const bookingId = requireIntParam(params.id, "id");
    const body = await readJsonBody(req);
    const startsAt = requireIsoUtcDateTime(body, "startsAt");

    const booking = rescheduleBooking({ bookingId, clientId: client.id, startsAt });
    sendJson(res, 200, { booking });
  });

  router.post("/api/bookings/:id/cancel", (req, res, params) => {
    const client = requireClient(req);
    const bookingId = requireIntParam(params.id, "id");
    const booking = cancelBooking({ bookingId, clientId: client.id });
    sendJson(res, 200, { booking });
  });
}
