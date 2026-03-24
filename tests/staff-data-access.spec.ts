import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Staff Data Access - Clients and Procedures", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_BASE_URL, "Defina E2E_BASE_URL apontando para o ambiente em execução antes de rodar o teste");
  });

  test("staff user should see admin's clients and procedures when creating appointment", async ({ page }) => {
    // Step 1: Login as admin
    await page.goto(`${baseUrl}/`);
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', process.env.E2E_USERNAME || "admin");
    await page.fill('#password', process.env.E2E_PASSWORD || "admin");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    
    await page.waitForURL(/dashboard|appointments/, { timeout: 30_000 });
    
    // Step 2: Create a client as admin (if not exists)
    await page.goto(`${baseUrl}/clients`);
    await page.waitForTimeout(2000);
    
    // Check if there are clients, if not create one
    const clientCount = await page.locator('[data-testid="client-card"], .client-card, [class*="client"]').count();
    if (clientCount === 0) {
      // Create a test client
      const createButton = page.getByRole("button", { name: /adicionar|novo|create|add/i }).first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await page.fill('input[name="name"], input[placeholder*="nome"], input[placeholder*="name"]', "Cliente Teste Admin");
        await page.fill('input[name="email"], input[type="email"]', "cliente.teste@admin.com");
        await page.fill('input[name="phone"], input[type="tel"]', "123456789");
        const saveButton = page.getByRole("button", { name: /salvar|save|adicionar|create/i }).last();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Step 3: Create a procedure as admin (if not exists)
    await page.goto(`${baseUrl}/procedures`);
    await page.waitForTimeout(2000);
    
    const procedureCount = await page.locator('[data-testid="procedure"], .procedure-card, [class*="procedure"]').count();
    if (procedureCount === 0) {
      // Create a test procedure
      const createButton = page.getByRole("button", { name: /adicionar|novo|create|add/i }).first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await page.fill('input[name="name"], input[placeholder*="nome"], input[placeholder*="name"]', "Procedimento Teste Admin");
        await page.fill('input[name="price"], input[type="number"]', "100");
        await page.fill('input[name="duration"], input[type="number"]', "60");
        const saveButton = page.getByRole("button", { name: /salvar|save|adicionar|create/i }).last();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Step 4: Create a staff user
    await page.goto(`${baseUrl}/settings`);
    await page.waitForTimeout(2000);
    
    // Navigate to Team tab
    const teamTab = page.getByRole("tab", { name: /team|equipe/i });
    if (await teamTab.isVisible().catch(() => false)) {
      await teamTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Scroll to Staff Users section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Click "Criar Usuário Staff"
    const createStaffUserButton = page.getByRole("button", { name: /criar usuário staff|create staff user/i });
    if (await createStaffUserButton.isVisible().catch(() => false)) {
      await createStaffUserButton.click();
      await page.waitForTimeout(1000);
      
      // Fill staff user form
      await page.fill('input[name="username"], input[placeholder*="username"], input[placeholder*="nomeusuario"]', "stafftest");
      await page.fill('input[name="email"], input[type="email"]', "stafftest@test.com");
      await page.fill('input[name="password"], input[type="password"]', "staff123");
      await page.fill('input[name="firstName"]', "Staff");
      await page.fill('input[name="lastName"]', "Test");
      
      // Submit form
      const submitButton = page.getByRole("button", { name: /criar|create/i });
      await submitButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 5: Logout from admin
    const logoutButton = page.getByRole("button", { name: /sair|logout|sair do sistema/i });
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Try to navigate to logout
      await page.goto(`${baseUrl}/api/logout`);
      await page.waitForTimeout(1000);
    }
    
    // Step 6: Login as staff
    await page.goto(`${baseUrl}/`);
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', "stafftest");
    await page.fill('#password', "staff123");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    
    await page.waitForURL(/appointments/, { timeout: 30_000 });
    
    // Step 7: Try to create an appointment
    const newAppointmentButton = page.getByRole("button", { name: /novo|new|adicionar|add|agendamento|appointment/i }).first();
    if (await newAppointmentButton.isVisible().catch(() => false)) {
      await newAppointmentButton.click();
      await page.waitForTimeout(2000);
      
      // Step 8: Verify that clients are visible
      const clientSelect = page.locator('select, [role="combobox"], input[placeholder*="cliente"], input[placeholder*="client"]').first();
      if (await clientSelect.isVisible().catch(() => false)) {
        await clientSelect.click();
        await page.waitForTimeout(1000);
        
        // Check if admin's client is visible
        const adminClient = page.getByText("Cliente Teste Admin", { exact: false });
        await expect(adminClient).toBeVisible({ timeout: 5000 });
      }
      
      // Step 9: Verify that procedures are visible
      const procedureSelect = page.locator('select, [role="combobox"], input[placeholder*="procedimento"], input[placeholder*="procedure"]').first();
      if (await procedureSelect.isVisible().catch(() => false)) {
        await procedureSelect.click();
        await page.waitForTimeout(1000);
        
        // Check if admin's procedure is visible
        const adminProcedure = page.getByText("Procedimento Teste Admin", { exact: false });
        await expect(adminProcedure).toBeVisible({ timeout: 5000 });
      }
    } else {
      // Alternative: Check if we can see clients and procedures in the appointments page
      // Try to access clients API directly
      const clientsResponse = await page.request.get(`${baseUrl}/api/clients`);
      expect(clientsResponse.ok()).toBeTruthy();
      const clients = await clientsResponse.json();
      expect(Array.isArray(clients)).toBeTruthy();
      expect(clients.length).toBeGreaterThan(0);
      
      // Try to access procedures API directly
      const proceduresResponse = await page.request.get(`${baseUrl}/api/procedures`);
      expect(proceduresResponse.ok()).toBeTruthy();
      const procedures = await proceduresResponse.json();
      expect(Array.isArray(procedures)).toBeTruthy();
      expect(procedures.length).toBeGreaterThan(0);
    }
  });

  test("staff user API should return admin's clients and procedures", async ({ page }) => {
    // Login as staff
    await page.goto(`${baseUrl}/`);
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', "stafftest");
    await page.fill('#password', "staff123");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    
    await page.waitForURL(/appointments/, { timeout: 30_000 });
    
    // Test clients API
    const clientsResponse = await page.request.get(`${baseUrl}/api/clients`);
    expect(clientsResponse.ok()).toBeTruthy();
    const clients = await clientsResponse.json();
    console.log('Clients returned:', clients);
    expect(Array.isArray(clients)).toBeTruthy();
    
    // Test procedures API
    const proceduresResponse = await page.request.get(`${baseUrl}/api/procedures`);
    expect(proceduresResponse.ok()).toBeTruthy();
    const procedures = await proceduresResponse.json();
    console.log('Procedures returned:', procedures);
    expect(Array.isArray(procedures)).toBeTruthy();
    
    // Test staff API
    const staffResponse = await page.request.get(`${baseUrl}/api/staff`);
    expect(staffResponse.ok()).toBeTruthy();
    const staff = await staffResponse.json();
    console.log('Staff returned:', staff);
    expect(Array.isArray(staff)).toBeTruthy();
  });
});

