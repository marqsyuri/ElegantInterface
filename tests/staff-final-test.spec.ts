import { test, expect } from '@playwright/test';

test.describe('Staff Final Test - Menu Visibility', () => {
  test('clebinho deve ver APENAS menu Agendamentos', async ({ page }) => {
    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Sidebar]') || text.includes('User data') || text.includes('Router')) {
        consoleLogs.push(`[${msg.type()}] ${text}`);
      }
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

    const currentUrl = page.url();
    console.log(`📍 URL atual: ${currentUrl}`);
    
    // Verificar se foi redirecionado para /appointments
    expect(currentUrl).toMatch(/\/appointments/);

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
      
      // Verificar se retornou dados corretos
      expect(userData.userType).toBe('staff');
      expect(userData.accessLevel).toBe('staff');
    } else {
      console.log(`❌ Erro ao buscar dados: ${userResponse.status()}`);
    }

    // Aguardar um pouco para o Sidebar renderizar
    await page.waitForTimeout(3000);

    // Verificar logs do console do Sidebar
    console.log('\n📋 LOGS DO CONSOLE DO NAVEGADOR (Sidebar):');
    const sidebarLogs = consoleLogs.filter(log => 
      log.includes('[Sidebar]') || 
      log.includes('User data')
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

    // Assertions finais
    expect(forbiddenMenus.length).toBe(0);
    expect(menuItems.length).toBeGreaterThan(0);
    expect(menuItems.some(item => item.href.includes('appointment'))).toBe(true);

    // Tirar screenshot
    await page.screenshot({ path: 'test-results/staff-final-test.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em: test-results/staff-final-test.png');
  });
});

