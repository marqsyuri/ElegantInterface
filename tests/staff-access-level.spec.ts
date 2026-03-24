import { test, expect } from '@playwright/test';

test.describe('Staff Access Level', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
  });

  test('staff with accessLevel staff should only see appointments menu', async ({ page }) => {
    // Login as clebinho (accessLevel: staff)
    await page.fill('input[id="username"]', 'clebinho');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Check user data
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('👤 User data:', JSON.stringify(userData, null, 2));
      
      expect(userData.userType).toBe('staff');
      expect(userData.accessLevel).toBe('staff');
    }

    // Check if only appointments menu is visible
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    if (await sidebar.isVisible()) {
      const menuItems = await sidebar.locator('a, button').allTextContents();
      console.log('📋 Menu items:', menuItems);
      
      // Should only see "Agenda" or "Appointments"
      const visibleMenus = menuItems.filter(item => 
        item.toLowerCase().includes('agenda') || 
        item.toLowerCase().includes('appointment')
      );
      
      // Should NOT see admin menus
      const hasAdminMenus = menuItems.some(item => 
        item.toLowerCase().includes('client') ||
        item.toLowerCase().includes('procedur') ||
        item.toLowerCase().includes('financial') ||
        item.toLowerCase().includes('settings')
      );
      
      expect(visibleMenus.length).toBeGreaterThan(0);
      expect(hasAdminMenus).toBeFalsy();
    }
  });

  test('admin user should see all menus', async ({ page }) => {
    // Login as admin
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Check user data
    const userResponse = await page.request.get('http://localhost:5000/api/user');
    if (userResponse.ok()) {
      const userData = await userResponse.json();
      console.log('👤 Admin user data:', JSON.stringify(userData, null, 2));
      
      expect(userData.userType).toBe('admin');
      expect(userData.accessLevel).toBe('admin');
    }

    // Admin should see all menus
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    if (await sidebar.isVisible()) {
      const menuItems = await sidebar.locator('a, button').allTextContents();
      console.log('📋 Admin menu items:', menuItems);
      
      // Should see multiple menus
      expect(menuItems.length).toBeGreaterThan(2);
    }
  });
});

