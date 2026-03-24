import type { Express } from "express";
import { isAuthenticated, getEffectiveUserId } from "../auth";
import { pool } from "../db";

export function registerVoucherRoutes(app: Express) {
  // Lista todos os vouchers do usuário
  app.get('/api/vouchers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { rows } = await pool.query(`
        SELECT v.*,
          COALESCE(
            (SELECT COUNT(*) FROM voucher_uses vu WHERE vu.voucher_id = v.id), 0
          ) AS used_count_real
        FROM vouchers v
        WHERE v.user_id = $1
        ORDER BY v.created_at DESC
      `, [userId]);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      res.status(500).json({ message: "Failed to fetch vouchers" });
    }
  });

  // Cria voucher
  app.post('/api/vouchers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { code, description, type, value, min_purchase, max_uses, valid_from, valid_until, applicable_to } = req.body;
      if (!code || !type || !value) return res.status(400).json({ message: "code, type e value são obrigatórios" });
      if (!['fixed', 'percentage'].includes(type)) return res.status(400).json({ message: "type deve ser 'fixed' ou 'percentage'" });
      if (type === 'percentage' && (parseFloat(value) <= 0 || parseFloat(value) > 100)) {
        return res.status(400).json({ message: "Percentual deve ser entre 1 e 100" });
      }

      const { rows } = await pool.query(`
        INSERT INTO vouchers (user_id, code, description, type, value, min_purchase, max_uses, valid_from, valid_until, applicable_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [userId, code.toUpperCase().trim(), description || null, type, parseFloat(value),
          parseFloat(min_purchase || 0), max_uses || null,
          valid_from || new Date(), valid_until || null,
          applicable_to || 'all']);
      res.status(201).json(rows[0]);
    } catch (error: any) {
      if (error.code === '23505') return res.status(409).json({ message: "Código já existe" });
      console.error("Error creating voucher:", error);
      res.status(500).json({ message: "Failed to create voucher" });
    }
  });

  // Atualiza voucher
  app.put('/api/vouchers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const voucherId = parseInt(req.params.id);
      const { description, type, value, min_purchase, max_uses, valid_from, valid_until, applicable_to, is_active } = req.body;

      const { rows } = await pool.query(`
        UPDATE vouchers SET
          description = COALESCE($1, description),
          type = COALESCE($2, type),
          value = COALESCE($3, value),
          min_purchase = COALESCE($4, min_purchase),
          max_uses = $5,
          valid_from = COALESCE($6, valid_from),
          valid_until = $7,
          applicable_to = COALESCE($8, applicable_to),
          is_active = COALESCE($9, is_active),
          updated_at = NOW()
        WHERE id = $10 AND user_id = $11
        RETURNING *
      `, [description, type, value ? parseFloat(value) : null, min_purchase ? parseFloat(min_purchase) : null,
          max_uses !== undefined ? max_uses : null,
          valid_from, valid_until !== undefined ? valid_until : null,
          applicable_to, is_active, voucherId, userId]);

      if (rows.length === 0) return res.status(404).json({ message: "Voucher não encontrado" });
      res.json(rows[0]);
    } catch (error) {
      console.error("Error updating voucher:", error);
      res.status(500).json({ message: "Failed to update voucher" });
    }
  });

  // Deleta voucher
  app.delete('/api/vouchers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const voucherId = parseInt(req.params.id);
      const { rows } = await pool.query(
        'DELETE FROM vouchers WHERE id = $1 AND user_id = $2 RETURNING id',
        [voucherId, userId]
      );
      if (rows.length === 0) return res.status(404).json({ message: "Voucher não encontrado" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting voucher:", error);
      res.status(500).json({ message: "Failed to delete voucher" });
    }
  });

  // Valida voucher por código (para uso no checkout)
  app.post('/api/vouchers/validate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const { code, purchase_amount } = req.body;
      if (!code) return res.status(400).json({ message: "Código obrigatório" });

      const { rows } = await pool.query(`
        SELECT v.*, COALESCE((SELECT COUNT(*) FROM voucher_uses vu WHERE vu.voucher_id = v.id), 0) AS used_count_real
        FROM vouchers v
        WHERE v.user_id = $1 AND UPPER(v.code) = UPPER($2) AND v.is_active = true
      `, [userId, code.trim()]);

      if (rows.length === 0) return res.status(404).json({ valid: false, message: "Voucher não encontrado ou inativo" });
      const v = rows[0];

      // Valida vencimento
      if (v.valid_until && new Date(v.valid_until) < new Date()) {
        return res.status(400).json({ valid: false, message: "Voucher vencido" });
      }
      if (v.valid_from && new Date(v.valid_from) > new Date()) {
        return res.status(400).json({ valid: false, message: "Voucher ainda não está válido" });
      }

      // Valida usos
      if (v.max_uses !== null && parseInt(v.used_count_real) >= v.max_uses) {
        return res.status(400).json({ valid: false, message: "Voucher atingiu o limite de usos" });
      }

      // Valida compra mínima
      const amount = parseFloat(purchase_amount || 0);
      if (v.min_purchase && amount < parseFloat(v.min_purchase)) {
        return res.status(400).json({ valid: false, message: `Compra mínima de R$ ${parseFloat(v.min_purchase).toFixed(2)}` });
      }

      // Calcula desconto
      let discount = 0;
      if (v.type === 'fixed') {
        discount = Math.min(parseFloat(v.value), amount);
      } else {
        discount = (amount * parseFloat(v.value)) / 100;
      }

      res.json({
        valid: true,
        voucher: v,
        discount: parseFloat(discount.toFixed(2)),
        final_amount: parseFloat((amount - discount).toFixed(2)),
      });
    } catch (error) {
      console.error("Error validating voucher:", error);
      res.status(500).json({ message: "Failed to validate voucher" });
    }
  });

  // Registra uso do voucher
  app.post('/api/vouchers/:id/use', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const voucherId = parseInt(req.params.id);
      const { appointment_id, client_id, discount_applied } = req.body;

      // Verifica ownership
      const { rows: vRows } = await pool.query(
        'SELECT id FROM vouchers WHERE id = $1 AND user_id = $2', [voucherId, userId]
      );
      if (vRows.length === 0) return res.status(404).json({ message: "Voucher não encontrado" });

      const { rows } = await pool.query(`
        INSERT INTO voucher_uses (voucher_id, appointment_id, client_id, discount_applied)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [voucherId, appointment_id || null, client_id || null, parseFloat(discount_applied || 0)]);

      await pool.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = $1', [voucherId]);

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Error registering voucher use:", error);
      res.status(500).json({ message: "Failed to register voucher use" });
    }
  });

  // Histórico de usos de um voucher
  app.get('/api/vouchers/:id/uses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const voucherId = parseInt(req.params.id);

      const { rows: vRows } = await pool.query('SELECT id FROM vouchers WHERE id = $1 AND user_id = $2', [voucherId, userId]);
      if (vRows.length === 0) return res.status(404).json({ message: "Voucher não encontrado" });

      const { rows } = await pool.query(`
        SELECT vu.*, c.name AS client_name, a.appointment_date
        FROM voucher_uses vu
        LEFT JOIN clients c ON c.id = vu.client_id
        LEFT JOIN appointments a ON a.id = vu.appointment_id
        WHERE vu.voucher_id = $1
        ORDER BY vu.used_at DESC
      `, [voucherId]);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching voucher uses:", error);
      res.status(500).json({ message: "Failed to fetch voucher uses" });
    }
  });
}
