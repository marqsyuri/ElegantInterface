import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Check if admin user exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (!existingAdmin) {
      // Create admin user with MD5 hash of 'admin' password
      const [admin] = await db.insert(users).values({
        username: 'admin',
        email: 'admin@esteticapro.com',
        password: '21232f297a57a5a743894a0e4a801fc3', // MD5 hash of 'admin'
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      }).returning();
      
      console.log('Admin user created:', admin);
    } else {
      console.log('Admin user already exists');
    }
    
    console.log("Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
