import { test, expect } from '@playwright/test';

test.describe('Responsive Design - Desktop', () => {
  test('should display full content on desktop (1920x1080)', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Page should have content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);

    expect(page.url()).toContain('/servers/bf1942');
  });

  test('should handle large desktop viewport (2560x1440)', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Set very large desktop viewport
    await page.setViewportSize({ width: 2560, height: 1440 });

    // Page should still render properly
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('should work with smaller desktop viewport (1280x720)', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Set smaller desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Page should still load fine
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('should display players page properly on desktop', async ({ page }) => {
    await page.goto('/players');
    await page.waitForLoadState('networkidle');

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Should show Find Players heading
    const heading = page.locator('h1');
    const text = await heading.first().textContent();
    expect(text).toContain('Find Players');

    // Should have search input
    const searchInput = page.locator('input[placeholder*="Filter players"]');
    await expect(searchInput).toBeVisible();
  });

  test('should handle window resize from desktop to smaller viewport', async ({ page }) => {
    // Start large
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    let pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);

    // Resize to smaller
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);
  });
});
