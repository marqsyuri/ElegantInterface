import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('📝 Executando migration para adicionar campo datahr...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set');
    }

    const DATABASE_URL = process.env.DATABASE_URL;
    const isNeon = DATABASE_URL.includes('neon.tech');
    
    let pool;
    
    if (isNeon) {
      neonConfig.webSocketConstructor = ws;
      pool = new NeonPool({ connectionString: DATABASE_URL });
      console.log('🔌 Usando Neon serverless PostgreSQL');
    } else {
      const { Pool: PgPool } = pg;
      pool = new PgPool({ connectionString: DATABASE_URL });
      console.log('🔌 Usando PostgreSQL local');
    }
    
    const migrationSQL = readFileSync(join(__dirname, 'migrate-add-datahr-to-clients.sql'), 'utf-8');
    
    console.log('Executando migration SQL...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration executada com sucesso!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();

