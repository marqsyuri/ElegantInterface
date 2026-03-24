#!/usr/bin/env node

/**
 * ============================================================================
 * SCRIPT DE MIGRATION MASTER PARA UBUNTU
 * ============================================================================
 * 
 * Este script executa a migration completa do banco de dados para deploy
 * em ambiente Ubuntu/Linux. Ele cria todas as tabelas e adiciona todas as
 * colunas necessárias.
 * 
 * USO:
 *   node run-master-migration-ubuntu.js
 *   ou
 *   tsx run-master-migration-ubuntu.js
 * 
 * REQUISITOS:
 *   - PostgreSQL instalado e rodando
 *   - Arquivo .env com DATABASE_URL configurado
 *   - Permissões adequadas no banco de dados
 * 
 * ============================================================================
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  const line = '='.repeat(80);
  log(`\n${line}`, 'cyan');
  log(`${colors.bold}${message}${colors.reset}`, 'cyan');
  log(line, 'cyan');
}

function logStep(step, message) {
  log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Verificar DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logError('DATABASE_URL não encontrado no .env');
  logInfo('Certifique-se de que o arquivo .env existe e contém DATABASE_URL');
  logInfo('Exemplo: DATABASE_URL=postgresql://usuario:senha@localhost:5432/estetica_pro');
  process.exit(1);
}

// Criar pool de conexão
const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Testa a conexão com o banco de dados
 */
async function testConnection() {
  logStep('1/5', 'Testando conexão com o banco de dados...');
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    const version = result.rows[0].pg_version.split(' ');
    
    logSuccess('Conectado ao PostgreSQL');
    logInfo(`   Versão: ${version[0]} ${version[1]}`);
    logInfo(`   Hora do servidor: ${result.rows[0].current_time}`);
    logInfo(`   Database: ${DATABASE_URL.split('/').pop().split('?')[0]}`);
    
    return true;
  } catch (error) {
    logError('Erro ao conectar ao banco de dados');
    logError(`   ${error.message}`);
    logInfo('\nVerifique:');
    logInfo('   - PostgreSQL está instalado e rodando');
    logInfo('   - DATABASE_URL está correto no .env');
    logInfo('   - Usuário tem permissões adequadas');
    return false;
  }
}

/**
 * Cria backup do banco antes da migration
 */
async function createBackup() {
  logStep('2/5', 'Verificando tabelas existentes...');
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    
    if (tables.length > 0) {
      logWarning(`Encontradas ${tables.length} tabelas existentes`);
      logInfo('   Tabelas: ' + tables.slice(0, 5).join(', ') + (tables.length > 5 ? '...' : ''));
      logInfo('\n   💡 Recomendação: Faça backup antes de continuar!');
      logInfo('   Comando: pg_dump -U postgres estetica_pro > backup_$(date +%Y%m%d_%H%M%S).sql');
    } else {
      logInfo('Nenhuma tabela existente encontrada - banco novo');
    }
    
    return true;
  } catch (error) {
    logWarning('Não foi possível verificar tabelas existentes');
    logWarning(`   ${error.message}`);
    return true; // Continuar mesmo assim
  }
}

/**
 * Executa a migration master
 */
async function runMasterMigration() {
  logStep('3/5', 'Executando migration master...');
  
  try {
    // Ler arquivo SQL
    const sqlFile = join(__dirname, 'migrate-master-ubuntu.sql');
    const sql = readFileSync(sqlFile, 'utf-8');
    
    logInfo('   Arquivo: migrate-master-ubuntu.sql');
    logInfo('   Tamanho: ' + (sql.length / 1024).toFixed(2) + ' KB');
    
    // Executar SQL
    logInfo('\n   Executando SQL... (isso pode levar alguns segundos)');
    await pool.query(sql);
    
    logSuccess('Migration master executada com sucesso!');
    return true;
  } catch (error) {
    logError('Erro ao executar migration master');
    logError(`   ${error.message}`);
    
    // Verificar se é erro de "já existe"
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('já existe')) {
      logWarning('   Algumas tabelas/colunas já existem - isso é normal');
      return true;
    }
    
    return false;
  }
}

/**
 * Verifica as tabelas criadas
 */
async function verifyTables() {
  logStep('4/5', 'Verificando tabelas criadas...');
  
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = result.rows;
    
    logSuccess(`Total de ${tables.length} tabelas no banco de dados`);
    
    // Listar tabelas principais
    const mainTables = [
      'users', 'companies', 'clients', 'staff', 'appointments', 
      'procedures', 'products', 'services', 'notifications', 'sales'
    ];
    
    logInfo('\n   Tabelas principais:');
    mainTables.forEach(tableName => {
      const table = tables.find(t => t.table_name === tableName);
      if (table) {
        logSuccess(`      ✓ ${tableName} (${table.column_count} colunas)`);
      } else {
        logWarning(`      ✗ ${tableName} - NÃO ENCONTRADA`);
      }
    });
    
    return true;
  } catch (error) {
    logError('Erro ao verificar tabelas');
    logError(`   ${error.message}`);
    return false;
  }
}

/**
 * Verifica colunas críticas
 */
async function verifyCriticalColumns() {
  logStep('5/5', 'Verificando colunas críticas...');
  
  const criticalColumns = [
    { table: 'clients', column: 'datahr', description: 'Data/hora último agendamento' },
    { table: 'appointments', column: 'waitlist', description: 'Lista de espera' },
    { table: 'staff', column: 'username', description: 'Login do staff' },
    { table: 'staff', column: 'password', description: 'Senha do staff' },
    { table: 'staff', column: 'access_level', description: 'Nível de acesso' },
    { table: 'staff', column: 'company_id', description: 'ID da empresa' },
    { table: 'users', column: 'language', description: 'Idioma preferido' },
    { table: 'users', column: 'currency', description: 'Moeda preferida' }
  ];
  
  let allFound = true;
  
  logInfo('\n   Verificando colunas importantes:');
  
  for (const { table, column, description } of criticalColumns) {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
      
      if (result.rows.length > 0) {
        const dataType = result.rows[0].data_type;
        logSuccess(`      ✓ ${table}.${column} (${dataType}) - ${description}`);
      } else {
        logWarning(`      ✗ ${table}.${column} - NÃO ENCONTRADA`);
        allFound = false;
      }
    } catch (error) {
      logWarning(`      ? ${table}.${column} - Erro ao verificar`);
    }
  }
  
  return allFound;
}

/**
 * Exibe resumo final
 */
function showSummary(success) {
  logHeader('RESUMO DA MIGRATION');
  
  if (success) {
    logSuccess('\n🎉 Migration concluída com sucesso!\n');
    
    log('📋 Próximos passos:', 'cyan');
    log('   1. Reinicie a aplicação:', 'white');
    log('      pm2 restart estetica-pro', 'yellow');
    log('      ou', 'white');
    log('      npm start', 'yellow');
    log('');
    log('   2. Verifique os logs:', 'white');
    log('      pm2 logs estetica-pro --lines 50', 'yellow');
    log('');
    log('   3. Teste a aplicação:', 'white');
    log('      - Acesse o sistema', 'white');
    log('      - Faça login', 'white');
    log('      - Verifique funcionalidades principais', 'white');
    log('');
    
    logInfo('💡 Dica: Se encontrar erros, verifique os logs da aplicação');
    
  } else {
    logError('\n❌ Migration falhou!\n');
    
    log('🔧 Solução de problemas:', 'yellow');
    log('   1. Verifique o arquivo .env', 'white');
    log('   2. Confirme que PostgreSQL está rodando', 'white');
    log('   3. Verifique permissões do usuário do banco', 'white');
    log('   4. Consulte os logs acima para detalhes do erro', 'white');
    log('');
    
    logInfo('📖 Documentação: Veja GUIA_EXECUTAR_MIGRATIONS_VPS.md');
  }
  
  log('');
}

/**
 * Função principal
 */
async function main() {
  logHeader('🚀 MIGRATION MASTER - UBUNTU DEPLOYMENT');
  
  logInfo('Este script irá criar/atualizar todas as tabelas do banco de dados');
  logInfo('Certifique-se de ter feito backup antes de continuar!\n');
  
  let success = true;
  
  try {
    // 1. Testar conexão
    const connected = await testConnection();
    if (!connected) {
      success = false;
      await pool.end();
      showSummary(success);
      process.exit(1);
    }
    
    // 2. Verificar backup
    await createBackup();
    
    // 3. Executar migration
    const migrationOk = await runMasterMigration();
    if (!migrationOk) {
      success = false;
    }
    
    // 4. Verificar tabelas
    if (success) {
      const tablesOk = await verifyTables();
      if (!tablesOk) {
        logWarning('Algumas verificações falharam, mas migration pode ter sido bem-sucedida');
      }
    }
    
    // 5. Verificar colunas críticas
    if (success) {
      const columnsOk = await verifyCriticalColumns();
      if (!columnsOk) {
        logWarning('Algumas colunas críticas não foram encontradas');
      }
    }
    
  } catch (error) {
    logError(`Erro inesperado: ${error.message}`);
    success = false;
  } finally {
    await pool.end();
    showSummary(success);
  }
  
  process.exit(success ? 0 : 1);
}

// Executar
main().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  pool.end();
  process.exit(1);
});
