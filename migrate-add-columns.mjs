import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('🔄 Adicionando colunas language e currency...');
    
    // Add language column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'pt-BR';
    `);
    console.log('✅ Coluna language adicionada');
    
    // Add currency column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'BRL';
    `);
    console.log('✅ Coluna currency adicionada');
    
    // Update existing users
    await pool.query(`
      UPDATE users 
      SET language = 'pt-BR' 
      WHERE language IS NULL;
    `);
    console.log('✅ Valores padrão de language aplicados');
    
    await pool.query(`
      UPDATE users 
      SET currency = 'BRL' 
      WHERE currency IS NULL;
    `);
    console.log('✅ Valores padrão de currency aplicados');
    
    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();


