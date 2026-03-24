
import { db } from "../server/db";
import { staff, staffSchedules } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function seed() {
  const clebinhos = await db.select().from(staff).where(ilike(staff.name, "%Clebinho%"));
  if (clebinhos.length === 0) {
    console.log("Clebinho not found");
    return;
  }
  const clebinho = clebinhos[0];
  console.log("Seeding schedule for Clebinho (ID " + clebinho.id + ")");

  // Clear existing (just in case)
  await db.delete(staffSchedules).where(eq(staffSchedules.staffId, clebinho.id));

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (const day of days) {
    await db.insert(staffSchedules).values({
      staffId: clebinho.id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      isAvailable: true
    });
  }
  
  console.log("Schedule seeded!");
  process.exit(0);
}

seed().catch(console.error);
