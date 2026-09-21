import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { requireIntArray, requireIsoUtcDateTime, requireInt, requireIntParam } from "../validation.js";
import { createHold, releaseHold } from "../holds.js";
import { requireClient } from "../authz.js";

export function registerHoldsRoutes(router) {
  router.post("/api/holds", async (req, res) => {
    const client = requireClient(req);
    const body = await readJsonBody(req);
    const masterId = requireInt(body, "masterId", { min: 1 });
    const serviceIds = requireIntArray(body, "serviceIds");
    const startsAt = requireIsoUtcDateTime(body, "startsAt");

    const hold = createHold({ clientId: client.id, masterId, serviceIds, startsAt });
    sendJson(res, 201, { hold });
  });

  router.delete("/api/holds/:id", (req, res, params) => {
    const client = requireClient(req);
    const holdId = requireIntParam(params.id, "id");
    releaseHold({ holdId, clientId: client.id });
    sendJson(res, 204, undefined);
  });
}
