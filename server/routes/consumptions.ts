import { Express, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function registerConsumptionsRoutes(app: Express) {

  // GET /api/appointments/:id/consumptions
  app.get("/api/appointments/:id/consumptions", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const rows = await db.execute(sql`
        SELECT
          ac.id, ac.appointment_id, ac.product_id, ac.procedure_id,
          ac.quantity_suggested, ac.quantity_used, ac.unit, ac.notes, ac.source, ac.created_at,
          p.name AS product_name, p.current_stock, p.unit AS product_unit,
          pr.name AS procedure_name
        FROM appointment_consumptions ac
        JOIN products p ON p.id = ac.product_id
        LEFT JOIN procedures pr ON pr.id = ac.procedure_id
        WHERE ac.appointment_id = ${appointmentId}
        ORDER BY ac.procedure_id, ac.id
      `);
      res.json(rows.rows);
    } catch (err: any) {
      console.error("[consumptions] GET error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/appointments/:id/consumptions/prefill
  app.post("/api/appointments/:id/consumptions/prefill", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);

      // Verifica se já tem consumíveis salvos
      const existing = await db.execute(sql`
        SELECT COUNT(*)::int AS total FROM appointment_consumptions WHERE appointment_id = ${appointmentId}
      `);
      const total = (existing.rows[0] as any)?.total ?? 0;

      if (total > 0) {
        const rows = await db.execute(sql`
          SELECT ac.*, p.name AS product_name, p.current_stock, pr.name AS procedure_name
          FROM appointment_consumptions ac
          JOIN products p ON p.id = ac.product_id
          LEFT JOIN procedures pr ON pr.id = ac.procedure_id
          WHERE ac.appointment_id = ${appointmentId}
          ORDER BY ac.procedure_id, ac.id
        `);
        return res.json({ prefilled: false, message: "Consumíveis já existentes", consumptions: rows.rows });
      }

      // Busca procedimentos do agendamento
      const procs = await db.execute(sql`
        SELECT procedure_id FROM appointment_procedures
        WHERE appointment_id = ${appointmentId} AND procedure_id IS NOT NULL
      `);

      if (!procs.rows.length) {
        return res.json({ prefilled: false, message: "Nenhum procedimento vinculado", consumptions: [] });
      }

      const procIds: number[] = procs.rows.map((r: any) => parseInt(r.procedure_id)).filter(Boolean);
      if (!procIds.length) {
        return res.json({ prefilled: false, message: "Nenhum procedimento vinculado", consumptions: [] });
      }

      // Busca insumos — query com placeholders individuais para evitar cast de array
      let templateRows: any[] = [];
      for (const pid of procIds) {
        const rows = await db.execute(sql`
          SELECT pp.product_id, pp.procedure_id, pp.quantity, pp.unit, pp.notes
          FROM procedure_products pp
          WHERE pp.procedure_id = ${pid}
        `);
        templateRows = templateRows.concat(rows.rows);
      }

      if (!templateRows.length) {
        return res.json({ prefilled: false, message: "Nenhum insumo cadastrado nos procedimentos", consumptions: [] });
      }

      // Insere na appointment_consumptions
      for (const item of templateRows) {
        await db.execute(sql`
          INSERT INTO appointment_consumptions
            (appointment_id, product_id, procedure_id, quantity_suggested, quantity_used, unit, notes, source)
          VALUES (
            ${appointmentId}, ${item.product_id}, ${item.procedure_id},
            ${item.quantity}, ${item.quantity}, ${item.unit ?? 'un'}, ${item.notes ?? null}, 'template'
          )
          ON CONFLICT DO NOTHING
        `);
      }

      const inserted = await db.execute(sql`
        SELECT ac.*, p.name AS product_name, p.current_stock, pr.name AS procedure_name
        FROM appointment_consumptions ac
        JOIN products p ON p.id = ac.product_id
        LEFT JOIN procedures pr ON pr.id = ac.procedure_id
        WHERE ac.appointment_id = ${appointmentId}
        ORDER BY ac.procedure_id, ac.id
      `);

      res.json({ prefilled: true, message: `${inserted.rows.length} insumo(s) carregados do template`, consumptions: inserted.rows });
    } catch (err: any) {
      console.error("[consumptions] PREFILL error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/appointments/:id/consumptions
  app.put("/api/appointments/:id/consumptions", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { consumptions } = req.body as { consumptions: any[] };

      if (!Array.isArray(consumptions)) {
        return res.status(400).json({ error: "consumptions deve ser um array" });
      }

      for (const c of consumptions) {
        if (!c.product_id || c._isNew) continue; // Pula itens sem produto selecionado
        if (c.id) {
          await db.execute(sql`
            UPDATE appointment_consumptions
            SET quantity_used = ${parseFloat(c.quantity_used) || 0},
                notes = ${c.notes ?? null},
                source = ${c.source ?? 'manual'}
            WHERE id = ${c.id} AND appointment_id = ${appointmentId}
          `);
        } else {
          await db.execute(sql`
            INSERT INTO appointment_consumptions
              (appointment_id, product_id, procedure_id, quantity_suggested, quantity_used, unit, notes, source)
            VALUES (
              ${appointmentId}, ${c.product_id}, ${c.procedure_id ?? null},
              ${parseFloat(c.quantity_suggested) || 1}, ${parseFloat(c.quantity_used) || 1},
              ${c.unit ?? 'un'}, ${c.notes ?? null}, ${c.source ?? 'manual'}
            )
          `);
        }
      }

      res.json({ success: true, message: `${consumptions.length} consumível(is) salvos` });
    } catch (err: any) {
      console.error("[consumptions] PUT error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/appointments/:id/consumptions/:consumptionId
  app.delete("/api/appointments/:id/consumptions/:consumptionId", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const consumptionId = parseInt(req.params.consumptionId);
      await db.execute(sql`
        DELETE FROM appointment_consumptions
        WHERE id = ${consumptionId} AND appointment_id = ${appointmentId}
      `);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
