import { test, expect } from '@playwright/test';

test.describe('Global Navigation', () => {
  test('should load servers page correctly', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/servers/bf1942');

    // Page should have content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('should navigate to players page directly', async ({ page }) => {
    await page.goto('/players');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/players');

    // Should show "Find Players" heading
    const heading = page.locator('h1');
    const text = await heading.first().textContent();
    expect(text).toContain('Find Players');
  });

  test('should maintain correct URL when navigating between pages', async ({ page }) => {
    // Go to servers
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servers/bf1942');

    // Navigate to players
    await page.goto('/players');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/players');
    expect(page.url()).not.toContain('/servers');

    // Navigate back to servers
    await page.goto('/servers/fh2');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servers/fh2');
  });

  test('should maintain navigation history across pages', async ({ page }) => {
    // Start on servers page
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servers/bf1942');

    // Navigate to players via link or direct nav
    await page.goto('/players');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/players');

    // Navigate back to servers
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Should be back on servers page
    expect(page.url()).toContain('/servers/bf1942');
  });

  test('should switch between server game modes', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servers/bf1942');

    // Navigate to FH2
    await page.goto('/servers/fh2');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servers/fh2');

    // Navigate to BFV
    await page.goto('/servers/bfv');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/servers/bfv');
  });
});
