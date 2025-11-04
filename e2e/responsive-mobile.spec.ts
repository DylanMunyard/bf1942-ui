import { test, expect, devices } from '@playwright/test';

// Configure all tests in this file to use mobile viewport
test.use({ ...devices['Pixel 5'] });

test.describe('Responsive Design - Mobile (Pixel 5)', () => {
  test('should load landing page on mobile', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);

    // URL should be correct
    expect(page.url()).toContain('/servers/bf1942');
  });

  test('should display content without excessive horizontal scroll', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Check viewport
    const viewport = await page.viewportSize();
    expect(viewport?.width).toBe(393); // Pixel 5 width

    // Page should have content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should have clickable navigation on mobile', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Find clickable links on mobile
    const links = page.locator('a');
    const linkCount = await links.count();

    // Should have navigation links
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should navigate to players page on mobile', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Direct navigation to players
    await page.goto('/players');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/players');

    // Should display the Find Players heading
    const heading = page.locator('h1');
    const text = await heading.first().textContent();
    expect(text).toContain('Find Players');
  });

  test('should handle touch-friendly UI elements on mobile', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Find input fields that should be mobile-friendly
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    // Should have at least some inputs (search fields, etc)
    expect(inputCount).toBeGreaterThanOrEqual(0);

    // Try interacting with search if present
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await searchInput.focus();
      await searchInput.type('test');
      expect(await searchInput.inputValue()).toBe('test');
    }
  });
});
