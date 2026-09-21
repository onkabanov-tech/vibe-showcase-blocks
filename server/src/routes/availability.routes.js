import { sendJson } from "../http/respond.js";
import { requireIntParam, requireIsoDateParam, requireIntListParam } from "../validation.js";
import { computeAvailability } from "../availability.js";

export function registerAvailabilityRoutes(router) {
  router.get("/api/masters/:masterId/availability", (req, res, params, query) => {
    const masterId = requireIntParam(params.masterId, "masterId");
    const date = requireIsoDateParam(query.get("date"), "date");
    const serviceIds = requireIntListParam(query.get("serviceIds"), "serviceIds");

    const result = computeAvailability({ masterId, date, serviceIds });
    sendJson(res, 200, result);
  });
}
