import { test, expect } from '@playwright/test';

test.describe('Staff Dashboard Debug', () => {
  test('should investigate why dashboard keeps loading', async ({ page }) => {
    // Capturar todos os logs do console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const logText = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(logText);
      console.log('📋 Console:', logText);
    });

    // Capturar erros do console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        consoleErrors.push(errorText);
        console.error('❌ Console Error:', errorText);
      }
    });

    // Capturar requisições de rede
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        networkRequests.push({
          url: url,
          method: request.method(),
          headers: request.headers(),
        });
        console.log('📤 Request:', request.method(), url);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const status = response.status();
        let body = null;
        try {
          body = await response.json().catch(() => null);
        } catch (e) {
          body = await response.text().catch(() => null);
        }
        
        networkResponses.push({
          url: url,
          status: status,
          statusText: response.statusText(),
          body: body,
        });
        
        console.log('📥 Response:', status, url);
        if (status >= 400) {
          console.error('❌ Error Response:', status, url, body);
        }
      }
    });

    // Navegar para a página de login
    console.log('🔍 Navegando para login...');
    await page.goto('http://localhost:5000/staff/');

    // Aguardar página carregar
    await page.waitForLoadState('networkidle');

    // Fazer login como staff
    console.log('🔐 Fazendo login...');
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('**/staff/dashboard**', { timeout: 10000 });
    console.log('✅ Redirecionado para dashboard:', page.url());

    // Aguardar um pouco para a página carregar
    await page.waitForTimeout(2000);

    // Verificar se há estado de loading
    const loadingState = page.locator('#loadingState');
    const errorState = page.locator('#errorState');
    const calendarContainer = page.locator('#calendarContainer');
    const listContainer = page.locator('#listContainer');
    const emptyState = page.locator('#emptyState');

    console.log('🔍 Verificando estados da página...');
    
    const isLoadingVisible = await loadingState.isVisible();
    const isErrorVisible = await errorState.isVisible();
    const isCalendarVisible = await calendarContainer.isVisible();
    const isListVisible = await listContainer.isVisible();
    const isEmptyVisible = await emptyState.isVisible();

    console.log('📊 Estados:');
    console.log('  - Loading:', isLoadingVisible);
    console.log('  - Error:', isErrorVisible);
    console.log('  - Calendar:', isCalendarVisible);
    console.log('  - List:', isListVisible);
    console.log('  - Empty:', isEmptyVisible);

    // Verificar se está em loading infinito
    if (isLoadingVisible) {
      console.log('⚠️ Página está em estado de loading!');
      
      // Aguardar mais tempo para ver se sai do loading
      await page.waitForTimeout(5000);
      
      const stillLoading = await loadingState.isVisible();
      if (stillLoading) {
        console.error('❌ Página ainda está em loading após 5 segundos!');
        
        // Verificar se a requisição da API foi feita
        const appointmentsRequest = networkRequests.find(r => 
          r.url.includes('/api/staff/appointments')
        );
        const appointmentsResponse = networkResponses.find(r => 
          r.url.includes('/api/staff/appointments')
        );

        console.log('📡 Requisição de agendamentos:', appointmentsRequest ? '✅ Feita' : '❌ Não feita');
        if (appointmentsResponse) {
          console.log('📥 Resposta:', appointmentsResponse.status, appointmentsResponse.body);
        } else {
          console.log('❌ Nenhuma resposta recebida para /api/staff/appointments');
        }
      }
    }

    // Verificar se há erro
    if (isErrorVisible) {
      const errorText = await errorState.textContent();
      console.error('❌ Erro na página:', errorText);
    }

    // Verificar requisições da API
    console.log('\n📡 Resumo das requisições de rede:');
    networkRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    console.log('\n📥 Resumo das respostas:');
    networkResponses.forEach(res => {
      console.log(`  ${res.status} ${res.url}`);
      if (res.status >= 400) {
        console.log(`    Erro: ${JSON.stringify(res.body)}`);
      }
    });

    // Verificar se a API /api/staff/appointments foi chamada
    const appointmentsApiCall = networkResponses.find(r => 
      r.url.includes('/api/staff/appointments') && !r.url.includes('/api/staff/appointments/')
    );

    if (!appointmentsApiCall) {
      console.error('❌ API /api/staff/appointments nunca foi chamada!');
    } else {
      console.log('✅ API /api/staff/appointments foi chamada');
      console.log('   Status:', appointmentsApiCall.status);
      console.log('   Body:', JSON.stringify(appointmentsApiCall.body, null, 2));
      
      if (appointmentsApiCall.status === 200) {
        const appointments = appointmentsApiCall.body;
        if (Array.isArray(appointments)) {
          console.log(`   Total de agendamentos: ${appointments.length}`);
        } else {
          console.error('   ❌ Resposta não é um array!');
        }
      }
    }

    // Verificar se há agendamentos sendo exibidos
    const appointmentItems = page.locator('.appointment-item, .list-appointment-card');
    const appointmentCount = await appointmentItems.count();
    console.log(`\n📅 Agendamentos exibidos na página: ${appointmentCount}`);

    // Tirar screenshot para debug
    await page.screenshot({ path: 'test-results/dashboard-debug.png', fullPage: true });
    console.log('📸 Screenshot salvo em test-results/dashboard-debug.png');

    // Verificar logs do console
    console.log('\n📋 Logs do console:');
    consoleLogs.forEach(log => console.log('  ', log));

    if (consoleErrors.length > 0) {
      console.log('\n❌ Erros do console:');
      consoleErrors.forEach(err => console.error('  ', err));
    }

    // Verificar se a página não está mais em loading
    expect(await loadingState.isVisible()).toBeFalsy();
  });

  test('should check API response directly', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('http://localhost:5000/staff/');
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/staff/dashboard**', { timeout: 10000 });

    // Fazer requisição direta à API
    const response = await page.request.get('http://localhost:5000/api/staff/appointments');
    const status = response.status();
    console.log('📡 Status da API:', status);

    if (status === 200) {
      const data = await response.json();
      console.log('✅ Dados recebidos:', JSON.stringify(data, null, 2));
      console.log('📊 Total de agendamentos:', Array.isArray(data) ? data.length : 'N/A');
    } else {
      const error = await response.text();
      console.error('❌ Erro da API:', error);
    }
  });
});







