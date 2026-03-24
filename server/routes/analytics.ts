import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { insertMarketingCampaignSchema } from "@shared/schema";

export function registerAnalyticsRoutes(app: Express) {
  app.get('/api/payslip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = req.query.staffId ? parseInt(req.query.staffId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const payslipData = await storage.getPayslipData(userId, staffId, startDate, endDate);
      res.json(payslipData);
    } catch (error) {
      console.error("Error fetching payslip data:", error);
      res.status(500).json({ message: "Failed to fetch payslip data" });
    }
  });

  app.get('/api/marketing-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const campaigns = await storage.getMarketingCampaigns(req.user.id);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      res.status(500).json({ message: "Failed to fetch marketing campaigns" });
    }
  });

  app.post('/api/marketing-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const campaignData = insertMarketingCampaignSchema.parse({ ...req.body, userId: req.user.id });
      const campaign = await storage.createMarketingCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating marketing campaign:", error);
      res.status(500).json({ message: "Failed to create marketing campaign" });
    }
  });

  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics(req.user.id, req.query.dateRange as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/business-hours', isAuthenticated, async (req: any, res) => {
    try {
      const hours = await storage.getBusinessHours(req.user.id);
      res.json(hours);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  app.post('/api/business-hours', isAuthenticated, async (req: any, res) => {
    try {
      const { hours } = req.body;
      if (!Array.isArray(hours)) return res.status(400).json({ message: "Hours must be an array" });
      const hoursArray = hours.map((hour: any) => ({ ...hour, userId: req.user.id }));
      const savedHours = await storage.upsertBusinessHours(hoursArray);
      res.json(savedHours);
    } catch (error) {
      console.error("Error saving business hours:", error);
      res.status(500).json({ message: "Failed to save business hours" });
    }
  });

  app.get('/api/staff/:id/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const staffId = parseInt(req.params.id);
      const procedures = await storage.getStaffProcedures(staffId, effectiveUserId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching staff procedures:", error);
      res.status(500).json({ message: "Failed to fetch staff procedures" });
    }
  });
}
