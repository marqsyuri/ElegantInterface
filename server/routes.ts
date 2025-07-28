import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertClientSchema,
  insertServiceSchema,
  insertAppointmentSchema,
  insertClinicalRecordSchema,
  insertTransactionSchema,
  insertMessageSchema,
  insertFeedbackSchema,
  insertInventorySchema,
  insertLoyaltyPackageSchema,
  insertStaffSchema,
  insertStaffScheduleSchema,
  insertNotificationSchema,
  insertMarketingCampaignSchema,
  insertSustainabilityLogSchema,
  insertPaymentSchema,
  insertSocialMediaPostSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, updates);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Service routes
  app.get('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const services = await storage.getServices(userId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const serviceData = insertServiceSchema.parse({ ...req.body, userId });
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const appointments = await storage.getAppointments(userId, date);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate image data if present
      const { beforeImages = [], afterImages = [], ...restData } = req.body;
      
      // Validate image arrays
      const validateImages = (images: any[], type: string) => {
        if (!Array.isArray(images)) {
          throw new Error(`${type} must be an array`);
        }
        return images.filter(img => typeof img === 'string' && img.startsWith('data:image/'));
      };
      
      const validBeforeImages = validateImages(beforeImages, 'beforeImages');
      const validAfterImages = validateImages(afterImages, 'afterImages');
      
      const appointmentData = insertAppointmentSchema.parse({ 
        ...restData, 
        userId,
        beforeImages: validBeforeImages,
        afterImages: validAfterImages
      });
      
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Clinical records routes
  app.get('/api/clinical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const records = await storage.getClinicalRecords(userId, clientId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching clinical records:", error);
      res.status(500).json({ message: "Failed to fetch clinical records" });
    }
  });

  app.post('/api/clinical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordData = insertClinicalRecordSchema.parse({ ...req.body, userId });
      const record = await storage.createClinicalRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error creating clinical record:", error);
      res.status(500).json({ message: "Failed to create clinical record" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const transactions = await storage.getTransactions(userId, startDate, endDate);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionData = insertTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, userId });
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Feedback routes
  app.get('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedback = await storage.getFeedback(userId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedbackData = insertFeedbackSchema.parse({ ...req.body, userId });
      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inventory = await storage.getInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertInventorySchema.parse({ ...req.body, userId });
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Loyalty package routes
  app.get('/api/loyalty-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packages = await storage.getLoyaltyPackages(userId);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching loyalty packages:", error);
      res.status(500).json({ message: "Failed to fetch loyalty packages" });
    }
  });

  app.post('/api/loyalty-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packageData = insertLoyaltyPackageSchema.parse({ ...req.body, userId });
      const loyaltyPackage = await storage.createLoyaltyPackage(packageData);
      res.json(loyaltyPackage);
    } catch (error) {
      console.error("Error creating loyalty package:", error);
      res.status(500).json({ message: "Failed to create loyalty package" });
    }
  });

  app.get('/api/client-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientPackages = await storage.getClientPackages(userId);
      res.json(clientPackages);
    } catch (error) {
      console.error("Error fetching client packages:", error);
      res.status(500).json({ message: "Failed to fetch client packages" });
    }
  });

  // Staff routes
  app.get('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const staff = await storage.getStaff(userId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const staffData = insertStaffSchema.parse({ ...req.body, userId });
      const staff = await storage.createStaff(staffData);
      res.json(staff);
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ message: "Failed to create staff" });
    }
  });

  // Staff schedules routes
  app.get('/api/staff-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schedules = await storage.getStaffSchedules(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching staff schedules:", error);
      res.status(500).json({ message: "Failed to fetch staff schedules" });
    }
  });

  app.post('/api/staff-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const scheduleData = insertStaffScheduleSchema.parse(req.body);
      const schedule = await storage.createStaffSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating staff schedule:", error);
      res.status(500).json({ message: "Failed to create staff schedule" });
    }
  });

  // Marketing campaigns routes
  app.get('/api/marketing-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getMarketingCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      res.status(500).json({ message: "Failed to fetch marketing campaigns" });
    }
  });

  app.post('/api/marketing-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertMarketingCampaignSchema.parse({ ...req.body, userId });
      const campaign = await storage.createMarketingCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating marketing campaign:", error);
      res.status(500).json({ message: "Failed to create marketing campaign" });
    }
  });

  // Sustainability logs routes
  app.get('/api/sustainability-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getSustainabilityLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sustainability logs:", error);
      res.status(500).json({ message: "Failed to fetch sustainability logs" });
    }
  });

  app.post('/api/sustainability-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logData = insertSustainabilityLogSchema.parse({ ...req.body, userId });
      const log = await storage.createSustainabilityLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating sustainability log:", error);
      res.status(500).json({ message: "Failed to create sustainability log" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dateRange = req.query.dateRange as string;
      const analytics = await storage.getAnalytics(userId, dateRange);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
