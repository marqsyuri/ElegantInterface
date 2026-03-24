import { test, expect } from '@playwright/test';

test.describe('Staff Menu - Teste Final', () => {
  test('clebinho deve ver APENAS menu Agendamentos', async ({ page }) => {
    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Sidebar]') || text.includes('User data') || text.includes('userType') || text.includes('accessLevel')) {
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

    console.log('🔍 5. Verificando dados do usuário via API...');
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('\n📊 DADOS DO USUÁRIO VIA API:');
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

    console.log('\n🔍 6. Analisando elementos do menu na página...');
    
    // Aguardar sidebar aparecer
    await page.waitForTimeout(2000);
    
    // Capturar todos os links do menu
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
    
    // Verificar se há menus que não deveriam estar visíveis
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
      console.log('\n❌ FALHA: Staff está vendo menus que não deveria ver!');
    } else {
      console.log('\n✅ SUCESSO: Apenas menu de Agendamentos está visível!');
    }

    // Mostrar logs do console do navegador
    console.log('\n📋 LOGS DO CONSOLE DO NAVEGADOR:');
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('[Sidebar]') || 
      log.includes('User data')
    );
    
    if (relevantLogs.length > 0) {
      relevantLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('  (Nenhum log relevante encontrado)');
    }

    // Verificar se há grupos de navegação visíveis
    console.log('\n🔍 7. Verificando grupos de navegação...');
    const navGroups = await page.locator('nav, aside').locator('text=/Registro|Cliente|Procedimento|Produto|Financeiro|Configuração|Dashboard/i').all();
    if (navGroups.length > 0) {
      console.log(`❌ Encontrados ${navGroups.length} grupos de navegação que não deveriam estar visíveis!`);
    } else {
      console.log('✅ Nenhum grupo de navegação encontrado (correto para staff)');
    }

    // Tirar screenshot
    await page.screenshot({ path: 'test-results/staff-menu-final-test.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em: test-results/staff-menu-final-test.png');

    // Assertions finais
    expect(forbiddenMenus.length).toBe(0);
  });
});

