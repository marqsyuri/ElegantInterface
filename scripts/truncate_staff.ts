
import { db } from "../server/db"; // Adjust import if needed based on tsconfig paths
import { sql } from "drizzle-orm";

async function truncateStaff() {
  console.log("⚠️  Starting Staff Table Truncation...");
  try {
    // Execute raw SQL to truncate with cascade
    await db.execute(sql`TRUNCATE TABLE staff CASCADE`);
    console.log("✅ Successfully truncated 'staff' table with CASCADE.");
    console.log("👉 You can now run 'npm run db:push' again.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error truncating table:", error);
    process.exit(1);
  }
}

truncateStaff();
