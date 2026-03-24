// Script para testar criação de staff user via Playwright
// Execute este código no console do navegador (F12) quando estiver logado como admin

async function createStaffUser() {
  try {
    console.log('🔐 Criando staff user...');
    
    const response = await fetch('/api/staff-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: 'staff1',
        email: 'staff1@test.com',
        password: 'staff123',
        firstName: 'Staff',
        lastName: 'Test'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Staff criado com sucesso!');
      console.log('📋 Dados:', data);
      console.log('\n📝 Credenciais para login:');
      console.log('   Username: staff1');
      console.log('   Password: staff123');
      return data;
    } else {
      console.error('❌ Erro ao criar staff:', data);
      throw new Error(data.message || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

// Executar
createStaffUser();

