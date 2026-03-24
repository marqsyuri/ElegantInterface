import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sql } from 'drizzle-orm';

// Import db using dynamic import to handle TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('📝 Executando migration para adicionar campo datahr...');
    
    // Dynamic import to handle TypeScript files
    const { db } = await import('./server/db.ts');
    
    const migrationSQL = readFileSync(join(__dirname, 'migrate-add-datahr-to-clients.sql'), 'utf-8');
    
    // Execute the entire SQL file as a single statement (handles DO blocks)
    console.log('Executando migration SQL...');
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration executada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();

