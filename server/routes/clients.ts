import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { insertClientSchema } from "@shared/schema";

export function registerClientRoutes(app: Express) {
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const clients = await storage.getClients(effectiveUserId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:clientId/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const effectiveUserId = getEffectiveUserId(req);
      const clientData = insertClientSchema.parse({ ...req.body, userId: effectiveUserId });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error: any) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: error?.message || "Failed to create client" });
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
}
