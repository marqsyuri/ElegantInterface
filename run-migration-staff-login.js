// Script para executar migração de campos de login na tabela staff
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrado no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('🔄 Lendo arquivo de migração...');
    const sql = readFileSync(join(__dirname, 'migrate-staff-login-fields.sql'), 'utf8');
    
    console.log('📝 Aplicando migração...');
    await pool.query(sql);
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar se as colunas foram criadas
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staff' 
        AND column_name IN ('username', 'password', 'company_id')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Colunas verificadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

