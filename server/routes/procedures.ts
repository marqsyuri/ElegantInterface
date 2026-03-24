import type { Express } from "express";
import { procedureStorage } from "../procedures";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { insertProcedureSchema, updateProcedureSchema } from "@shared/schema";
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { users } from "@shared/schema";

export function registerProcedureRoutes(app: Express) {
  app.get('/api/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const procedures = await procedureStorage.getProcedures(effectiveUserId.toString());
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.post('/api/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const procedureData = insertProcedureSchema.parse({ ...req.body, userId: effectiveUserId.toString() });
      const procedure = await procedureStorage.createProcedure(effectiveUserId.toString(), procedureData);
      res.json(procedure);
    } catch (error) {
      console.error("Error creating procedure:", error);
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  app.put('/api/procedures/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
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
      const userId = req.user.id;
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


  // ── Consumo de produtos por procedimento ──────────────────────────────────

  // GET /api/procedures/:id/products — lista insumos do procedimento
  app.get('/api/procedures/:id/products', isAuthenticated, async (req: any, res) => {
    try {
      const procedureId = parseInt(req.params.id);
      const rows = await db.execute(sql`
        SELECT pp.id, pp.procedure_id, pp.product_id, pp.quantity, pp.unit, pp.notes,
               p.name as product_name, p.price as product_price, p.unit as product_unit,
               p.current_stock
        FROM procedure_products pp
        JOIN products p ON p.id = pp.product_id
        WHERE pp.procedure_id = ${procedureId}
        ORDER BY p.name
      `);
      res.json(rows.rows);
    } catch (error: any) {
      console.error("Error fetching procedure products:", error);
      res.status(500).json({ message: "Failed to fetch procedure products" });
    }
  });

  // POST /api/procedures/:id/products — adiciona insumo ao procedimento
  app.post('/api/procedures/:id/products', isAuthenticated, async (req: any, res) => {
    try {
      const procedureId = parseInt(req.params.id);
      const { productId, quantity, unit, notes } = req.body;
      if (!productId) return res.status(400).json({ message: "productId obrigatório" });
      const qty = parseFloat(quantity) || 1;
      const rows = await db.execute(sql`
        INSERT INTO procedure_products (procedure_id, product_id, quantity, unit, notes)
        VALUES (${procedureId}, ${productId}, ${qty}, ${unit || 'un'}, ${notes || null})
        ON CONFLICT (procedure_id, product_id) DO UPDATE
          SET quantity = ${qty}, unit = ${unit || 'un'}, notes = ${notes || null}
        RETURNING *
      `);
      res.json(rows.rows[0]);
    } catch (error: any) {
      console.error("Error adding procedure product:", error);
      res.status(500).json({ message: "Failed to add product to procedure", error: error.message });
    }
  });

  // PUT /api/procedures/:id/products/:productId — atualiza quantidade
  app.put('/api/procedures/:id/products/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const procedureId = parseInt(req.params.id);
      const productId = parseInt(req.params.productId);
      const { quantity, unit, notes } = req.body;
      const qty = parseFloat(quantity) || 1;
      await db.execute(sql`
        UPDATE procedure_products
        SET quantity = ${qty}, unit = ${unit || 'un'}, notes = ${notes || null}
        WHERE procedure_id = ${procedureId} AND product_id = ${productId}
      `);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update" });
    }
  });

  // DELETE /api/procedures/:id/products/:productId — remove insumo
  app.delete('/api/procedures/:id/products/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const procedureId = parseInt(req.params.id);
      const productId = parseInt(req.params.productId);
      await db.execute(sql`
        DELETE FROM procedure_products
        WHERE procedure_id = ${procedureId} AND product_id = ${productId}
      `);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

}