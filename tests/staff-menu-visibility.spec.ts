import { test, expect } from '@playwright/test';

test.describe('Staff Menu Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
  });

  test('staff should only see appointments menu', async ({ page }) => {
    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Sidebar]') || text.includes('User data')) {
        consoleLogs.push(text);
      }
    });

    // Login as clebinho
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Aguardar navegação
    await page.waitForTimeout(3000);

    // Verificar dados do usuário
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('👤 User data from API:', JSON.stringify(userData, null, 2));
      
      expect(userData.userType).toBe('staff');
      expect(userData.accessLevel).toBe('staff');
    }

    // Verificar logs do console
    console.log('📋 Console logs:', consoleLogs);

    // Capturar todos os itens do menu visíveis
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    
    if (await sidebar.isVisible()) {
      // Capturar todos os links e botões do menu
      const menuLinks = await sidebar.locator('a[href]').all();
      const menuButtons = await sidebar.locator('button').all();
      
      console.log(`📋 Found ${menuLinks.length} menu links and ${menuButtons.length} buttons`);
      
      const menuItems: string[] = [];
      
      for (const link of menuLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text && href) {
          menuItems.push(`${text.trim()} -> ${href}`);
        }
      }
      
      console.log('📋 Menu items found:', menuItems);
      
      // Verificar se há apenas "Agendamentos" ou "Appointments"
      const appointmentsOnly = menuItems.filter(item => 
        item.toLowerCase().includes('agenda') || 
        item.toLowerCase().includes('appointment')
      );
      
      // Verificar se há menus admin (não deveria ter)
      const adminMenus = menuItems.filter(item => 
        item.toLowerCase().includes('client') ||
        item.toLowerCase().includes('procedur') ||
        item.toLowerCase().includes('financial') ||
        item.toLowerCase().includes('dashboard') ||
        item.toLowerCase().includes('settings') ||
        item.toLowerCase().includes('product') ||
        item.toLowerCase().includes('staff')
      );
      
      console.log('✅ Appointments menus:', appointmentsOnly);
      console.log('❌ Admin menus found:', adminMenus);
      
      // Deve ter pelo menos o menu de agendamentos
      expect(appointmentsOnly.length).toBeGreaterThan(0);
      
      // NÃO deve ter menus admin
      expect(adminMenus.length).toBe(0);
    } else {
      console.log('⚠️ Sidebar not visible');
    }

    // Verificar URL atual
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Staff deve estar em /appointments ou redirecionado para lá
    expect(currentUrl).toMatch(/\/appointments/);
  });

  test('admin should see all menus', async ({ page }) => {
    // Login as admin
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Verificar dados do usuário
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('👤 Admin user data:', JSON.stringify(userData, null, 2));
      
      expect(userData.userType).toBe('admin');
      expect(userData.accessLevel).toBe('admin');
    }

    // Admin deve ver múltiplos menus
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    if (await sidebar.isVisible()) {
      const menuLinks = await sidebar.locator('a[href]').all();
      console.log(`📋 Admin has ${menuLinks.length} menu items`);
      
      // Admin deve ter mais de 2 menus
      expect(menuLinks.length).toBeGreaterThan(2);
    }
  });
});

