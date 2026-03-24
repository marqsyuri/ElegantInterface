import { test, expect } from '@playwright/test';

test.describe('Staff Menu Debug Final', () => {
  test('verificar o que está acontecendo com clebinho', async ({ page }) => {
    // Capturar todos os logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
    });

    // Capturar requisições de rede
    const networkRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/user')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capturar respostas de rede
    const networkResponses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/user')) {
        try {
          const body = await response.json();
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            body: body,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            body: 'Não é JSON',
            timestamp: new Date().toISOString(),
          });
        }
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
    await page.waitForTimeout(8000); // Aguardar mais tempo

    const currentUrl = page.url();
    console.log(`📍 URL atual: ${currentUrl}`);

    // Verificar /api/user múltiplas vezes
    console.log('\n🔍 5. Verificando /api/user (primeira chamada)...');
    const userResponse1 = await page.request.get('http://localhost:5000/api/user');
    
    if (userResponse1.ok()) {
      const userData1 = await userResponse1.json();
      console.log('\n📊 DADOS RETORNADOS POR /api/user (1ª chamada):');
      console.log(JSON.stringify(userData1, null, 2));
    }

    await page.waitForTimeout(2000);

    console.log('\n🔍 6. Verificando /api/user (segunda chamada)...');
    const userResponse2 = await page.request.get('http://localhost:5000/api/user');
    
    if (userResponse2.ok()) {
      const userData2 = await userResponse2.json();
      console.log('\n📊 DADOS RETORNADOS POR /api/user (2ª chamada):');
      console.log(JSON.stringify(userData2, null, 2));
    }

    // Aguardar um pouco mais para o Sidebar renderizar
    await page.waitForTimeout(3000);

    // Verificar logs do console do Sidebar
    console.log('\n📋 LOGS DO CONSOLE DO NAVEGADOR:');
    const sidebarLogs = consoleLogs.filter(log => 
      log.includes('[Sidebar]') || 
      log.includes('User data') ||
      log.includes('[App Router]')
    );
    
    if (sidebarLogs.length > 0) {
      sidebarLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (Nenhum log relevante encontrado)');
    }

    // Verificar menus na página
    console.log('\n🔍 7. Verificando menus na página...');
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

    // Mostrar requisições de rede
    console.log('\n🌐 REQUISIÇÕES DE REDE PARA /api/user:');
    networkResponses.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method || 'GET'} ${req.url} -> Status: ${req.status}`);
      if (req.body && typeof req.body === 'object') {
        console.log(`     userType: ${req.body.userType || 'UNDEFINED'}`);
        console.log(`     accessLevel: ${req.body.accessLevel || 'UNDEFINED'}`);
        console.log(`     username: ${req.body.username || req.body.name || 'UNDEFINED'}`);
      }
    });

    // Tirar screenshot
    await page.screenshot({ path: 'test-results/staff-menu-debug-final.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em: test-results/staff-menu-debug-final.png');
  });
});

