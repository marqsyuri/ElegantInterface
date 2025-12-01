#!/usr/bin/env node

/**
 * Teste de Conexão com Banco de Dados PostgreSQL
 * 
 * Este script testa a conexão com o banco de dados e verifica
 * se as tabelas necessárias existem e estão acessíveis.
 * 
 * Uso: node test-db-connection.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERRO: ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testDatabaseConnection() {
  log('\n🔍 TESTE DE CONEXÃO COM BANCO DE DADOS', 'cyan');
  log('=====================================', 'cyan');

  // 1. Verificar se arquivo .env existe
  log('\n1. Verificando arquivo .env...', 'blue');
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('Arquivo .env não encontrado!');
    logInfo('Criando arquivo .env com configurações padrão...');
    
    const defaultEnv = `# Configurações do Banco de Dados
DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro

# Configurações da Sessão
SESSION_SECRET=estetica-pro-secret-key-2025

# Configurações do Servidor
NODE_ENV=development
PORT=5000

# Configurações do Replit (opcional)
REPLIT_DOMAINS=localhost
REPL_ID=test-repl-id
`;
    
    fs.writeFileSync(envPath, defaultEnv);
    logSuccess('Arquivo .env criado com configurações padrão');
  } else {
    logSuccess('Arquivo .env encontrado');
  }

  // 2. Carregar variáveis de ambiente
  log('\n2. Carregando variáveis de ambiente...', 'blue');
  dotenv.config();
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logError('DATABASE_URL não definida no arquivo .env');
    return false;
  }
  
  logSuccess(`DATABASE_URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);

  // 3. Testar conexão com banco
  log('\n3. Testando conexão com PostgreSQL...', 'blue');
  
  let pool;
  try {
    pool = new Pool({ connectionString: databaseUrl });
    
    // Testar conexão
    const client = await pool.connect();
    logSuccess('Conexão com PostgreSQL estabelecida!');
    
    // 4. Verificar se banco existe
    log('\n4. Verificando banco de dados...', 'blue');
    const dbName = databaseUrl.split('/').pop().split('?')[0];
    logInfo(`Banco de dados: ${dbName}`);
    
    // 5. Verificar tabelas essenciais
    log('\n5. Verificando tabelas essenciais...', 'blue');
    
    const essentialTables = [
      'users',
      'clients', 
      'appointments',
      'services',
      'procedures',
      'transactions'
    ];
    
    for (const table of essentialTables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (result.rows[0].exists) {
          logSuccess(`Tabela '${table}' existe`);
        } else {
          logWarning(`Tabela '${table}' não encontrada`);
        }
      } catch (error) {
        logError(`Erro ao verificar tabela '${table}': ${error.message}`);
      }
    }
    
    // 6. Verificar usuário admin
    log('\n6. Verificando usuário admin...', 'blue');
    try {
      const adminResult = await client.query(`
        SELECT id, username, email, is_active, role 
        FROM users 
        WHERE username = 'admin'
      `);
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        logSuccess(`Usuário admin encontrado:`);
        logInfo(`  ID: ${admin.id}`);
        logInfo(`  Username: ${admin.username}`);
        logInfo(`  Email: ${admin.email}`);
        logInfo(`  Ativo: ${admin.is_active ? 'Sim' : 'Não'}`);
        logInfo(`  Role: ${admin.role}`);
      } else {
        logWarning('Usuário admin não encontrado');
        logInfo('Você pode precisar importar o backup do banco de dados');
      }
    } catch (error) {
      logError(`Erro ao verificar usuário admin: ${error.message}`);
    }
    
    // 7. Testar query de login
    log('\n7. Testando query de login...', 'blue');
    try {
      const loginResult = await client.query(`
        SELECT id, username, password, is_active 
        FROM users 
        WHERE username = $1 AND is_active = true
      `, ['admin']);
      
      if (loginResult.rows.length > 0) {
        logSuccess('Query de login funcionando');
        logInfo(`Usuário encontrado: ${loginResult.rows[0].username}`);
      } else {
        logWarning('Nenhum usuário ativo encontrado para login');
      }
    } catch (error) {
      logError(`Erro na query de login: ${error.message}`);
    }
    
    // 8. Verificar configurações de sessão
    log('\n8. Verificando configurações de sessão...', 'blue');
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret) {
      logSuccess('SESSION_SECRET configurado');
    } else {
      logWarning('SESSION_SECRET não configurado');
    }
    
    client.release();
    await pool.end();
    
    log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!', 'green');
    log('O banco de dados está funcionando corretamente.', 'green');
    
    return true;
    
  } catch (error) {
    logError(`Falha na conexão com banco de dados: ${error.message}`);
    
    // Diagnóstico de problemas comuns
    log('\n🔧 DIAGNÓSTICO DE PROBLEMAS:', 'yellow');
    
    if (error.code === 'ECONNREFUSED') {
      logError('PostgreSQL não está rodando ou não está acessível');
      logInfo('Soluções possíveis:');
      logInfo('1. Iniciar PostgreSQL: sudo service postgresql start (Linux)');
      logInfo('2. Verificar se PostgreSQL está rodando na porta 5432');
      logInfo('3. Usar Docker: docker run --name estetica-postgres -e POSTGRES_PASSWORD=1234 -e POSTGRES_DB=estetica_pro -p 5432:5432 -d postgres:16');
    } else if (error.code === 'ENOTFOUND') {
      logError('Host do banco de dados não encontrado');
      logInfo('Verifique se o host em DATABASE_URL está correto');
    } else if (error.code === '28P01') {
      logError('Falha na autenticação');
      logInfo('Verifique usuário e senha em DATABASE_URL');
    } else if (error.code === '3D000') {
      logError('Banco de dados não existe');
      logInfo('Crie o banco: CREATE DATABASE estetica_pro;');
    }
    
    if (pool) {
      await pool.end();
    }
    
    return false;
  }
}

// Executar teste
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Erro inesperado: ${error.message}`);
      process.exit(1);
    });
}

export { testDatabaseConnection };
