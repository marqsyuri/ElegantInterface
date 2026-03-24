// Script para testar logout e login como staff
// Execute no console do navegador (F12)

async function testStaffLogin() {
  console.log('🔍 Iniciando teste de logout/login como staff...');
  
  // 1. Fazer logout
  console.log('1️⃣ Fazendo logout...');
  try {
    const logoutRes = await fetch('/api/logout', { 
      method: 'POST', 
      credentials: 'include' 
    });
    const logoutData = await logoutRes.json();
    console.log('✅ Logout realizado:', logoutData);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Verificar se está deslogado
    const userCheck = await fetch('/api/user', { credentials: 'include' });
    if (userCheck.status === 401) {
      console.log('✅ Confirmado: usuário deslogado');
    } else {
      const userData = await userCheck.json();
      console.log('⚠️ Ainda logado:', userData);
    }
    
    // 3. Fazer login como staff
    console.log('2️⃣ Fazendo login como staff...');
    const loginRes = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: 'staff1', password: 'staff123' })
    });
    
    if (!loginRes.ok) {
      const errorData = await loginRes.json();
      console.error('❌ Erro no login:', errorData);
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Login realizado:', {
      id: loginData.id,
      username: loginData.username,
      role: loginData.role,
      parentUserId: loginData.parentUserId,
      parent_user_id: loginData.parent_user_id,
      allKeys: Object.keys(loginData).filter(k => k.includes('parent'))
    });
    
    // 4. Verificar dados do usuário após login
    console.log('3️⃣ Verificando dados do usuário...');
    const userRes = await fetch('/api/user', { credentials: 'include' });
    const userData = await userRes.json();
    console.log('✅ Dados do usuário:', {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      parentUserId: userData.parentUserId,
      parent_user_id: userData.parent_user_id,
      allKeys: Object.keys(userData).filter(k => k.includes('parent'))
    });
    
    // 5. Recarregar página
    console.log('4️⃣ Recarregando página...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testStaffLogin();

