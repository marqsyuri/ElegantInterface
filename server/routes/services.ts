import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { insertServiceSchema } from "@shared/schema";

export function registerServiceRoutes(app: Express) {
  app.get('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const services = await storage.getServices(effectiveUserId.toString());
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const serviceData = insertServiceSchema.parse({ ...req.body, userId: effectiveUserId.toString() });
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });
}
