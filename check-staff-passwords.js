// Script para verificar e definir senhas de staff
import { Pool } from 'pg';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrado no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function hashPasswordMD5(password) {
  return createHash('md5').update(password).digest('hex');
}

async function listStaff() {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.username,
        s.name,
        s.email,
        s.password,
        s.is_active,
        u.username as admin_username,
        u.id as admin_id
      FROM staff s
      LEFT JOIN users u ON CAST(s.user_id AS INTEGER) = u.id
      ORDER BY s.id;
    `);
    
    console.log('\n📋 Lista de Staff:\n');
    console.log('ID | Username | Nome | Email | Tem Senha | Admin | Ativo');
    console.log('─'.repeat(80));
    
    result.rows.forEach(staff => {
      const hasPassword = staff.password ? '✅ Sim' : '❌ Não';
      const isActive = staff.is_active ? '✅' : '❌';
      console.log(
        `${staff.id.toString().padEnd(3)} | ${(staff.username || 'N/A').padEnd(10)} | ${(staff.name || '').padEnd(20)} | ${(staff.email || '').padEnd(20)} | ${hasPassword.padEnd(10)} | ${(staff.admin_username || '').padEnd(10)} | ${isActive}`
      );
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Erro ao listar staff:', error);
    throw error;
  }
}

async function setStaffPassword(staffId, password, username = null) {
  try {
    const hashedPassword = hashPasswordMD5(password);
    
    // Se username foi fornecido, atualizar também
    let query, params;
    if (username) {
      // Verificar se username já existe em outro staff
      const existing = await pool.query('SELECT id FROM staff WHERE username = $1 AND id != $2', [username, staffId]);
      if (existing.rows.length > 0) {
        console.error(`❌ Username "${username}" já está em uso por outro staff`);
        return false;
      }
      
      query = `
        UPDATE staff 
        SET password = $1, username = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, username, name;
      `;
      params = [hashedPassword, username, staffId];
    } else {
      query = `
        UPDATE staff 
        SET password = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, username, name;
      `;
      params = [hashedPassword, staffId];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.error(`❌ Staff com ID ${staffId} não encontrado`);
      return false;
    }
    
    const staff = result.rows[0];
    console.log(`\n✅ ${username ? 'Username e senha' : 'Senha'} definida para staff:`);
    console.log(`   ID: ${staff.id}`);
    console.log(`   Username: ${staff.username || 'N/A'}`);
    console.log(`   Nome: ${staff.name}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Hash MD5: ${hashedPassword}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao definir senha:', error);
    throw error;
  }
}

async function createStaffWithPassword(username, password, name, adminId, email = null) {
  try {
    // Verificar se admin existe
    const adminCheck = await pool.query('SELECT id, company_id FROM users WHERE id = $1', [adminId]);
    if (adminCheck.rows.length === 0) {
      console.error(`❌ Admin com ID ${adminId} não encontrado`);
      return false;
    }
    
    const admin = adminCheck.rows[0];
    const hashedPassword = hashPasswordMD5(password);
    
    // Verificar se username já existe
    const existingStaff = await pool.query('SELECT id FROM staff WHERE username = $1', [username]);
    if (existingStaff.rows.length > 0) {
      console.error(`❌ Username "${username}" já existe`);
      return false;
    }
    
    const result = await pool.query(`
      INSERT INTO staff (user_id, company_id, username, password, name, email, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, 'therapist', true)
      RETURNING id, username, name;
    `, [adminId, admin.company_id, username, hashedPassword, name, email]);
    
    const staff = result.rows[0];
    console.log(`\n✅ Staff criado com sucesso:`);
    console.log(`   ID: ${staff.id}`);
    console.log(`   Username: ${staff.username}`);
    console.log(`   Nome: ${staff.name}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Hash MD5: ${hashedPassword}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar staff:', error);
    throw error;
  }
}

// Main
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    if (command === 'list') {
      await listStaff();
    } else if (command === 'set-password') {
      const staffId = parseInt(args[1]);
      const password = args[2];
      const username = args[3] || null; // Opcional
      
      if (!staffId || !password) {
        console.error('❌ Uso: node check-staff-passwords.js set-password <staff_id> <senha> [username]');
        console.error('   Exemplo: node check-staff-passwords.js set-password 1 senha123 clebinho');
        process.exit(1);
      }
      
      await setStaffPassword(staffId, password, username);
    } else if (command === 'create') {
      const username = args[1];
      const password = args[2];
      const name = args[3];
      const adminId = parseInt(args[4]);
      const email = args[5] || null;
      
      if (!username || !password || !name || !adminId) {
        console.error('❌ Uso: node check-staff-passwords.js create <username> <senha> <nome> <admin_id> [email]');
        process.exit(1);
      }
      
      await createStaffWithPassword(username, password, name, adminId, email);
    } else {
      console.log('📋 Comandos disponíveis:\n');
      console.log('1. Listar todos os staff:');
      console.log('   node check-staff-passwords.js list\n');
      console.log('2. Definir senha de um staff existente:');
      console.log('   node check-staff-passwords.js set-password <staff_id> <senha>\n');
      console.log('3. Criar novo staff com senha:');
      console.log('   node check-staff-passwords.js create <username> <senha> <nome> <admin_id> [email]\n');
      console.log('Exemplos:');
      console.log('   node check-staff-passwords.js list');
      console.log('   node check-staff-passwords.js set-password 1 senha123');
      console.log('   node check-staff-passwords.js create joao senha123 "João Silva" 1 joao@email.com');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

