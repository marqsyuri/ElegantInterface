import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:5000";

test.describe("Full Auth Flow Debug", () => {
  test("should debug complete authentication flow", async ({ page, request }) => {
    // Step 1: Clear any existing session
    await page.goto(`${baseUrl}/`);
    await page.context().clearCookies();
    
    // Step 2: Login as admin
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', "admin");
    await page.fill('#password', "admin");
    
    // Intercept login request
    const loginResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/login') && response.request().method() === 'POST'
    );
    
    await page.getByRole("button", { name: /entrar|login/i }).click();
    
    const loginResponse = await loginResponsePromise;
    const loginData = await loginResponse.json();
    console.log('\n=== LOGIN RESPONSE ===');
    console.log('Status:', loginResponse.status());
    console.log('User data:', JSON.stringify(loginData, null, 2));
    
    // Wait for navigation
    try {
      await page.waitForURL(/dashboard|appointments|settings/, { timeout: 10000 });
    } catch (e) {
      // Continue anyway
    }
    
    // Step 3: Get cookies after login
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    console.log('\n=== COOKIES ===');
    console.log('Cookies:', cookieHeader.substring(0, 100) + '...');
    
    // Step 4: Check current user via API
    const userResponse = await request.get(`${baseUrl}/api/user`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    
    const userData = await userResponse.json();
    console.log('\n=== /api/user RESPONSE ===');
    console.log('Status:', userResponse.status());
    console.log('User:', JSON.stringify(userData, null, 2));
    console.log('Role:', userData.role);
    console.log('CompanyId:', userData.companyId);
    console.log('ParentUserId:', userData.parentUserId);
    
    // Step 5: Try to access staff-users endpoint
    const staffUsersGetResponse = await request.get(`${baseUrl}/api/staff-users`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    
    console.log('\n=== GET /api/staff-users ===');
    console.log('Status:', staffUsersGetResponse.status());
    const staffUsersGetData = await staffUsersGetResponse.text();
    console.log('Response:', staffUsersGetData);
    
    // Step 6: Try to create staff user
    const createStaffResponse = await request.post(`${baseUrl}/api/staff-users`, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader
      },
      data: {
        username: 'teststaff' + Date.now(),
        email: `teststaff${Date.now()}@test.com`,
        password: 'test123',
        firstName: 'Test',
        lastName: 'Staff'
      }
    });
    
    console.log('\n=== POST /api/staff-users ===');
    console.log('Status:', createStaffResponse.status());
    const createStaffData = await createStaffResponse.text();
    console.log('Response:', createStaffData);
    
    // Take screenshot if error
    if (createStaffResponse.status() === 403) {
      await page.screenshot({ path: 'test-results/auth-error.png', fullPage: true });
      console.error('\n❌ 403 Forbidden error!');
    }
    
    // Assertions
    expect(userResponse.ok()).toBeTruthy();
    expect(userData.role).toBe('admin');
    
    if (createStaffResponse.status() !== 201 && createStaffResponse.status() !== 200) {
      console.error('\n❌ Failed to create staff user!');
      console.error('Expected 200/201, got:', createStaffResponse.status());
    }
  });
});

