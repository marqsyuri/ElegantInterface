import 'dotenv/config';
import { db } from './server/db.ts';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function checkStaffUser() {
  try {
    const [staffUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'staff1'))
      .limit(1);
    
    if (!staffUser) {
      console.log('❌ Staff user não encontrado!');
      process.exit(1);
    }
    
    console.log('✅ Staff user encontrado:');
    console.log('   ID:', staffUser.id);
    console.log('   Username:', staffUser.username);
    console.log('   Role:', staffUser.role);
    console.log('   parentUserId:', staffUser.parentUserId);
    console.log('   parentUserId type:', typeof staffUser.parentUserId);
    console.log('   parentUserId === null:', staffUser.parentUserId === null);
    console.log('   parentUserId === undefined:', staffUser.parentUserId === undefined);
    
    // Verificar se o campo existe no objeto
    console.log('\n📋 Todos os campos do user:');
    console.log(Object.keys(staffUser).filter(k => k.includes('parent') || k.includes('Parent')));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkStaffUser();

