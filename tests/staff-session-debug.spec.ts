import { test, expect } from '@playwright/test';

test.describe('Staff Session Debug', () => {
  test('verificar sessão após login com clebinho', async ({ page, context }) => {
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

    // Verificar sessão via endpoint de debug
    console.log('\n🔍 5. Verificando sessão via /api/debug-session...');
    const debugResponse = await page.request.get('http://localhost:5000/api/debug-session');
    
    if (debugResponse.ok()) {
      const debugData = await debugResponse.json();
      console.log('\n📊 DADOS DA SESSÃO:');
      console.log(JSON.stringify(debugData, null, 2));
      
      console.log('\n📋 ANÁLISE DA SESSÃO:');
      console.log(`  - req.session.passport:`, debugData.session?.passport);
      console.log(`  - req.user.userType: ${debugData.user?.userType || 'UNDEFINED ❌'}`);
      console.log(`  - req.user.accessLevel: ${debugData.user?.accessLevel || 'UNDEFINED ❌'}`);
      console.log(`  - req.user.username: ${debugData.user?.username || debugData.user?.name || 'UNDEFINED'}`);
      
      if (debugData.session?.passport) {
        console.log('\n🔍 SESSION.PASSPORT:');
        console.log(`  Tipo: ${typeof debugData.session.passport.user}`);
        console.log(`  Valor: ${JSON.stringify(debugData.session.passport.user, null, 2)}`);
        
        if (typeof debugData.session.passport.user === 'object' && debugData.session.passport.user.userType === 'staff') {
          console.log('✅ Sessão está serializada corretamente como staff!');
        } else if (typeof debugData.session.passport.user === 'number') {
          console.log('❌ PROBLEMA: Sessão está serializada como número (ID do admin)!');
          console.log(`   Isso significa que serializeUser salvou apenas o ID em vez do objeto staff.`);
        } else {
          console.log('❌ PROBLEMA: Sessão não está no formato esperado!');
        }
      }
    } else {
      console.log(`❌ Erro ao buscar sessão: ${debugResponse.status()}`);
    }

    // Verificar /api/user
    console.log('\n🔍 6. Verificando /api/user...');
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('\n📊 DADOS DO USUÁRIO VIA /api/user:');
      console.log(JSON.stringify(userData, null, 2));
      
      console.log('\n📋 ANÁLISE:');
      console.log(`  - ID: ${userData.id}`);
      console.log(`  - Username: ${userData.username || userData.name}`);
      console.log(`  - userType: ${userData.userType || 'UNDEFINED ❌'}`);
      console.log(`  - accessLevel: ${userData.accessLevel || 'UNDEFINED ❌'}`);
      console.log(`  - role: ${userData.role || 'UNDEFINED'}`);
      
      if (userData.userType === 'staff' && userData.accessLevel === 'staff') {
        console.log('\n✅ Usuário identificado corretamente como STAFF!');
      } else {
        console.log('\n❌ PROBLEMA: Usuário NÃO é staff ou accessLevel incorreto!');
        console.log(`   Esperado: userType='staff' e accessLevel='staff'`);
        console.log(`   Recebido: userType='${userData.userType}' e accessLevel='${userData.accessLevel}'`);
      }
    } else {
      console.log(`❌ Erro ao buscar dados: ${userResponse.status()}`);
    }

    // Verificar menus na página
    console.log('\n🔍 7. Verificando menus na página...');
    await page.waitForTimeout(2000);
    
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

    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Sidebar]') || text.includes('User data')) {
        consoleLogs.push(`[${msg.type()}] ${text}`);
      }
    });

    await page.waitForTimeout(2000);

    console.log('\n📋 LOGS DO CONSOLE DO NAVEGADOR:');
    if (consoleLogs.length > 0) {
      consoleLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (Nenhum log relevante encontrado)');
    }

    // Tirar screenshot
    await page.screenshot({ path: 'test-results/staff-session-debug.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em: test-results/staff-session-debug.png');
  });
});

