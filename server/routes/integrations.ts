import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertIntegrationSchema, integrations } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export function registerIntegrationRoutes(app: Express) {
  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userIntegrations = await db
        .select()
        .from(integrations)
        .where(eq(integrations.userId, userId))
        .orderBy(desc(integrations.createdAt));
      
      res.json(userIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertIntegrationSchema.parse(req.body);
      
      const [newIntegration] = await db
        .insert(integrations)
        .values({
          ...validatedData,
          userId,
        })
        .returning();
      
      res.status(201).json(newIntegration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.delete('/api/integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrationId = parseInt(req.params.id);
      
      await db
        .delete(integrations)
        .where(
          and(
            eq(integrations.id, integrationId),
            eq(integrations.userId, userId)
          )
        );
      
      res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  app.patch('/api/integrations/:id/test-payload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrationId = parseInt(req.params.id);
      const { testPayload } = req.body;
      
      const [updated] = await db
        .update(integrations)
        .set({ testPayload })
        .where(
          and(
            eq(integrations.id, integrationId),
            eq(integrations.userId, userId)
          )
        )
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating test payload:", error);
      res.status(500).json({ message: "Failed to update test payload" });
    }
  });

  app.post('/api/integrations/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrationId = parseInt(req.params.id);
      
      const [integration] = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.id, integrationId),
            eq(integrations.userId, userId)
          )
        );

      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Apply authentication based on type
      if (integration.authType === 'Bearer' && integration.authData) {
        headers['Authorization'] = `Bearer ${integration.authData}`;
      } else if (integration.authType === 'Basic' && integration.username && integration.password) {
        const credentials = Buffer.from(`${integration.username}:${integration.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (integration.authType === 'API Key' && integration.authData) {
        headers['X-API-Key'] = integration.authData;
      } else if (integration.authData) {
        // Custom auth - try to parse as JSON for headers
        try {
          const customHeaders = JSON.parse(integration.authData);
          Object.assign(headers, customHeaders);
        } catch {
          headers['Authorization'] = integration.authData;
        }
      }

      const payload = integration.testPayload ? JSON.parse(integration.testPayload) : {};

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch(integration.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
    } catch (error: any) {
      console.error("Error testing integration:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to test integration",
        error: error.toString(),
      });
    }
  });

  // Update appointment with procedures (PUT equivalent of the POST above)
  app.put('/api/appointments/:id/with-procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const appointmentId = parseInt(req.params.id);
      const { 
        procedureIds, 
        clientId, 
        appointmentDate, 
        staffId, 
        staffIds, 
        procedureStaffMap, 
        notes, 
        status, 
        totalAmount, 
        paidAmount, 
        totalDuration,
        beforeImages, 
        afterImages 
      } = req.body;


      if (!Array.isArray(procedureIds) || procedureIds.length === 0) {
        return res.status(400).json({ message: 'procedureIds must be a non-empty array' });
      }

      // Prepare appointment data
      const appointmentData: any = {};
      
      if (clientId) appointmentData.clientId = clientId;
      if (appointmentDate) appointmentData.appointmentDate = new Date(appointmentDate);
      if (staffId) appointmentData.staffId = parseInt(staffId);
      if (notes !== undefined) appointmentData.notes = notes;
      if (status) appointmentData.status = status;
      if (totalAmount) appointmentData.totalAmount = totalAmount.toString();
      if (paidAmount) appointmentData.paidAmount = paidAmount.toString();
      if (totalDuration) appointmentData.totalDuration = parseInt(totalDuration);
      if (beforeImages) appointmentData.beforeImages = beforeImages;
      if (afterImages) appointmentData.afterImages = afterImages;

      // Ensure staffId is valid
      if (appointmentData.staffId && isNaN(appointmentData.staffId)) {
         return res.status(400).json({ message: "Invalid staffId" });
      }

      const result = await storage.updateAppointmentWithProcedures(
        appointmentId,
        appointmentData,
        procedureIds.map((id: any) => parseInt(id)),
        procedureStaffMap || {},
        effectiveUserId
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error updating appointment with procedures:", error);
      res.status(500).json({ 
        message: "Failed to update appointment", 
        error: error.message 
      });
    }
  });

  // Test route for inactive clients detection (development only)
  app.post('/api/test/inactive-clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      await storage.populateInactiveClients(userId);
      const inactiveClients = await storage.getInactiveClients(userId);
      
      res.json({ 
        success: true, 
        count: inactiveClients.length,
        inactiveClients 
      });
    } catch (error) {
      console.error("Error testing inactive clients detection:", error);
      res.status(500).json({ message: "Failed to test inactive clients detection" });
    }
  });

  // Test route for appointment reminders (development only)
  app.post('/api/test/appointment-reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      await storage.populateAppointmentReminders(userId);
      const reminders = await storage.getAppointmentReminders(userId, 0); // status = 0 (pending)
      
      res.json({ 
        success: true, 
        count: reminders.length,
        reminders 
      });
    } catch (error) {
      console.error("Error testing appointment reminders:", error);
      res.status(500).json({ message: "Failed to test appointment reminders" });
    }
  });

}
