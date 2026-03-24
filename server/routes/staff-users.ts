import { Express } from "express";
import { db } from "../db";
import { staff, users, companies } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { isAuthenticated, isAdmin } from "../auth";
import { storage } from "../storage";
import crypto from "crypto";

function hashPasswordMD5(password: string): string {
  return crypto.createHash("md5").update(password).digest("hex");
}

export function registerStaffUserRoutes(app: Express) {
  // GET /api/staff-users
  app.get('/api/staff-users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const staffUsers = await db
        .select()
        .from(staff)
        .where(eq(staff.userId, user.id))
        .orderBy(desc(staff.createdAt));
      res.json(staffUsers);
    } catch (error) {
      console.error("Error fetching staff users:", error);
      res.status(500).json({ message: "Failed to fetch staff users" });
    }
  });

  // POST /api/staff-users
  app.post('/api/staff-users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const user = req.user;
      const { username, email, password, name, phone, role: staffRole, specialties } = req.body;

      if (!username || !password || !name) {
        return res.status(400).json({ message: "Username, password and name are required" });
      }

      const existingStaff = await db.select().from(staff).where(eq(staff.username, username)).limit(1);
      if (existingStaff.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const adminUser = await storage.getUser(user.id);
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      let companyId = adminUser.companyId;
      if (!companyId) {
        const [newCompany] = await db
          .insert(companies)
          .values({
            name: adminUser.clinicName || adminUser.username || 'Empresa',
            email: adminUser.email,
            phone: adminUser.clinicPhone,
            address: adminUser.clinicAddress,
            isActive: true,
          })
          .returning();
        companyId = newCompany.id;
        await db.update(users).set({ companyId }).where(eq(users.id, user.id));
      }

      const currentStaffCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(staff)
        .where(eq(staff.userId, user.id));

      if (currentStaffCount[0]?.count >= (adminUser.maxStaffCount || 10)) {
        return res.status(400).json({ message: `Maximum staff count (${adminUser.maxStaffCount || 10}) reached` });
      }

      const [newStaff] = await db
        .insert(staff)
        .values({
          userId: user.id,
          companyId,
          username,
          password: hashPasswordMD5(password),
          name,
          email: email || null,
          phone: phone || null,
          role: staffRole || 'therapist',
          specialties: Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []),
          isActive: true,
        })
        .returning();

      res.status(201).json(newStaff);
    } catch (error) {
      console.error("Error creating staff user:", error);
      res.status(500).json({ message: "Failed to create staff user" });
    }
  });

  // PUT /api/staff-users/:id
  app.put('/api/staff-users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = parseInt(req.params.id);
      const updates = req.body;

      const [staffMember] = await db
        .select()
        .from(staff)
        .where(and(eq(staff.id, staffId), eq(staff.userId, userId)))
        .limit(1);

      if (!staffMember) {
        return res.status(404).json({ message: "Staff not found" });
      }

      delete updates.userId;
      delete updates.companyId;

      if (updates.password) {
        updates.password = hashPasswordMD5(updates.password);
      }

      const [updatedStaff] = await db
        .update(staff)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(staff.id, staffId))
        .returning();

      res.json(updatedStaff);
    } catch (error) {
      console.error("Error updating staff user:", error);
      res.status(500).json({ message: "Failed to update staff user" });
    }
  });

  // DELETE /api/staff-users/:id
  app.delete('/api/staff-users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = parseInt(req.params.id);

      const [staffMember] = await db
        .select()
        .from(staff)
        .where(and(eq(staff.id, staffId), eq(staff.userId, userId)))
        .limit(1);

      if (!staffMember) {
        return res.status(404).json({ message: "Staff not found" });
      }

      await db.delete(staff).where(eq(staff.id, staffId));
      res.json({ message: "Staff deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff user:", error);
      res.status(500).json({ message: "Failed to delete staff user" });
    }
  });

  // PUT /api/user/max-staff-count
  app.put('/api/user/max-staff-count', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { maxStaffCount } = req.body;

      if (typeof maxStaffCount !== 'number' || maxStaffCount < 1) {
        return res.status(400).json({ message: "maxStaffCount must be a positive number" });
      }

      const updatedUser = await storage.updateUser(userId, { maxStaffCount });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating max staff count:", error);
      res.status(500).json({ message: "Failed to update max staff count" });
    }
  });
}
