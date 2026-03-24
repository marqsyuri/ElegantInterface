import { test, expect } from "@playwright/test";

const baseUrl = "http://localhost:5000";

test("should test debug endpoint and see server logs", async ({ page, request }) => {
  // Login
  await page.goto(`${baseUrl}/`);
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.fill('#username', "admin");
  await page.fill('#password', "admin");
  await page.getByRole("button", { name: /entrar|login/i }).click();
  
  await page.waitForTimeout(2000);
  
  // Get cookies
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  // Test debug endpoint
  console.log('\n=== TESTING /api/debug-auth ===');
  const debugResponse = await request.get(`${baseUrl}/api/debug-auth`, {
    headers: {
      Cookie: cookieHeader
    }
  });
  
  console.log('Status:', debugResponse.status());
  const debugData = await debugResponse.text();
  console.log('Response:', debugData);
  
  // Check server logs in terminal where npm run dev is running
  console.log('\n=== CHECK SERVER LOGS ===');
  console.log('Look for logs starting with [isAdmin] in the terminal where the server is running');
  console.log('The logs will show exactly what is in req.user');
});

