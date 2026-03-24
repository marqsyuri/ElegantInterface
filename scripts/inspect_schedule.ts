
import { db } from "../server/db";
import { staff, staffSchedules } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function inspect() {
  const clebinhos = await db.select().from(staff).where(ilike(staff.name, "%Clebinho%"));
  if (clebinhos.length === 0) return;
  const clebinho = clebinhos[0];
  
  console.log("Schedule for Clebinho (ID " + clebinho.id + "):");
  const schedules = await db.select().from(staffSchedules).where(eq(staffSchedules.staffId, clebinho.id));
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  schedules.forEach(s => {
    // dayOfWeek in DB might be string or number? Schema says string usually? 
    // Let's print it.
    console.log(s);
  });
  
  process.exit(0);
}

inspect().catch(console.error);
