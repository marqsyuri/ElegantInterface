import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add waitlist field to appointments table...');
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL must be set');
    }

    const pool = new Pool({
      connectionString: DATABASE_URL,
    });
    const db = drizzle(pool);
    console.log('🔌 Connected to PostgreSQL');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'migrate-add-waitlist-to-appointments.sql');
    const migrationSQL = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    const result = await db.execute(sql.raw(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments' 
        AND column_name = 'waitlist';
    `));
    
    if (result.rows && result.rows.length > 0) {
      console.log('✅ Verification: waitlist column exists');
      console.log('   Column details:', result.rows[0]);
    } else {
      console.warn('⚠️  Warning: waitlist column not found after migration');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });

