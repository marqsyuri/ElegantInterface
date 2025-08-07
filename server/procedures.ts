import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { procedures, inventory } from "@shared/schema";

export interface ProcedureStorage {
  createProcedure(userId: string, data: any): Promise<any>;
  updateProcedure(id: number, userId: string, data: any): Promise<any>;
  getProcedures(userId: string): Promise<any[]>;
  getProcedure(id: number, userId: string): Promise<any>;
  deductMaterialsForProcedure(procedureId: number, userId: string): Promise<void>;
}

export class DatabaseProcedureStorage implements ProcedureStorage {
  async createProcedure(userId: string, data: any): Promise<any> {
    const [procedure] = await db
      .insert(procedures)
      .values({
        ...data,
        userId,
      })
      .returning();
    
    return procedure;
  }

  async updateProcedure(id: number, userId: string, data: any): Promise<any> {
    const [procedure] = await db
      .update(procedures)
      .set(data)
      .where(and(eq(procedures.id, id), eq(procedures.userId, userId)))
      .returning();
    
    return procedure;
  }

  async getProcedures(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(procedures)
      .where(eq(procedures.userId, userId));
  }

  async getProcedure(id: number, userId: string): Promise<any> {
    const [procedure] = await db
      .select()
      .from(procedures)
      .where(and(eq(procedures.id, id), eq(procedures.userId, userId)));
    
    return procedure;
  }

  async deductMaterialsForProcedure(procedureId: number, userId: string): Promise<void> {
    // Get the procedure with materials
    const procedure = await this.getProcedure(procedureId, userId);
    
    if (!procedure || !procedure.materials || procedure.materials.length === 0) {
      return;
    }

    // Deduct materials from inventory
    for (const material of procedure.materials) {
      const { materialId, quantity } = material;
      
      // Get current stock
      const [item] = await db
        .select()
        .from(inventory)
        .where(and(eq(inventory.id, materialId), eq(inventory.userId, userId)));

      if (item && item.currentStock >= quantity) {
        // Deduct the quantity from current stock
        await db
          .update(inventory)
          .set({ 
            currentStock: item.currentStock - quantity 
          })
          .where(and(eq(inventory.id, materialId), eq(inventory.userId, userId)));
      }
    }
  }
}

export const procedureStorage = new DatabaseProcedureStorage();