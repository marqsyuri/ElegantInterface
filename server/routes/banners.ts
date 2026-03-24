import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../auth";
import { insertBannerSchema } from "@shared/schema";

export function registerBannerRoutes(app: Express) {
  app.get('/api/banners', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const banners = await storage.getBanners(userId);
      res.json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  app.get('/api/banners/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const banner = await storage.getActiveBanner(userId);
      res.json(banner);
    } catch (error) {
      console.error("Error fetching active banner:", error);
      res.status(500).json({ message: "Failed to fetch active banner" });
    }
  });

  app.get('/api/banners/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bannerId = parseInt(req.params.id);
      const banners = await storage.getBanners(userId);
      const banner = banners.find(b => b.id === bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      res.json(banner);
    } catch (error) {
      console.error("Error fetching banner:", error);
      res.status(500).json({ message: "Failed to fetch banner" });
    }
  });

  app.post('/api/banners', isAuthenticated, async (req: any, res) => {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create banners" });
      }

      const userId = req.user.id;
      const bannerData = insertBannerSchema.parse({
        ...req.body,
        userId,
      });
      const banner = await storage.createBanner(bannerData);
      res.json(banner);
    } catch (error) {
      console.error("Error creating banner:", error);
      res.status(500).json({ message: "Failed to create banner" });
    }
  });

  app.put('/api/banners/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update banners" });
      }

      const userId = req.user.id;
      const bannerId = parseInt(req.params.id);
      
      // Verificar se o banner pertence ao usuário
      const banners = await storage.getBanners(userId);
      const banner = banners.find(b => b.id === bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      const bannerData = insertBannerSchema.partial().parse(req.body);
      const updatedBanner = await storage.updateBanner(bannerId, bannerData);
      res.json(updatedBanner);
    } catch (error) {
      console.error("Error updating banner:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  app.delete('/api/banners/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete banners" });
      }

      const userId = req.user.id;
      const bannerId = parseInt(req.params.id);
      
      // Verificar se o banner pertence ao usuário
      const banners = await storage.getBanners(userId);
      const banner = banners.find(b => b.id === bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      await storage.deleteBanner(bannerId);
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ message: "Failed to delete banner" });
    }
  });

  // Public route for login banner (no authentication required)
  app.get('/api/public/login-banner', async (req, res) => {
    try {
      const banner = await storage.getPublicLoginBanner();
      res.json(banner);
    } catch (error) {
      console.error("Error fetching public login banner:", error);
      res.status(500).json({ message: "Failed to fetch login banner" });
    }
  });

}
