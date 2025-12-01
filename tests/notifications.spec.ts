import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("In-app notifications", () => {
  test("open bell popover and navigate to appointment", async ({ page }) => {
    test.skip(!process.env.E2E_BASE_URL, "Defina E2E_BASE_URL apontando para o ambiente em execução antes de rodar o teste");

    await page.goto(`${baseUrl}/`);

    await page.fill('input[name="username"]', process.env.E2E_USERNAME || "admin");
    await page.fill('input[name="password"]', process.env.E2E_PASSWORD || "admin");
    await page.getByRole("button", { name: /entrar|login/i }).click();

    await page.waitForURL(/dashboard/, { timeout: 30_000 });

    const bellButton = page.getByRole("button", { name: /notifica/i });
    await expect(bellButton).toBeVisible();
    await bellButton.click();

    const popover = page.getByRole("dialog", { name: /notifica/i });
    await expect(popover).toBeVisible();

    const notificationItem = popover.getByRole("button").first();
    await notificationItem.click();

    await expect(page).toHaveURL(/appointments/);
  });
});

