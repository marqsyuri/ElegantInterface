import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:5000";

test.describe("Debug Admin Authentication", () => {
  test("should check admin user authentication and permissions", async ({ page, request }) => {
    // Step 1: Login as admin
    await page.goto(`${baseUrl}/`);
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.fill('#username', "admin");
    await page.fill('#password', "admin");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    
    // Wait for navigation
    try {
      await page.waitForURL(/dashboard|appointments|settings/, { timeout: 10000 });
    } catch (e) {
      // Continue anyway
    }
    
    // Step 2: Get cookies
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Step 3: Check current user via API
    const userResponse = await request.get(`${baseUrl}/api/user`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    
    const userData = await userResponse.json();
    console.log('=== USER DATA ===');
    console.log(JSON.stringify(userData, null, 2));
    console.log('Role:', userData.role);
    console.log('CompanyId:', userData.companyId);
    console.log('ParentUserId:', userData.parentUserId);
    console.log('Is Admin Check:', userData.role === 'admin' && (!userData.parentUserId || userData.companyId));
    
    // Step 4: Try to access staff-users endpoint
    const staffUsersResponse = await request.get(`${baseUrl}/api/staff-users`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    
    console.log('\n=== STAFF USERS ENDPOINT ===');
    console.log('Status:', staffUsersResponse.status());
    const staffUsersData = await staffUsersResponse.text();
    console.log('Response:', staffUsersData);
    
    // Step 5: Try to create staff user
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
    
    console.log('\n=== CREATE STAFF USER ===');
    console.log('Status:', createStaffResponse.status());
    const createStaffData = await createStaffResponse.text();
    console.log('Response:', createStaffData);
    
    // Assertions
    expect(userResponse.ok()).toBeTruthy();
    expect(userData.role).toBe('admin');
    
    if (createStaffResponse.status() === 403) {
      console.error('\n❌ 403 Forbidden - Admin check failed!');
      console.error('User data:', userData);
    }
  });
});

