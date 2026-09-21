import { sendJson } from "../http/respond.js";
import { listServices } from "../services.js";
import { listMasters } from "../masters.js";

export function registerCatalogRoutes(router) {
  router.get("/api/services", (req, res) => {
    sendJson(res, 200, { services: listServices() });
  });

  router.get("/api/masters", (req, res) => {
    sendJson(res, 200, { masters: listMasters() });
  });
}
