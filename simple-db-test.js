import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 Testando conexão com banco de dados...\n');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/estetica_pro';

console.log('DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':***@'));

try {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  
  console.log('✅ Conexão com PostgreSQL estabelecida!');
  
  // Testar query simples
  const result = await client.query('SELECT version()');
  console.log('✅ Query de teste funcionando');
  console.log('Versão PostgreSQL:', result.rows[0].version.split(' ')[0]);
  
  // Verificar se banco existe
  const dbResult = await client.query(`
    SELECT datname FROM pg_database WHERE datname = 'estetica_pro'
  `);
  
  if (dbResult.rows.length > 0) {
    console.log('✅ Banco de dados "estetica_pro" existe');
  } else {
    console.log('❌ Banco de dados "estetica_pro" não existe');
  }
  
  // Verificar tabela users
  const tableResult = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    );
  `);
  
  if (tableResult.rows[0].exists) {
    console.log('✅ Tabela "users" existe');
    
    // Verificar usuário admin
    const adminResult = await client.query(`
      SELECT id, username, email, is_active 
      FROM users 
      WHERE username = 'admin'
    `);
    
    if (adminResult.rows.length > 0) {
      console.log('✅ Usuário admin encontrado');
      console.log('   ID:', adminResult.rows[0].id);
      console.log('   Username:', adminResult.rows[0].username);
      console.log('   Email:', adminResult.rows[0].email);
      console.log('   Ativo:', adminResult.rows[0].is_active);
    } else {
      console.log('❌ Usuário admin não encontrado');
    }
  } else {
    console.log('❌ Tabela "users" não existe');
  }
  
  client.release();
  await pool.end();
  
  console.log('\n🎉 Teste concluído com sucesso!');
  
} catch (error) {
  console.error('❌ Erro na conexão:', error.message);
  
  if (error.code === 'ECONNREFUSED') {
    console.error('PostgreSQL não está rodando ou não está acessível');
  } else if (error.code === 'ENOTFOUND') {
    console.error('Host do banco de dados não encontrado');
  } else if (error.code === '28P01') {
    console.error('Falha na autenticação - verifique usuário e senha');
  } else if (error.code === '3D000') {
    console.error('Banco de dados não existe');
  }
  
  process.exit(1);
}


