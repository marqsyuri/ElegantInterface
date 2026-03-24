
import { db } from "../server/db";
import { staff, staffSchedules, users, appointments } from "@shared/schema";
import { eq, ilike, and, gte, lte } from "drizzle-orm";

async function inspect() {
  console.log("Searching for Clebinho...");
  const clebinhos = await db.select().from(staff).where(ilike(staff.name, "%Clebinho%"));
  
  if (clebinhos.length === 0) {
    console.log("No staff found with name like 'Clebinho'");
    const allStaff = await db.select().from(staff);
    console.log("All staff:", allStaff.map(s => s.name));
    return;
  }

  const clebinho = clebinhos[0];
  console.log("Found Clebinho:", clebinho);

  console.log("Checking schedule for Clebinho (Staff ID: " + clebinho.id + ")...");
  const schedule = await db.select().from(staffSchedules).where(eq(staffSchedules.staffId, clebinho.id));
  console.log("Schedule:", schedule);

  // Check for Date 2026-01-23
  const dateStr = "2026-01-23";
  // The user might have meant 2025? But they said 2026. Let's check 2026.
  // Actually, standard date is usually current year, but user explicitly said 2026. 
  // Wait, current time is 2026-01-22. So 23/01/2026 is tomorrow.

  const startOfDay = new Date("2026-01-23T00:00:00");
  const endOfDay = new Date("2026-01-23T23:59:59");
  
  console.log("Checking appointments for 2026-01-23...");
  const appts = await db.select().from(appointments).where(
    and(
        eq(appointments.staffId, clebinho.id),
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay)
    )
  );
  console.log("Appointments:", appts);

  process.exit(0);
}

inspect().catch(console.error);
