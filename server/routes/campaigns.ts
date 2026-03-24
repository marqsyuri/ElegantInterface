import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertCampaignSchema, insertSocialMediaPostSchema } from "@shared/schema";

export function registerCampaignRoutes(app: Express) {
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(userId, campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId, userId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post('/api/campaigns/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      
      // Verificar se a campanha pertence ao usuário
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Enviar a campanha
      await storage.sendCampaign(campaignId);
      
      res.json({ message: "Campaign sent successfully" });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.delete('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      
      // Verificar se a campanha pertence ao usuário
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await storage.deleteCampaign(campaignId, userId);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

}
