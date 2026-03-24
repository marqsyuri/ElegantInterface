import type { Express } from "express";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { notifications, appointmentStaff } from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { storage } from "../storage";

async function fetchUserNotifications(userId: number) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

async function fetchStaffNotifications(staffId: number) {
  const staffAppointments = await db.select({ appointmentId: appointmentStaff.appointmentId }).from(appointmentStaff).where(eq(appointmentStaff.staffId, staffId));
  const appointmentIds = staffAppointments.map(a => a.appointmentId);
  if (appointmentIds.length === 0) return [];
  return db.select().from(notifications).where(inArray(notifications.appointmentId, appointmentIds)).orderBy(desc(notifications.createdAt));
}

async function markAllNotificationsRead(userId: number) {
  const now = new Date();
  const updated = await db.update(notifications).set({ status: 'read', isRead: true, readAt: now, updatedAt: now }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))).returning({ id: notifications.id });
  return updated.length;
}

export function registerNotificationRoutes(app: Express) {
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const items = await fetchUserNotifications(req.user.id);
      res.json(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const updatedCount = await markAllNotificationsRead(req.user.id);
      res.json({ updated: updatedCount });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);
      if (Number.isNaN(notificationId)) return res.status(400).json({ message: 'Invalid notification id' });
      const now = new Date();
      const [updated] = await db.update(notifications).set({ status: 'read', isRead: true, readAt: now, updatedAt: now }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning();
      if (!updated) return res.status(404).json({ message: 'Notification not found' });
      res.json(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  app.get('/api/notifications/staff/:staffId', isAuthenticated, async (req: any, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) return res.status(400).json({ message: 'Invalid staff ID' });
      const user = req.user;
      if (user.userType === 'staff' && user.accessLevel === 'staff' && user.id !== staffId) return res.status(403).json({ message: 'Access denied' });
      const staffNotifications = await fetchStaffNotifications(staffId);
      res.json(staffNotifications);
    } catch (error: any) {
      console.error('[API] Error fetching staff notifications:', error);
      res.status(500).json({ message: 'Failed to fetch staff notifications' });
    }
  });

  app.get('/api/staff/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const isStaffUser = user.userType === 'staff' || user.accessLevel === 'staff';
      if (!isStaffUser) return res.status(403).json({ message: 'This endpoint is only for staff users' });
      const staffNotifications = await fetchStaffNotifications(user.id);
      res.json(staffNotifications);
    } catch (error: any) {
      console.error('[API] Error fetching staff notifications:', error);
      res.status(500).json({ message: 'Failed to fetch staff notifications' });
    }
  });
}
