import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('📝 Executando migration para adicionar campos de staff...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set');
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const db = drizzle(pool);
    console.log('🔌 Conectado ao PostgreSQL');

    const migrationSQL = readFileSync(join(__dirname, 'migrate-add-staff-fields.sql'), 'utf-8');

    // Execute the entire DO $$ block as a single statement
    console.log('Executando migration SQL...');
    await db.execute(sql.raw(migrationSQL));

    await pool.end();
    console.log('✅ Migration executada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();

