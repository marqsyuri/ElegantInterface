// Script para executar todas as migrations na ordem correta
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrado no .env');
  console.error('   Certifique-se de que o arquivo .env existe e contém DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Lista de migrations na ordem correta
const migrations = [
  {
    name: 'Add Staff Fields',
    sqlFile: 'migrate-add-staff-fields.sql',
    script: 'run-migration-staff.js',
    description: 'Adiciona campos básicos de staff'
  },
  {
    name: 'Staff Login Fields',
    sqlFile: 'migrate-staff-login-fields.sql',
    script: 'run-migration-staff-login.js',
    description: 'Adiciona campos de login (username, password, company_id)'
  },
  {
    name: 'Staff Access Level',
    sqlFile: 'migrate-staff-access-level.sql',
    script: 'run-migration-staff-access-level.js',
    description: 'Adiciona campo access_level para controle de permissões'
  },
  {
    name: 'Add Datahr to Clients',
    sqlFile: 'migrate-add-datahr-to-clients.sql',
    script: 'run-migration-datahr-direct.js',
    description: 'Adiciona campo datahr na tabela clients'
  },
  {
    name: 'Add Waitlist to Appointments',
    sqlFile: 'migrate-add-waitlist-to-appointments.sql',
    script: 'run-migration-waitlist.js',
    description: 'Adiciona campo waitlist na tabela appointments'
  },
  {
    name: 'Appointment Staff Table',
    sqlFile: 'migrate-appointment-staff-table.sql',
    description: 'Cria tabela de relacionamento entre appointments e staff'
  },
  {
    name: 'Appointment Procedures Staff',
    sqlFile: 'migrate-appointment-procedures-staff.sql',
    description: 'Adiciona relacionamento entre procedures e staff em appointments'
  }
];

async function testConnection() {
  try {
    console.log('🔌 Testando conexão com o banco de dados...');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Conectado ao PostgreSQL');
    console.log(`   Versão: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    console.log(`   Hora do servidor: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

async function checkMigrationAlreadyApplied(sqlFile) {
  try {
    // Ler o arquivo SQL para verificar o que ele faz
    const sqlContent = readFileSync(join(__dirname, sqlFile), 'utf-8');
    
    // Verificar se é uma migration de adicionar coluna
    const addColumnMatch = sqlContent.match(/ADD COLUMN\s+(\w+)/i);
    if (addColumnMatch) {
      const columnName = addColumnMatch[1];
      const tableMatch = sqlContent.match(/ALTER TABLE\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const result = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [tableName, columnName]);
        return result.rows.length > 0;
      }
    }
    
    // Verificar se é uma migration de criar tabela
    const createTableMatch = sqlContent.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
    if (createTableMatch) {
      const tableName = createTableMatch[1];
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = $1
      `, [tableName]);
      return result.rows.length > 0;
    }
    
    return false;
  } catch (error) {
    // Se não conseguir verificar, assumir que não foi aplicada
    return false;
  }
}

async function runMigration(migration) {
  try {
    const sqlFile = join(__dirname, migration.sqlFile);
    
    // Verificar se o arquivo existe
    try {
      readFileSync(sqlFile, 'utf-8');
    } catch (error) {
      console.log(`⚠️  Arquivo ${migration.sqlFile} não encontrado, pulando...`);
      return { success: true, skipped: true };
    }
    
    // Verificar se já foi aplicada
    const alreadyApplied = await checkMigrationAlreadyApplied(migration.sqlFile);
    if (alreadyApplied) {
      console.log(`⏭️  ${migration.name}: Já aplicada, pulando...`);
      return { success: true, skipped: true };
    }
    
    console.log(`\n📝 Executando: ${migration.name}`);
    console.log(`   ${migration.description}`);
    
    const sql = readFileSync(sqlFile, 'utf-8');
    
    // Executar a migration
    await pool.query(sql);
    
    console.log(`✅ ${migration.name}: Aplicada com sucesso!`);
    return { success: true, skipped: false };
  } catch (error) {
    // Verificar se é um erro de "já existe"
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('já existe')) {
      console.log(`⏭️  ${migration.name}: Já aplicada (coluna/tabela já existe)`);
      return { success: true, skipped: true };
    }
    
    console.error(`❌ ${migration.name}: Erro ao aplicar`);
    console.error(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllMigrations() {
  console.log('🚀 Iniciando execução de todas as migrations...\n');
  
  // Testar conexão
  const connected = await testConnection();
  if (!connected) {
    await pool.end();
    process.exit(1);
  }
  
  console.log(`\n📋 Total de migrations: ${migrations.length}\n`);
  
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  // Executar cada migration
  for (const migration of migrations) {
    const result = await runMigration(migration);
    
    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.success++;
      }
    } else {
      results.failed++;
      results.errors.push({
        migration: migration.name,
        error: result.error
      });
    }
    
    // Pequena pausa entre migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DAS MIGRATIONS');
  console.log('='.repeat(60));
  console.log(`✅ Aplicadas com sucesso: ${results.success}`);
  console.log(`⏭️  Já aplicadas (puladas): ${results.skipped}`);
  console.log(`❌ Falharam: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    results.errors.forEach(({ migration, error }) => {
      console.log(`   - ${migration}: ${error}`);
    });
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 Todas as migrations foram processadas com sucesso!');
  } else {
    console.log('\n⚠️  Algumas migrations falharam. Verifique os erros acima.');
  }
  
  console.log('\n💡 Dica: Verifique os logs da aplicação após reiniciar.');
  console.log('   Comando: pm2 logs estetica-pro --lines 50\n');
}

// Executar
runAllMigrations()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Erro fatal ao executar migrations:', error);
    await pool.end();
    process.exit(1);
  });
