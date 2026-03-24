import { test, expect } from '@playwright/test';

test.describe('Staff Menu Check', () => {
  test('verificar o que /api/user retorna e o que o Sidebar recebe', async ({ page }) => {
    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
    });

    console.log('🔍 1. Navegando para página de login...');
    await page.goto('http://localhost:5000');
    await page.waitForTimeout(2000);

    console.log('🔍 2. Preenchendo credenciais (clebinho/admin)...');
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    
    console.log('🔍 3. Clicando em submit...');
    await page.click('button[type="submit"]');

    console.log('🔍 4. Aguardando navegação...');
    await page.waitForTimeout(5000);

    // Verificar /api/user
    console.log('\n🔍 5. Verificando /api/user...');
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('\n📊 DADOS RETORNADOS POR /api/user:');
      console.log(JSON.stringify(userData, null, 2));
      
      console.log('\n📋 ANÁLISE:');
      console.log(`  - ID: ${userData.id}`);
      console.log(`  - Username: ${userData.username || userData.name}`);
      console.log(`  - userType: ${userData.userType || 'UNDEFINED ❌'}`);
      console.log(`  - accessLevel: ${userData.accessLevel || 'UNDEFINED ❌'}`);
      console.log(`  - role: ${userData.role || 'UNDEFINED'}`);
      
      if (userData.userType === 'staff' && userData.accessLevel === 'staff') {
        console.log('\n✅ /api/user retornou dados CORRETOS de staff!');
      } else {
        console.log('\n❌ PROBLEMA: /api/user NÃO retornou dados corretos de staff!');
        console.log(`   Esperado: userType='staff' e accessLevel='staff'`);
        console.log(`   Recebido: userType='${userData.userType}' e accessLevel='${userData.accessLevel}'`);
      }
    } else {
      console.log(`❌ Erro ao buscar dados: ${userResponse.status()}`);
    }

    // Aguardar um pouco para o Sidebar renderizar
    await page.waitForTimeout(3000);

    // Verificar logs do console do Sidebar
    console.log('\n📋 LOGS DO CONSOLE DO NAVEGADOR (Sidebar):');
    const sidebarLogs = consoleLogs.filter(log => 
      log.includes('[Sidebar]') || 
      log.includes('User data') ||
      log.includes('userType') ||
      log.includes('accessLevel')
    );
    
    if (sidebarLogs.length > 0) {
      sidebarLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (Nenhum log do Sidebar encontrado)');
    }

    // Verificar menus na página
    console.log('\n🔍 6. Verificando menus na página...');
    const menuLinks = await page.locator('nav a[href], aside a[href]').all();
    const menuItems: Array<{text: string, href: string}> = [];
    
    for (const link of menuLinks) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && href) {
        menuItems.push({ text: text.trim(), href });
      }
    }
    
    console.log(`\n📋 ITENS DO MENU ENCONTRADOS (${menuItems.length}):`);
    menuItems.forEach((item, index) => {
      console.log(`  ${index + 1}. "${item.text}" -> ${item.href}`);
    });
    
    const allowedMenus = ['Agendamentos', 'Appointments', 'Agenda'];
    const forbiddenMenus = menuItems.filter(item => 
      !allowedMenus.some(allowed => 
        item.text.toLowerCase().includes(allowed.toLowerCase()) ||
        item.href.includes('appointment')
      )
    );
    
    if (forbiddenMenus.length > 0) {
      console.log('\n❌ MENUS QUE NÃO DEVERIAM ESTAR VISÍVEIS:');
      forbiddenMenus.forEach(item => {
        console.log(`  - "${item.text}" -> ${item.href}`);
      });
    } else {
      console.log('\n✅ Apenas menu de Agendamentos está visível!');
    }

    // Tirar screenshot
    await page.screenshot({ path: 'test-results/staff-menu-check.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em: test-results/staff-menu-check.png');
  });
});

