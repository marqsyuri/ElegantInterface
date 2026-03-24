#!/usr/bin/env node

/**
 * Script de configuração automatizada do banco de dados
 * Verifica conexão, cria database se necessário, roda migrations e popula dados iniciais
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Cores para output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${step}. ${message}`, 'cyan');
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

async function checkEnvironment() {
    logStep(1, 'Verificando variáveis de ambiente...');
    
    if (!process.env.DATABASE_URL) {
        logError('DATABASE_URL não encontrada no arquivo .env');
        log('Criando arquivo .env com configuração padrão...', 'yellow');
        
        const envContent = `DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro
SESSION_SECRET=estetica_pro_session_secret_key_2024_very_long_and_secure_string
NODE_ENV=development
PORT=5000
`;
        
        try {
            const fs = await import('fs');
            fs.writeFileSync('.env', envContent);
            logSuccess('Arquivo .env criado com configuração padrão');
        } catch (error) {
            logError(`Erro ao criar arquivo .env: ${error.message}`);
            process.exit(1);
        }
    }
    
    logSuccess('Variáveis de ambiente verificadas');
}

async function testPostgreSQLConnection() {
    logStep(2, 'Testando conexão com PostgreSQL...');
    
    const DATABASE_URL = process.env.DATABASE_URL;
    const isNeon = DATABASE_URL.includes('neon.tech');
    
    if (isNeon) {
        logSuccess('Usando Neon PostgreSQL (cloud)');
        return true;
    }
    
    // Para PostgreSQL local, testar conexão básica
    try {
        const pool = new Pool({
            connectionString: DATABASE_URL.replace('/estetica_pro', '/postgres'),
            max: 1
        });
        
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        await pool.end();
        
        logSuccess('Conexão com PostgreSQL estabelecida');
        return true;
    } catch (error) {
        logError(`Erro ao conectar com PostgreSQL: ${error.message}`);
        log('Verifique se:', 'yellow');
        log('  - PostgreSQL está instalado e rodando', 'yellow');
        log('  - Usuário e senha estão corretos', 'yellow');
        log('  - Porta 5432 está acessível', 'yellow');
        return false;
    }
}

async function createDatabase() {
    logStep(3, 'Verificando se o banco de dados existe...');
    
    const DATABASE_URL = process.env.DATABASE_URL;
    const isNeon = DATABASE_URL.includes('neon.tech');
    
    if (isNeon) {
        logSuccess('Neon PostgreSQL - banco já configurado');
        return true;
    }
    
    // Extrair informações da URL
    const url = new URL(DATABASE_URL);
    const dbName = url.pathname.slice(1); // Remove a barra inicial
    const baseUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}${url.port ? ':' + url.port : ''}/postgres`;
    
    try {
        // Conectar ao banco postgres para verificar se o banco existe
        const pool = new Pool({ connectionString: baseUrl, max: 1 });
        const client = await pool.connect();
        
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );
        
        if (result.rows.length === 0) {
            log(`Criando banco de dados '${dbName}'...`, 'yellow');
            await client.query(`CREATE DATABASE "${dbName}"`);
            logSuccess(`Banco de dados '${dbName}' criado`);
        } else {
            logSuccess(`Banco de dados '${dbName}' já existe`);
        }
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        logError(`Erro ao verificar/criar banco de dados: ${error.message}`);
        return false;
    }
}

async function runMigrations() {
    logStep(4, 'Executando migrações do banco de dados...');
    
    try {
        // Verificar se drizzle-kit está disponível
        execSync('npx drizzle-kit push', { stdio: 'inherit' });
        logSuccess('Migrações executadas com sucesso');
        return true;
    } catch (error) {
        logError(`Erro ao executar migrações: ${error.message}`);
        log('Tentando método alternativo...', 'yellow');
        
        try {
            // Método alternativo: executar schema diretamente
            execSync('npm run db:push', { stdio: 'inherit' });
            logSuccess('Schema sincronizado com sucesso');
            return true;
        } catch (altError) {
            logError(`Erro no método alternativo: ${altError.message}`);
            return false;
        }
    }
}

async function seedDatabase() {
    logStep(5, 'Verificando se há dados iniciais para popular...');
    
    try {
        // Verificar se o arquivo de seed existe
        if (existsSync('./server/seed.ts')) {
            log('Executando seed do banco de dados...', 'yellow');
            execSync('npm run db:seed', { stdio: 'inherit' });
            logSuccess('Dados iniciais inseridos');
        } else {
            log('Arquivo de seed não encontrado, pulando...', 'yellow');
        }
        return true;
    } catch (error) {
        logWarning(`Erro ao executar seed: ${error.message}`);
        log('Continuando sem dados iniciais...', 'yellow');
        return true; // Não é crítico
    }
}

async function verifySetup() {
    logStep(6, 'Verificando configuração final...');
    
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
        const client = await pool.connect();
        
        // Verificar se as tabelas principais existem
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        const tables = result.rows.map(row => row.table_name);
        
        if (tables.length > 0) {
            logSuccess(`Banco configurado com ${tables.length} tabelas`);
            log(`Tabelas encontradas: ${tables.join(', ')}`, 'cyan');
        } else {
            logWarning('Nenhuma tabela encontrada no banco');
        }
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        logError(`Erro na verificação final: ${error.message}`);
        return false;
    }
}

async function main() {
    log('🚀 Configuração do Banco de Dados - Estética Pro', 'green');
    log('================================================', 'green');
    
    try {
        await checkEnvironment();
        
        const connectionOk = await testPostgreSQLConnection();
        if (!connectionOk) {
            process.exit(1);
        }
        
        const dbCreated = await createDatabase();
        if (!dbCreated) {
            process.exit(1);
        }
        
        const migrationsOk = await runMigrations();
        if (!migrationsOk) {
            logWarning('Migrações falharam, mas continuando...');
        }
        
        await seedDatabase();
        
        const setupOk = await verifySetup();
        if (!setupOk) {
            logWarning('Verificação final falhou, mas setup básico está completo');
        }
        
        log('\n🎉 Configuração do banco de dados concluída!', 'green');
        log('==========================================', 'green');
        log('📋 Próximos passos:', 'cyan');
        log('  1. Execute: npm run dev (ou ./start-dev.ps1 no Windows)', 'yellow');
        log('  2. Acesse: http://localhost:5000', 'yellow');
        log('  3. Login: admin / admin', 'yellow');
        
    } catch (error) {
        logError(`Erro inesperado: ${error.message}`);
        process.exit(1);
    }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        logError(`Erro fatal: ${error.message}`);
        process.exit(1);
    });
}




