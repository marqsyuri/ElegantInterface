import type { Express } from "express";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { products } from "@shared/schema";
import { insertProductSchema, updateProductSchema } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export function registerProductRoutes(app: Express) {
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.userId, userId))
        .orderBy(desc(products.createdAt));
      res.json(allProducts);
    } catch (error: any) {
      console.error("❌ Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const body = { ...req.body };
      // Sanitiza campos numéricos
      // decimal columns: drizzle-zod gera z.string(), então mantém como string
      const priceParsed = (body.price !== '' && body.price != null) ? parseFloat(body.price) : 0;
      const costPriceParsed = (body.costPrice !== '' && body.costPrice != null) ? parseFloat(body.costPrice) : null;
      body.price = String(priceParsed);
      body.costPrice = costPriceParsed != null ? String(costPriceParsed) : null;
      body.currentStock = parseInt(body.currentStock) || 0;
      body.minStock = parseInt(body.minStock) || 0;
      body.maxStock = parseInt(body.maxStock) || 0;
      body.code = body.code || '';
      body.unit = body.unit || 'un';
      const productData = insertProductSchema.parse({ ...body, userId });
      const [newProduct] = await db.insert(products).values(productData as any).returning();
      res.json(newProduct);
    } catch (error: any) {
      console.error("❌ Error creating product:", error);
      res.status(500).json({ message: "Failed to create product", error: error.message });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const body = { ...req.body };
      if (body.price !== undefined) body.price = String((body.price !== '' && body.price != null) ? parseFloat(body.price) : 0);
      if (body.costPrice !== undefined) body.costPrice = (body.costPrice !== '' && body.costPrice != null) ? String(parseFloat(body.costPrice)) : null;
      if (body.currentStock !== undefined) body.currentStock = parseInt(body.currentStock) || 0;
      if (body.minStock !== undefined) body.minStock = parseInt(body.minStock) || 0;
      if (body.maxStock !== undefined) body.maxStock = parseInt(body.maxStock) || 0;
      const updates = updateProductSchema.parse(body);
      const [updatedProduct] = await db
        .update(products)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.userId, userId)))
        .returning();
      if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      await db
        .delete(products)
        .where(and(eq(products.id, id), eq(products.userId, userId)));
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
}
