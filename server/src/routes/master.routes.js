import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { requireInt, requireIntArray, requireIsoUtcDateTime, optionalString } from "../validation.js";
import { masterCreateBooking } from "../bookings.js";
import { getClientOrThrow } from "../clients.js";
import { requireMaster } from "../authz.js";

export function registerMasterRoutes(router) {
  // masterId для записи берётся из сессии, а не из тела запроса — мастер
  // может создать запись только на самого себя, не "от имени" другого
  // мастера. overrideOverlap здесь не читается вовсе (см. bookings.js,
  // masterCreateBooking) — это осталось только админской возможностью.
  router.post("/api/master/bookings", async (req, res) => {
    const master = requireMaster(req);
    const body = await readJsonBody(req);
    const clientId = requireInt(body, "clientId", { min: 1 });
    getClientOrThrow(clientId);
    const serviceIds = requireIntArray(body, "serviceIds");
    const startsAt = requireIsoUtcDateTime(body, "startsAt");
    const comment = optionalString(body, "comment", { maxLength: 1000 });

    const booking = masterCreateBooking({ masterId: master.id, clientId, serviceIds, startsAt, comment });
    sendJson(res, 201, { booking });
  });
}
