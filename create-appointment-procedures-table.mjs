import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTable() {
  try {
    console.log('🔧 Criando tabela appointment_procedures...\n');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointment_procedures (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        procedure_id INTEGER NOT NULL REFERENCES procedures(id),
        "order" INTEGER DEFAULT 0,
        procedure_name VARCHAR NOT NULL,
        procedure_category VARCHAR NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        materials JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabela appointment_procedures criada com sucesso!');
    
    // Verify table
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'appointment_procedures'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Colunas da tabela:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(20)} - ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();

