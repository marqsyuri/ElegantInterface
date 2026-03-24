import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:5000";

test.describe("Debug Staff User Creation", () => {
  test("should debug admin authentication and staff user creation", async ({ page, request }) => {
    // Step 1: Login as admin
    await page.goto(`${baseUrl}/`);
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', "admin");
    await page.fill('#password', "admin");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    
    // Wait for navigation or check if already on a page
    try {
      await page.waitForURL(/dashboard|appointments|settings/, { timeout: 10000 });
    } catch (e) {
      // Continue anyway
    }
    
    // Step 2: Check current user info via API (with cookies from page)
    const cookies = await page.context().cookies();
    const userResponse = await request.get(`${baseUrl}/api/user`, {
      headers: {
        Cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ')
      }
    });
    const userData = await userResponse.json();
    console.log('Current user from API:', userData);
    
    // Also check what the page has
    const pageUser = await page.evaluate(() => {
      return (window as any).__USER__ || null;
    });
    console.log('User from page context:', pageUser);
    
    // Step 3: Navigate to Settings
    await page.goto(`${baseUrl}/settings`);
    await page.waitForTimeout(2000);
    
    // Step 4: Navigate to Team tab
    const teamTab = page.getByRole("tab", { name: /team|equipe/i });
    if (await teamTab.isVisible().catch(() => false)) {
      await teamTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 5: Scroll to Staff Users section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Step 6: Try to create staff user and capture the error
    const createButton = page.getByRole("button", { name: /criar usuário staff|create staff user/i });
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill form
      await page.fill('input[name="username"], input[placeholder*="username"], input[placeholder*="nomeusuario"]', "stafftest2");
      await page.fill('input[name="email"], input[type="email"]', "stafftest2@test.com");
      await page.fill('input[name="password"], input[type="password"]', "staff123");
      await page.fill('input[name="firstName"]', "Staff");
      await page.fill('input[name="lastName"]', "Test");
      
      // Intercept the API call
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/staff-users') && response.request().method() === 'POST'
      );
      
      // Submit form
      const submitButton = page.getByRole("button", { name: /criar|create/i });
      await submitButton.click();
      
      // Wait for response
      const response = await responsePromise;
      const responseBody = await response.json();
      
      console.log('Response status:', response.status());
      console.log('Response body:', responseBody);
      
      // Check if error occurred
      if (response.status() === 403) {
        console.error('403 Forbidden error!');
        console.error('Response:', responseBody);
        
        // Check user session
        const sessionCheck = await request.get(`${baseUrl}/api/user`);
        const sessionUser = await sessionCheck.json();
        console.log('Session user:', sessionUser);
        
        // Take screenshot
        await page.screenshot({ path: 'test-results/staff-user-creation-error.png', fullPage: true });
      }
      
      expect(response.ok()).toBeTruthy();
    }
  });
});

