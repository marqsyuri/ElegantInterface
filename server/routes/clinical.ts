import { Express } from 'express';
import { insertClinicalRecordSchema } from '@shared/schema';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';

export function registerClinicalRecordRoutes(app: Express) {
  // GET /api/clinical-records
  app.get('/api/clinical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const records = await storage.getClinicalRecords(userId, clientId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching clinical records:", error);
      res.status(500).json({ message: "Failed to fetch clinical records" });
    }
  });

  // POST /api/clinical-records
  app.post('/api/clinical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordData = insertClinicalRecordSchema.parse({ ...req.body, userId });
      const record = await storage.createClinicalRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error creating clinical record:", error);
      res.status(500).json({ message: "Failed to create clinical record" });
    }
  });
}
