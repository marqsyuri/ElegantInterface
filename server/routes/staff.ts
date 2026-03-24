import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { insertStaffSchema, insertStaffScheduleSchema } from "@shared/schema";

export function registerStaffRoutes(app: Express) {
  app.get('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const staff = await storage.getStaff(effectiveUserId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      const staffId = parseInt(req.params.id);
      await storage.deleteStaff(staffId, userId);
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ message: "Failed to delete staff" });
    }
  });

  app.get('/api/staff-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const schedules = await storage.getStaffSchedules(req.user.id);
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

  app.put('/api/staff/:id/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = parseInt(req.params.id);
      const { procedureIds } = req.body;
      if (!Array.isArray(procedureIds)) return res.status(400).json({ message: 'procedureIds must be an array' });
      const ids = procedureIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
      await storage.setStaffProcedures(staffId, ids, userId);
      res.json({ message: 'Staff procedures updated successfully' });
    } catch (error: any) {
      console.error("Error setting staff procedures:", error);
      res.status(500).json({ message: error?.message || "Failed to set staff procedures" });
    }
  });
}
