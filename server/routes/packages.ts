import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertPackageSchema } from "@shared/schema";

export function registerPackageRoutes(app: Express) {
  app.get('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packagesList = await storage.getPackages(userId);
      res.json(packagesList);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.get('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageId = parseInt(req.params.id);
      const packageData = await storage.getPackage(packageId, userId);
      
      if (!packageData) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      res.json(packageData);
    } catch (error) {
      console.error("Error fetching package:", error);
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });

  app.post('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageData = insertPackageSchema.parse({
        ...req.body,
        userId,
      });
      const newPackage = await storage.createPackage(packageData);
      res.json(newPackage);
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: error.message || "Failed to create package" });
    }
  });

  app.put('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageId = parseInt(req.params.id);
      
      // Verify package belongs to user
      const existingPackage = await storage.getPackage(packageId, userId);
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      const packageData = insertPackageSchema.partial().parse(req.body);
      const updatedPackage = await storage.updatePackage(packageId, packageData);
      res.json(updatedPackage);
    } catch (error: any) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: error.message || "Failed to update package" });
    }
  });

  app.delete('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageId = parseInt(req.params.id);
      
      // Verify package belongs to user
      const existingPackage = await storage.getPackage(packageId, userId);
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      await storage.deletePackage(packageId);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

}
