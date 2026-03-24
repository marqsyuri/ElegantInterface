
import { db } from "../server/db";
import { staff, staffSchedules, appointments } from "@shared/schema";
import { eq, ilike, and, gte, lte } from "drizzle-orm";

// Mock implementation of the slot logic
async function testSlots() {
  const staffId = 1; // Clebinho
  const dateStr = "2026-01-23";
  
  console.log(`Testing slots for Staff ${staffId} on ${dateStr}`);
  
  // 1. Get Schedule
  const schedule = await db.select().from(staffSchedules).where(eq(staffSchedules.staffId, staffId));
  const dayName = 'friday'; // 23/01/2026 is Friday
  const daySchedule = schedule.find(s => s.dayOfWeek.toLowerCase() === dayName);
  
  if (!daySchedule || !daySchedule.isAvailable) {
    console.log("Staff not working on this day.");
    return;
  }
  
  const openTime = daySchedule.startTime;
  const closeTime = daySchedule.endTime;
  console.log(`Working Hours: ${openTime} - ${closeTime}`);
  
  // 2. Get Blockers
  const startOfDay = new Date("2026-01-23T00:00:00");
  const endOfDay = new Date("2026-01-23T23:59:59");
    
  const appts = await db.select().from(appointments).where(
    and(
        eq(appointments.staffId, staffId),
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay)
    )
  );
  
  const blockers = appts.map(apt => {
     const aptDate = new Date(apt.appointmentDate);
     // Note: In script environment, timezone might differ from server? 
     // Assuming script runs in same env as server (Windows Local).
     const startMinutes = aptDate.getHours() * 60 + aptDate.getMinutes();
     const duration = apt.totalDuration || apt.duration || 60; 
     return { start: startMinutes, end: startMinutes + duration };
  });
  
  console.log("Blockers:", blockers);
  
  // 3. Generate Slots
  const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (m) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startMin = timeToMinutes(openTime);
  const endMin = timeToMinutes(closeTime);
  const slots = [];
  const totalDuration = 30; // Assuming 30 min service
  
  for (let time = startMin; time < endMin; time += 30) {
    const slotStart = time;
    const slotEnd = time + totalDuration;

    if (slotEnd > endMin) continue;

    const isBlocked = blockers.some(b => {
         return slotStart < b.end && slotEnd > b.start;
    });

    if (!isBlocked) {
        slots.push(minutesToTime(slotStart));
    } else {
        // console.log(`Blocked: ${minutesToTime(slotStart)}`);
    }
  }
  
  console.log("Available Slots:", slots);
  process.exit(0);
}

testSlots().catch(console.error);
