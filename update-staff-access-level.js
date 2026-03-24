// Script para atualizar accessLevel de staff
import { Pool } from 'pg';
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

async function updateStaffAccessLevel(staffId, accessLevel) {
  try {
    if (!['admin', 'staff'].includes(accessLevel)) {
      console.error('❌ accessLevel deve ser "admin" ou "staff"');
      return false;
    }

    const result = await pool.query(`
      UPDATE staff 
      SET access_level = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, name, access_level;
    `, [accessLevel, staffId]);

    if (result.rows.length === 0) {
      console.error(`❌ Staff com ID ${staffId} não encontrado`);
      return false;
    }

    const staff = result.rows[0];
    console.log(`\n✅ accessLevel atualizado para staff:`);
    console.log(`   ID: ${staff.id}`);
    console.log(`   Username: ${staff.username || 'N/A'}`);
    console.log(`   Nome: ${staff.name}`);
    console.log(`   accessLevel: ${staff.access_level}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar accessLevel:', error);
    throw error;
  }
}

// Main
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    if (command === 'set') {
      const staffId = parseInt(args[1]);
      const accessLevel = args[2];
      
      if (!staffId || !accessLevel) {
        console.error('❌ Uso: node update-staff-access-level.js set <staff_id> <admin|staff>');
        console.error('   Exemplo: node update-staff-access-level.js set 1 staff');
        process.exit(1);
      }
      
      await updateStaffAccessLevel(staffId, accessLevel);
    } else {
      console.log('📋 Comandos disponíveis:\n');
      console.log('Definir accessLevel de um staff:');
      console.log('   node update-staff-access-level.js set <staff_id> <admin|staff>\n');
      console.log('Exemplos:');
      console.log('   node update-staff-access-level.js set 1 staff  # Clebinho só vê agendamentos');
      console.log('   node update-staff-access-level.js set 1 admin  # Clebinho vê tudo');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

