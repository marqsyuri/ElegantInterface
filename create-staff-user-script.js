import 'dotenv/config';
import { db } from './server/db.ts';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPasswordMD5 } from './server/auth.ts';

async function createStaffUser() {
  try {
    console.log('🔍 Buscando admin...');
    
    // Buscar admin
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    
    if (!admin) {
      throw new Error('Admin não encontrado!');
    }
    
    console.log('✅ Admin encontrado:', admin.username, '(ID:', admin.id, ')');
    
    // Verificar se staff já existe
    const existingStaff = await db
      .select()
      .from(users)
      .where(eq(users.username, 'staff1'))
      .limit(1);
    
    if (existingStaff.length > 0) {
      console.log('⚠️  Staff user já existe:', existingStaff[0]);
      return existingStaff[0];
    }
    
    console.log('👤 Criando staff user...');
    
    // Criar staff user
    const [staff] = await db
      .insert(users)
      .values({
        username: 'staff1',
        email: 'staff1@test.com',
        password: hashPasswordMD5('staff123'),
        firstName: 'Staff',
        lastName: 'Test',
        role: 'staff',
        parentUserId: admin.id,
        isActive: true,
        language: 'pt-BR',
        currency: 'BRL',
      })
      .returning();
    
    console.log('✅ Staff user criado com sucesso!');
    console.log('📋 Dados:', {
      id: staff.id,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      parentUserId: staff.parentUserId,
    });
    console.log('\n📝 Credenciais para login:');
    console.log('   Username: staff1');
    console.log('   Password: staff123');
    
    return staff;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

createStaffUser();

