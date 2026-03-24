import 'dotenv/config';
import { db } from './server/db.ts';
import { users, staff, clients, appointments, appointmentProcedures, procedures } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function createTestAppointment() {
  try {
    console.log('🔍 Buscando staff user...');
    
    // Buscar staff user
    const [staffUser] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.username, 'staff1'),
        eq(users.role, 'staff')
      ))
      .limit(1);
    
    if (!staffUser) {
      throw new Error('Staff user não encontrado! Execute create-staff-user-script.js primeiro.');
    }
    
    console.log('✅ Staff user encontrado:', staffUser.username, '(ID:', staffUser.id, ')');
    
    // Buscar staff record vinculado ao staff user
    let staffRecord = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, staffUser.id))
      .limit(1)
      .then(records => records[0]);
    
    if (!staffRecord) {
      console.log('⚠️  Staff record não encontrado. Criando...');
      // Criar staff record
      const [newStaff] = await db
        .insert(staff)
        .values({
          userId: staffUser.id,
          name: `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim() || 'Staff Test',
          email: staffUser.email,
          role: 'therapist',
          isActive: true,
        })
        .returning();
      console.log('✅ Staff record criado:', newStaff.id);
      staffRecord = newStaff;
    } else {
      console.log('✅ Staff record encontrado:', staffRecord.id);
    }
    
    // Buscar admin para pegar userId
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, staffUser.parentUserId || 0))
      .limit(1);
    
    if (!admin) {
      throw new Error('Admin não encontrado!');
    }
    
    console.log('✅ Admin encontrado:', admin.username, '(ID:', admin.id, ')');
    
    // Buscar ou criar um cliente de teste
    let testClient = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, admin.id))
      .limit(1)
      .then(records => records[0]);
    
    if (!testClient) {
      console.log('⚠️  Cliente não encontrado. Criando cliente de teste...');
      const [newClient] = await db
        .insert(clients)
        .values({
          userId: admin.id,
          name: 'Cliente Teste Staff',
          email: 'cliente.teste@test.com',
          phone: '123456789',
          isActive: true,
        })
        .returning();
      console.log('✅ Cliente criado:', newClient.id);
      testClient = newClient;
    } else {
      console.log('✅ Cliente encontrado:', testClient.id);
    }
    
    // Buscar um procedimento ou criar um de teste
    let procedure = await db
      .select()
      .from(procedures)
      .where(eq(procedures.userId, admin.id))
      .limit(1)
      .then(records => records[0]);
    
    if (!procedure) {
      console.log('⚠️  Procedimento não encontrado. Criando procedimento de teste...');
      const [newProcedure] = await db
        .insert(procedures)
        .values({
          userId: admin.id,
          name: 'Corte de Cabelo',
          category: 'Cabelo',
          duration: 60,
          price: '50.00',
          isActive: true,
        })
        .returning();
      console.log('✅ Procedimento criado:', newProcedure.id);
      procedure = newProcedure;
    }
    
    console.log('✅ Procedimento encontrado:', procedure.name, '(ID:', procedure.id, ')');
    
    // Criar data de amanhã para o agendamento
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 14:00
    
    console.log('📅 Criando agendamento para:', tomorrow.toISOString());
    
    // Criar agendamento
    const [appointment] = await db
      .insert(appointments)
      .values({
        userId: admin.id,
        clientId: testClient.id,
        appointmentDate: tomorrow,
        status: 'scheduled',
        staffId: staffRecord.id, // Vincular ao staff
        totalPrice: procedure.price || '0',
        totalDuration: procedure.duration || 60,
        procedureCount: 1,
      })
      .returning();
    
    console.log('✅ Agendamento criado:', appointment.id);
    
    // Vincular procedimento ao agendamento
    await db
      .insert(appointmentProcedures)
      .values({
        appointmentId: appointment.id,
        procedureId: procedure.id,
        staffId: staffRecord.id, // IMPORTANTE: vincular ao staff
        procedureName: procedure.name,
        procedureCategory: procedure.category,
        price: procedure.price || '0',
        duration: procedure.duration || 60,
        order: 0,
      });
    
    console.log('✅ Procedimento vinculado ao agendamento');
    console.log('\n📋 Resumo:');
    console.log('   Staff User ID:', staffUser.id);
    console.log('   Staff Record ID:', staffRecord.id);
    console.log('   Appointment ID:', appointment.id);
    console.log('   Appointment Date:', tomorrow.toISOString());
    console.log('\n✅ Agendamento de teste criado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

createTestAppointment();

