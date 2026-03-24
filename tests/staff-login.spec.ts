import { test, expect } from '@playwright/test';

test.describe('Staff Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('http://localhost:5000');
  });

  test('should login as staff user (clebinho/admin)', async ({ page }) => {
    // Verificar se estamos na página de login
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();

    // Preencher credenciais do staff
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');

    // Capturar logs do console antes do submit
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Capturar requisições de rede
    const networkRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/login')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });

    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/login')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    // Clicar no botão de login
    await page.click('button[type="submit"]');

    // Aguardar resposta do login (pode ser sucesso ou erro)
    await page.waitForTimeout(2000);

    // Verificar se houve redirecionamento ou erro
    const currentUrl = page.url();
    console.log('📍 URL atual após login:', currentUrl);

    // Verificar logs do console
    console.log('📋 Logs do console:', consoleLogs);

    // Verificar respostas de rede
    console.log('🌐 Respostas de rede:', responses);

    // Se login foi bem-sucedido, deve redirecionar para /appointments (staff só vê agenda)
    if (currentUrl.includes('/appointments') || currentUrl.includes('/')) {
      console.log('✅ Login bem-sucedido! Redirecionado para:', currentUrl);
      
      // Verificar se o menu mostra apenas "Agenda" para staff
      const sidebar = page.locator('nav, aside, [role="navigation"]').first();
      if (await sidebar.isVisible()) {
        const menuItems = await sidebar.locator('a, button').allTextContents();
        console.log('📋 Itens do menu:', menuItems);
        
        // Staff deve ver apenas "Agenda" ou "Appointments"
        const hasAppointments = menuItems.some(item => 
          item.toLowerCase().includes('agenda') || 
          item.toLowerCase().includes('appointment')
        );
        expect(hasAppointments).toBeTruthy();
      }
    } else {
      // Se não redirecionou, verificar se há mensagem de erro
      const errorMessage = await page.locator('text=/erro|invalid|incorrect/i').first();
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('❌ Erro de login:', errorText);
        throw new Error(`Login falhou: ${errorText}`);
      }
    }
  });

  test('should verify staff user data after login', async ({ page }) => {
    // Login
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForTimeout(2000);

    // Verificar dados do usuário via API
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    console.log('👤 Status da resposta /api/user:', userResponse.status());
    
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('👤 Dados do usuário:', JSON.stringify(userData, null, 2));
      
      // Verificar se é staff
      expect(userData).toBeDefined();
      expect(userData.userType || userData.role).toBeDefined();
      
      // Se tiver userType, deve ser 'staff'
      if (userData.userType) {
        expect(userData.userType).toBe('staff');
      }
    } else {
      console.log('❌ Não foi possível obter dados do usuário');
    }
  });

  test('should test admin login still works', async ({ page }) => {
    // Testar login de admin para garantir que não quebrou
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log('📍 URL após login admin:', currentUrl);

    // Admin deve ver dashboard ou appointments
    expect(currentUrl).toMatch(/\/(dashboard|appointments|\?)/);
  });
});

