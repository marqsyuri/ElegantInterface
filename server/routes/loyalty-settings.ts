import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertLoyaltySettingsSchema } from "@shared/schema";

export function registerLoyaltySettingsRoutes(app: Express) {
  app.get('/api/loyalty-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getLoyaltySettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching loyalty settings:", error);
      res.status(500).json({ message: "Failed to fetch loyalty settings" });
    }
  });

  app.post('/api/loyalty-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settingsData = insertLoyaltySettingsSchema.parse(req.body);
      const settings = await storage.upsertLoyaltySettings(userId, settingsData);
      res.json(settings);
    } catch (error: any) {
      console.error("Error saving loyalty settings:", error);
      res.status(500).json({ message: error.message || "Failed to save loyalty settings" });
    }
  });

  app.put('/api/loyalty-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settingsData = insertLoyaltySettingsSchema.partial().parse(req.body);
      const settings = await storage.upsertLoyaltySettings(userId, settingsData);
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating loyalty settings:", error);
      res.status(500).json({ message: error.message || "Failed to update loyalty settings" });
    }
  });

  // Calculate loyalty points for a client
  app.get('/api/loyalty-points/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = parseInt(req.params.clientId);
      const points = await storage.calculateClientLoyaltyPoints(clientId, userId);
      res.json({ points });
    } catch (error) {
      console.error("Error calculating loyalty points:", error);
      res.status(500).json({ message: "Failed to calculate loyalty points" });
    }
  });

}
