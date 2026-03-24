import type { Express } from "express";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { pool } from "../db";

export function registerReportsRoutes(app: Express) {
  // Relatório de serviços vendidos (procedimentos executados em consultas concluídas)
  app.get('/api/reports/services-sold', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const startDate = req.query.startDate ? req.query.startDate as string : undefined;
      const endDate = req.query.endDate ? req.query.endDate as string : undefined;
      const staffId = req.query.staffId ? parseInt(req.query.staffId as string) : undefined;

      let query = `
        SELECT
          p.id AS procedure_id,
          p.name AS procedure_name,
          p.price AS unit_price,
          COUNT(ap.id) AS quantity_sold,
          SUM(p.price) AS total_revenue,
          AVG(p.duration) AS avg_duration_min,
          s.name AS staff_name
        FROM appointment_procedures ap
        JOIN appointments a ON a.id = ap.appointment_id
        JOIN procedures p ON p.id = ap.procedure_id
        LEFT JOIN staff s ON s.id = ap.staff_id
        WHERE a.user_id = $1
          AND a.status IN ('completed', 'confirmed')
      `;
      const params: any[] = [userId];
      let i = 2;

      if (startDate) { query += ` AND a.appointment_date >= $${i++}`; params.push(startDate); }
      if (endDate)   { query += ` AND a.appointment_date <= $${i++}`; params.push(endDate + ' 23:59:59'); }
      if (staffId)   { query += ` AND ap.staff_id = $${i++}`; params.push(staffId); }

      query += `
        GROUP BY p.id, p.name, p.price, s.name
        ORDER BY quantity_sold DESC, total_revenue DESC
      `;

      const { rows } = await pool.query(query, params);

      // Totais gerais
      const summary = {
        total_procedures: rows.reduce((s: number, r: any) => s + parseInt(r.quantity_sold), 0),
        total_revenue: rows.reduce((s: number, r: any) => s + parseFloat(r.total_revenue || 0), 0),
        unique_services: rows.length,
      };

      res.json({ items: rows, summary });
    } catch (error) {
      console.error("Error fetching services-sold report:", error);
      res.status(500).json({ message: "Failed to fetch services sold report" });
    }
  });

  // Relatório de produtos vendidos (itens de appointment_products)
  app.get('/api/reports/products-sold', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const startDate = req.query.startDate ? req.query.startDate as string : undefined;
      const endDate = req.query.endDate ? req.query.endDate as string : undefined;

      let query = `
        SELECT
          pr.id AS product_id,
          pr.name AS product_name,
          pr.category,
          pr.unit,
          COUNT(ap.id) AS quantity_orders,
          SUM(ap.quantity) AS total_units_sold,
          AVG(CASE WHEN ap.original_price IS NOT NULL THEN ap.original_price::numeric ELSE ap.unit_price::numeric END) AS avg_original_price,
          AVG(ap.unit_price::numeric) AS avg_sale_price,
          SUM(ap.quantity * ap.unit_price::numeric) AS total_revenue,
          SUM(ap.quantity * COALESCE(ap.original_price::numeric, ap.unit_price::numeric)) - SUM(ap.quantity * ap.unit_price::numeric) AS total_discount_given
        FROM appointment_products ap
        JOIN appointments a ON a.id = ap.appointment_id
        JOIN products pr ON pr.id = ap.product_id
        WHERE a.user_id = $1
          AND a.status IN ('completed', 'confirmed')
      `;
      const params: any[] = [userId];
      let i = 2;

      if (startDate) { query += ` AND a.appointment_date >= $${i++}`; params.push(startDate); }
      if (endDate)   { query += ` AND a.appointment_date <= $${i++}`; params.push(endDate + ' 23:59:59'); }

      query += `
        GROUP BY pr.id, pr.name, pr.category, pr.unit
        ORDER BY total_units_sold DESC, total_revenue DESC
      `;

      const { rows } = await pool.query(query, params);

      const summary = {
        total_items_sold: rows.reduce((s: number, r: any) => s + parseInt(r.total_units_sold || 0), 0),
        total_revenue: rows.reduce((s: number, r: any) => s + parseFloat(r.total_revenue || 0), 0),
        total_discount: rows.reduce((s: number, r: any) => s + parseFloat(r.total_discount_given || 0), 0),
        unique_products: rows.length,
      };

      res.json({ items: rows, summary });
    } catch (error) {
      console.error("Error fetching products-sold report:", error);
      res.status(500).json({ message: "Failed to fetch products sold report" });
    }
  });

  // Relatório geral (consolidado por período)
  app.get('/api/reports/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const period = req.query.period as string || '30d'; // 7d, 30d, 90d, custom
      let startDate: string;
      const endDate = new Date().toISOString().split('T')[0];

      if (period === '7d')  startDate = new Date(Date.now() - 7  * 86400000).toISOString().split('T')[0];
      else if (period === '30d') startDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      else if (period === '90d') startDate = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      else startDate = req.query.startDate as string || endDate;

      const { rows } = await pool.query(`
        SELECT
          DATE(a.appointment_date) AS day,
          COUNT(DISTINCT a.id) AS appointments,
          COUNT(DISTINCT a.client_id) AS unique_clients,
          SUM(a.total_amount::numeric) AS revenue,
          COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed,
          COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled,
          COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show
        FROM appointments a
        WHERE a.user_id = $1
          AND DATE(a.appointment_date) BETWEEN $2 AND $3
        GROUP BY DATE(a.appointment_date)
        ORDER BY day ASC
      `, [userId, startDate, endDate]);

      const totals = {
        appointments: rows.reduce((s: number, r: any) => s + parseInt(r.appointments), 0),
        revenue: rows.reduce((s: number, r: any) => s + parseFloat(r.revenue || 0), 0),
        completed: rows.reduce((s: number, r: any) => s + parseInt(r.completed), 0),
        cancelled: rows.reduce((s: number, r: any) => s + parseInt(r.cancelled), 0),
        no_show: rows.reduce((s: number, r: any) => s + parseInt(r.no_show), 0),
        unique_clients: rows.reduce((s: number, r: any) => s + parseInt(r.unique_clients), 0),
      };

      res.json({ period, startDate, endDate, daily: rows, totals });
    } catch (error) {
      console.error("Error fetching summary report:", error);
      res.status(500).json({ message: "Failed to fetch summary report" });
    }
  });
}
