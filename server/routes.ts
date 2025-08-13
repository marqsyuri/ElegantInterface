import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { procedureStorage } from "./procedures";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
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
  insertProcedureSchema,
  updateProcedureSchema,
  insertPaymentSchema,
  insertSocialMediaPostSchema,
  users,
  clients,
  appointments,
  services,
  notifications,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, asc } from "drizzle-orm";

// Utility function to generate unique ID
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

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

  // Generate or regenerate public link
  app.post('/api/user/generate-public-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Generate a unique public link
      const publicLink = generateUniqueId();
      
      // Update user with new public link
      await db.update(users)
        .set({ publicLink, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ publicLink });
    } catch (error) {
      console.error("Error generating public link:", error);
      res.status(500).json({ message: "Failed to generate public link" });
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

  app.get('/api/clients/:clientId/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientId = parseInt(req.params.clientId);
      const appointments = await storage.getClientAppointments(userId, clientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching client appointments:", error);
      res.status(500).json({ message: "Failed to fetch client appointments" });
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

  app.get('/api/appointments/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = new Date(req.params.date);
      const appointments = await storage.getAppointments(userId, date);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
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
      
      // Convert appointmentDate string to Date object
      const appointmentDate = restData.appointmentDate ? new Date(restData.appointmentDate) : undefined;
      
      // Calculate total amount based on service/procedure price
      let totalAmount = 0;
      if (restData.serviceType === 'procedure') {
        const procedure = await procedureStorage.getProcedure(restData.serviceId, userId);
        totalAmount = parseFloat(procedure?.price || '0');
      } else {
        const services = await storage.getServices(userId);
        const selectedService = services.find(s => s.id === restData.serviceId);
        totalAmount = parseFloat(selectedService?.price || '0');
      }
      
      const appointmentData = insertAppointmentSchema.parse({ 
        ...restData, 
        appointmentDate,
        userId,
        totalAmount: totalAmount.toString(),
        paidAmount: '0',
        paymentStatus: 'pending',
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
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = insertAppointmentSchema.partial().parse(req.body);
      
      // If appointment is being marked as completed, deduct materials from inventory
      if (updates.status === 'completed') {
        const appointments = await storage.getAppointments(userId);
        const appointment = appointments.find(a => a.id === id);
        
        if (appointment && appointment.service && appointment.service.name) {
          const procedures = await procedureStorage.getProcedures(userId);
          const matchingProcedure = procedures.find(p => 
            p.name.toLowerCase() === appointment.service.name.toLowerCase()
          );
          
          if (matchingProcedure) {
            await procedureStorage.deductMaterialsForProcedure(matchingProcedure.id, userId);
          }
        }
      }
      
      const appointment = await storage.updateAppointment(id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Record payment for appointment
  app.post('/api/appointments/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = parseInt(req.params.id);
      const { amount, fullPayment } = req.body;
      
      // Get the appointment
      const appointments = await storage.getAppointments(userId);
      const appointment = appointments.find(a => a.id === appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      const totalAmount = parseFloat(appointment.totalAmount || '0');
      const currentPaid = parseFloat(appointment.paidAmount || '0');
      
      // Check if appointment is already fully paid
      if (currentPaid >= totalAmount && totalAmount > 0) {
        return res.status(400).json({ 
          message: 'Appointment is already fully paid',
          currentPaid,
          totalAmount 
        });
      }
      
      const paymentAmount = fullPayment ? (totalAmount - currentPaid) : parseFloat(amount);
      
      // Validate payment amount
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be greater than zero' });
      }
      
      // Check if payment exceeds outstanding balance
      const outstandingBalance = totalAmount - currentPaid;
      if (paymentAmount > outstandingBalance) {
        return res.status(400).json({ 
          message: `Payment amount (${paymentAmount}) exceeds outstanding balance (${outstandingBalance})`,
          outstandingBalance,
          paymentAmount 
        });
      }
      
      const newPaidAmount = currentPaid + paymentAmount;
      
      // Update appointment payment status
      let paymentStatus = 'partial';
      if (newPaidAmount >= totalAmount) {
        paymentStatus = 'paid';
      }
      
      // Update appointment
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        paidAmount: newPaidAmount.toString(),
        paymentStatus,
      });
      
      // Create financial transaction
      await storage.createTransaction({
        userId,
        clientId: appointment.clientId,
        appointmentId,
        type: 'income',
        description: `Payment for ${appointment.service.name} - ${appointment.client.name}`,
        amount: paymentAmount.toString(),
        transactionDate: new Date().toISOString().split('T')[0],
        category: 'Service Payment',
        isPaid: true,
      });
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ message: 'Failed to record payment' });
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

  app.put('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const staffId = parseInt(req.params.id);
      const staffData = insertStaffSchema.omit({ userId: true }).parse(req.body);
      const updatedStaff = await storage.updateStaff(staffId, userId, staffData);
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

  app.delete('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const staffId = parseInt(req.params.id);
      await storage.deleteStaff(staffId, userId);
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ message: "Failed to delete staff" });
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

  // Business hours routes
  app.get('/api/business-hours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hours = await storage.getBusinessHours(userId);
      res.json(hours);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  app.post('/api/business-hours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { hours } = req.body;
      
      if (!Array.isArray(hours)) {
        return res.status(400).json({ message: "Hours must be an array" });
      }
      
      const hoursArray = hours.map((hour: any) => ({
        ...hour,
        userId,
      }));
      const savedHours = await storage.upsertBusinessHours(hoursArray);
      res.json(savedHours);
    } catch (error) {
      console.error("Error saving business hours:", error);
      res.status(500).json({ message: "Failed to save business hours" });
    }
  });

  // Object storage routes for photo upload
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      console.log('Getting upload URL for user:', req.user?.claims?.sub);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('Generated upload URL:', uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ message: 'Failed to get upload URL', error: error.message });
    }
  });

  app.put('/api/profile-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { profileImageUrl } = req.body;
      
      if (!profileImageUrl) {
        return res.status(400).json({ message: 'Profile image URL is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        profileImageUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      // Update user profile with new image URL
      await storage.updateUserProfileImage(userId, objectPath);
      
      res.json({ message: 'Profile image updated successfully', objectPath });
    } catch (error) {
      console.error('Error updating profile image:', error);
      res.status(500).json({ message: 'Failed to update profile image' });
    }
  });

  app.put('/api/hero-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { heroImageUrl } = req.body;
      
      console.log('Updating hero image for user:', userId, 'with URL:', heroImageUrl);
      
      if (!heroImageUrl) {
        return res.status(400).json({ message: 'Hero image URL is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        heroImageUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      console.log('Object path after ACL policy:', objectPath);

      // Update user profile with new hero image URL
      await storage.updateUserHeroImage(userId, objectPath);
      
      console.log('Hero image updated successfully in database');
      res.json({ message: 'Hero image updated successfully', objectPath });
    } catch (error) {
      console.error('Error updating hero image:', error);
      res.status(500).json({ message: 'Failed to update hero image', error: error.message });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: "READ" as any,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Public API routes for client access (no authentication required)
  app.get('/api/public/company/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Get company info by public link
      const company = await storage.getUserByPublicLink(publicLink);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Get business hours
      const businessHours = await storage.getBusinessHours(company.id);
      
      // Get services
      const services = await storage.getServices(company.id);

      // Return public company information
      res.json({
        clinicName: company.clinicName,
        clinicAddress: company.clinicAddress,
        clinicPhone: company.clinicPhone,
        clinicWhatsapp: company.clinicWhatsapp,
        specialties: company.specialties,
        businessHours,
        services,
      });
    } catch (error) {
      console.error("Error fetching company info:", error);
      res.status(500).json({ message: "Failed to fetch company information" });
    }
  });

  app.post('/api/public/company/:publicLink/booking', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const bookingData = req.body;
      
      // Get company by public link
      const company = await storage.getUserByPublicLink(publicLink);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Create or find client
      let client = await db.select().from(clients)
        .where(and(
          eq(clients.email, bookingData.email),
          eq(clients.userId, company.id)
        ));

      if (client.length === 0) {
        // Create new client
        const [newClient] = await db.insert(clients).values({
          userId: company.id,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          birthDate: bookingData.dateOfBirth || null,
        }).returning();
        client = [newClient];
      }

      // Create appointment request (pending status) - using procedure instead of service
      const appointmentData = {
        userId: company.id,
        clientId: client[0].id,
        serviceId: parseInt(bookingData.serviceId), // This will be procedure ID
        serviceType: 'procedure' as const, // Mark as procedure type
        appointmentDate: new Date(bookingData.preferredDate),
        startTime: bookingData.preferredTime,
        endTime: bookingData.preferredTime, // Will be calculated based on procedure duration
        status: 'pending' as const,
        notes: bookingData.notes || '',
      };

      console.log('Creating appointment with data:', appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      console.log('Appointment created:', appointment);

      // Create a notification for the business owner
      await db.insert(notifications).values({
        userId: company.id,
        clientId: client[0].id,
        appointmentId: appointment.id,
        type: 'booking_request',
        title: 'New Booking Request',
        message: `${bookingData.name} has requested an appointment on ${bookingData.preferredDate} at ${bookingData.preferredTime}`,
        channel: 'in_app',
        status: 'pending',
      });

      res.json({ 
        message: 'Booking request submitted successfully',
        appointmentId: appointment.id 
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking request" });
    }
  });

  // Public company info endpoint
  app.get('/api/public/company/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Return public company information
      res.json({
        clinicName: company.clinicName,
        clinicAddress: company.clinicAddress,
        clinicPhone: company.clinicPhone,
        clinicWhatsapp: company.clinicWhatsapp,
        email: company.email,
        profileImageUrl: company.profileImageUrl,
        heroImageUrl: company.heroImageUrl,
        publicLink: company.publicLink
      });
    } catch (error) {
      console.error("Error fetching company info:", error);
      res.status(500).json({ message: "Failed to fetch company information" });
    }
  });

  // Public procedures endpoint (replacing services for client booking)
  app.get('/api/public/procedures/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get procedures instead of services
      const procedures = await procedureStorage.getProcedures(company.id);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  // Public business hours endpoint
  app.get('/api/public/business-hours/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get business hours for this company
      const businessHours = await storage.getBusinessHours(company.id);
      res.json(businessHours);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  // Public staff endpoint (for client booking professional selection)
  app.get('/api/public/staff/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get staff members for this company
      const staff = await storage.getStaff(company.id);
      res.json(staff.map(member => ({
        id: member.id,
        name: member.name,
        specialties: Array.isArray(member.specialties) ? member.specialties : [],
        profileImage: null // Will be added later when staff upload photos
      })));
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // Procedures routes
  app.get('/api/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const procedures = await procedureStorage.getProcedures(userId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.post('/api/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const procedureData = insertProcedureSchema.parse({ ...req.body, userId });
      const procedure = await procedureStorage.createProcedure(userId, procedureData);
      res.json(procedure);
    } catch (error) {
      console.error("Error creating procedure:", error);
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  app.put('/api/procedures/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updates = updateProcedureSchema.parse(req.body);
      const procedure = await procedureStorage.updateProcedure(id, userId, updates);
      res.json(procedure);
    } catch (error) {
      console.error("Error updating procedure:", error);
      res.status(500).json({ message: "Failed to update procedure" });
    }
  });

  // Public booked slots endpoint for client booking
  app.get('/api/public/booked-slots/:publicLink/:date', async (req, res) => {
    try {
      const { publicLink, date } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get booked appointments for the selected date
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedAppointments = await db
        .select({
          appointmentDate: appointments.appointmentDate,
          duration: appointments.duration,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.userId, company.id),
            gte(appointments.appointmentDate, startOfDay),
            lte(appointments.appointmentDate, endOfDay),
            or(
              eq(appointments.status, 'confirmed'),
              eq(appointments.status, 'scheduled')
            )
          )
        );

      res.json(bookedAppointments);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      res.status(500).json({ message: "Failed to fetch booked slots" });
    }
  });

  // API endpoint to deduct materials when appointment is completed
  app.post('/api/appointments/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { procedureId } = req.body;

      // Update appointment status to completed
      await storage.updateAppointment(appointmentId, { status: 'completed' });

      // If procedure ID is provided, deduct materials
      if (procedureId) {
        await procedureStorage.deductMaterialsForProcedure(procedureId, userId);
      }

      res.json({ message: 'Appointment completed and materials deducted successfully' });
    } catch (error) {
      console.error("Error completing appointment:", error);
      res.status(500).json({ message: "Failed to complete appointment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
