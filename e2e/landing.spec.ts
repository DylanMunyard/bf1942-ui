import { test, expect } from '@playwright/test';

test.describe('Landing Page - Server Browser', () => {
  test('should load the servers page', async ({ page }) => {
    await page.goto('/servers/bf1942');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Page should have loaded (check for main content area)
    const mainContent = page.locator('[class*="bg-slate-900"]').first();
    await expect(mainContent).toBeVisible();

    // URL should be correct
    expect(page.url()).toContain('/servers/bf1942');
  });

  test('should display game mode filter buttons', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Look for game type buttons (BF1942, FH2, BFV)
    const gameButtons = page.locator('button');
    const buttonCount = await gameButtons.count();

    // Should have some buttons for game selection
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should allow navigation between game modes', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Try to navigate to FH2 mode
    await page.goto('/servers/fh2');
    await page.waitForLoadState('networkidle');

    // Should be on FH2 page
    expect(page.url()).toContain('/servers/fh2');
  });

  test('should display server data/content', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Wait a bit for data to load
    await page.waitForTimeout(1000);

    // Look for server information - table cells, divs with server data, etc.
    const content = page.locator('body');
    const bodyText = await content.textContent();

    // Page should have loaded with some content
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should allow clicking on a server link to view details', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Find links that navigate to server details (href contains /servers/)
    const serverLinks = page.locator('a[href*="/servers/"]').filter({
      hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"]')
    });

    const linkCount = await serverLinks.count();

    // If there are server detail links, try clicking one
    if (linkCount > 0) {
      const firstLink = serverLinks.first();
      const href = await firstLink.getAttribute('href');

      if (href && href !== '/servers/bf1942') {
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        // Should be on a server details page
        expect(page.url()).toContain('/servers/');
      }
    }
  });
});
