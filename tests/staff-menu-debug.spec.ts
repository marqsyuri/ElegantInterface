import { test, expect } from '@playwright/test';

test.describe('Staff Menu Debug - Análise Completa', () => {
  test('debug staff login and menu visibility', async ({ page }) => {
    // Capturar todos os logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[CONSOLE] ${msg.type()}: ${text}`);
    });

    // Capturar requisições de rede
    const networkRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });

    // Capturar respostas de rede
    const networkResponses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        try {
          const body = await response.json();
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            body: body,
          });
        } catch (e) {
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            body: 'Não é JSON',
          });
        }
      }
    });

    console.log('🔍 Navegando para página de login...');
    await page.goto('http://localhost:5000');
    await page.waitForTimeout(2000);

    // Verificar se está na página de login
    const loginForm = page.locator('form, [id="username"], input[type="text"]').first();
    await loginForm.waitFor({ timeout: 5000 });

    console.log('📝 Preenchendo credenciais do staff (clebinho)...');
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    
    console.log('🔐 Clicando em submit...');
    await page.click('button[type="submit"]');

    // Aguardar navegação e carregamento
    console.log('⏳ Aguardando navegação...');
    await page.waitForTimeout(5000);

    // Verificar URL atual
    const currentUrl = page.url();
    console.log('📍 URL atual:', currentUrl);

    // Fazer requisição direta para /api/user
    console.log('🔍 Fazendo requisição para /api/user...');
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('👤 Dados do usuário retornados:');
      console.log(JSON.stringify(userData, null, 2));
      
      console.log('\n📊 Análise dos dados:');
      console.log(`  - ID: ${userData.id}`);
      console.log(`  - Username: ${userData.username || userData.name}`);
      console.log(`  - userType: ${userData.userType || 'UNDEFINED'}`);
      console.log(`  - accessLevel: ${userData.accessLevel || 'UNDEFINED'}`);
      console.log(`  - role: ${userData.role || 'UNDEFINED'}`);
      
      // Verificar se é staff
      if (userData.userType === 'staff' && userData.accessLevel === 'staff') {
        console.log('✅ Usuário identificado como STAFF com accessLevel staff');
      } else {
        console.log('❌ Usuário NÃO é staff ou accessLevel incorreto!');
        console.log(`   Esperado: userType='staff' e accessLevel='staff'`);
        console.log(`   Recebido: userType='${userData.userType}' e accessLevel='${userData.accessLevel}'`);
      }
    } else {
      console.log('❌ Erro ao buscar dados do usuário:', userResponse.status());
    }

    // Capturar todos os elementos do menu
    console.log('\n🔍 Analisando elementos do menu...');
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    
    if (await sidebar.isVisible()) {
      const menuLinks = await sidebar.locator('a[href]').all();
      const menuTexts: string[] = [];
      
      for (const link of menuLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text && href) {
          menuTexts.push(`${text.trim()} -> ${href}`);
        }
      }
      
      console.log(`\n📋 Itens do menu encontrados (${menuTexts.length}):`);
      menuTexts.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
      });
      
      // Verificar se há menus que não deveriam estar visíveis
      const forbiddenMenus = menuTexts.filter(item => 
        !item.toLowerCase().includes('agenda') && 
        !item.toLowerCase().includes('appointment')
      );
      
      if (forbiddenMenus.length > 0) {
        console.log('\n❌ MENUS QUE NÃO DEVERIAM ESTAR VISÍVEIS:');
        forbiddenMenus.forEach(item => {
          console.log(`  - ${item}`);
        });
      } else {
        console.log('\n✅ Apenas menu de Agendamentos está visível!');
      }
    } else {
      console.log('⚠️ Sidebar não encontrada ou não visível');
    }

    // Mostrar logs do console
    console.log('\n📋 Logs do console do navegador:');
    const sidebarLogs = consoleLogs.filter(log => 
      log.includes('[Sidebar]') || 
      log.includes('User data') || 
      log.includes('userType') || 
      log.includes('accessLevel')
    );
    
    if (sidebarLogs.length > 0) {
      sidebarLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (Nenhum log relevante encontrado)');
    }

    // Mostrar requisições de rede
    console.log('\n🌐 Requisições de rede para /api/:');
    networkResponses.forEach(req => {
      if (req.url.includes('/api/user')) {
        console.log(`  ${req.method || 'GET'} ${req.url} -> Status: ${req.status}`);
        if (req.body && typeof req.body === 'object') {
          console.log(`    userType: ${req.body.userType || 'UNDEFINED'}`);
          console.log(`    accessLevel: ${req.body.accessLevel || 'UNDEFINED'}`);
        }
      }
    });

    // Aguardar um pouco mais para garantir que tudo carregou
    await page.waitForTimeout(2000);

    // Tirar screenshot para análise visual
    await page.screenshot({ path: 'test-results/staff-menu-debug.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em: test-results/staff-menu-debug.png');
  });
});

