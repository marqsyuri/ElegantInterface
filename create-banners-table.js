// Script para criar a tabela banners se não existir
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createBannersTableSQL = `
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    images JSONB NOT NULL,
    mode VARCHAR NOT NULL DEFAULT 'fixed',
    duration INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_user_id ON banners(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
`;

async function createBannersTable() {
  try {
    console.log('🔧 Creating banners table...');
    await pool.query(createBannersTableSQL);
    console.log('✅ Banners table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating banners table:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createBannersTable();

