import 'dotenv/config';
import fetch from 'node-fetch';

// Primeiro, fazer login como admin para obter a sessão
async function createStaffUser() {
  try {
    console.log('🔐 Fazendo login como admin...');
    
    // Login como admin
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    // Obter cookies da sessão
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login realizado com sucesso');

    // Criar staff user
    console.log('👤 Criando staff user...');
    const staffData = {
      username: 'staff1',
      email: 'staff1@test.com',
      password: 'staff123',
      firstName: 'Staff',
      lastName: 'Test'
    };

    const createResponse = await fetch('http://localhost:5000/api/staff-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify(staffData),
      credentials: 'include'
    });

    const result = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ Staff user criado com sucesso!');
      console.log('📋 Dados do staff:', result);
      console.log('\n📝 Credenciais para login:');
      console.log('   Username: staff1');
      console.log('   Password: staff123');
    } else {
      console.error('❌ Erro ao criar staff user:', result);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createStaffUser();

