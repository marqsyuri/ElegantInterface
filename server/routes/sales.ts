import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertSaleSchema, transactions } from "@shared/schema";
import { db } from "../db";

export function registerSaleRoutes(app: Express) {
  app.get('/api/sales', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
      
      const sales = await storage.getSales(userId.toString(), startDate, endDate);
      res.json(sales);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales", error: error.message });
    }
  });

  app.get('/api/sales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      
      const sale = await storage.getSale(saleId, userId.toString());
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error: any) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale", error: error.message });
    }
  });

  app.post('/api/sales', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validar dados
      const saleData = {
        ...req.body,
        userId: parseInt(userId.toString()),
      };
      
      
      // Validar com schema
      let validatedData;
      try {
        validatedData = insertSaleSchema.parse(saleData);
      } catch (validationError: any) {
        console.error('❌ Validation error:', validationError);
        console.error('❌ Validation issues:', validationError.issues);
        return res.status(400).json({ 
          message: "Validation failed", 
          error: validationError.message,
          issues: validationError.issues 
        });
      }
      
      const newSale = await storage.createSale(validatedData as any);
      
      // Criar transação de receita automaticamente
      await db.insert(transactions).values({
        userId: parseInt(userId.toString()),
        clientId: validatedData.clientId || null,
        type: 'income',
        description: `Venda de produtos - ${(validatedData.products || []).map((p: any) => p.productName).join(', ')}`,
        amount: validatedData.total,
        transactionDate: validatedData.saleDate,
        category: 'sales',
        isPaid: true,
      } as any);
      
      res.json(newSale);
    } catch (error: any) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale", error: error.message });
    }
  });

  app.delete('/api/sales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.id);
      
      await storage.deleteSale(saleId, userId.toString());
      res.json({ message: "Sale deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ message: "Failed to delete sale", error: error.message });
    }
  });
}
