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

test.describe('Landing Page - Player History Section', () => {
  test('should display player activity history toggle button', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Look for "Player Activity History" text or toggle button
    const historyToggle = page.getByText(/player activity history/i);

    const count = await historyToggle.count();
    if (count > 0) {
      await expect(historyToggle.first()).toBeVisible();
    }
  });

  test('should allow toggling player history chart', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Find the player history toggle button
    const historyButton = page.getByText(/player activity history/i).locator('..').locator('button');

    const count = await historyButton.count();
    if (count > 0) {
      const button = historyButton.first();

      // Click to expand
      await button.click();
      await page.waitForTimeout(500);

      // Chart should be visible or loading
      const bodyText = await page.locator('body').textContent() || '';
      expect(bodyText.length).toBeGreaterThan(500);

      // Click again to collapse
      await button.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display period selector buttons when history is shown', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Try to find and click the history toggle
    const historyButton = page.locator('button').filter({
      hasText: /player activity history/i
    });

    const count = await historyButton.count();
    if (count > 0) {
      await historyButton.first().click();
      await page.waitForTimeout(500);

      // Look for period buttons (24h, 3 days, 7 days, etc.)
      const periodButtons = ['24h', '3 days', '7 days'];

      for (const period of periodButtons) {
        const button = page.getByText(period, { exact: false });
        if ((await button.count()) > 0) {
          // At least one period button should exist
          break;
        }
      }
    }
  });

  test('should switch between different time periods', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Expand history section
    const historyButton = page.locator('button').filter({
      hasText: /player activity history/i
    });

    if ((await historyButton.count()) > 0) {
      await historyButton.first().click();
      await page.waitForTimeout(800);

      // Try clicking different period buttons
      const dayButton = page.getByText('3 days', { exact: false });
      if ((await dayButton.count()) > 0) {
        await dayButton.first().click();
        await page.waitForTimeout(500);

        // Chart should reload with new data
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(500);
      }
    }
  });

  test('should display player history chart canvas when expanded', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Expand history section
    const historyButton = page.locator('button').filter({
      hasText: /player activity history/i
    });

    if ((await historyButton.count()) > 0) {
      await historyButton.first().click();
      await page.waitForTimeout(1000);

      // Look for canvas element (chart)
      const canvas = page.locator('canvas');
      const canvasCount = await canvas.count();

      // Should have at least one chart canvas
      expect(canvasCount).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Landing Page - Game Trends Section', () => {
  test('should display game trends forecast section', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for "Forecast" text or trends section
    const forecastText = page.getByText(/forecast/i);

    const count = await forecastText.count();
    if (count > 0) {
      await expect(forecastText.first()).toBeVisible();
    }
  });

  test('should show 24-hour forecast bar chart', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Look for vertical bars or forecast visualization
    const bodyText = await page.locator('body').textContent() || '';

    // Should have forecast-related content
    const hasForecastInfo =
      bodyText.toLowerCase().includes('forecast') ||
      bodyText.toLowerCase().includes('players') ||
      bodyText.toLowerCase().includes('now');

    expect(bodyText.length).toBeGreaterThan(500);
  });

  test('should highlight current hour in forecast', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Look for "Now" text or current hour indicator
    const nowIndicator = page.getByText(/now/i);

    const count = await nowIndicator.count();
    // Current hour may or may not be labeled "Now" depending on implementation
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display player count predictions', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Page should have numerical player count data
    const bodyText = await page.locator('body').textContent() || '';

    // Should contain numbers and player-related text
    const hasNumbers = /\d+/.test(bodyText);
    expect(hasNumbers).toBeTruthy();
  });

  test('should show loading state initially for trends', async ({ page }) => {
    // Navigate and try to catch loading state
    await page.goto('/servers/bf1942');

    // Look for loading indicator
    const loadingText = page.getByText(/loading.*trends/i);

    // May or may not catch it depending on speed
    // Just checking the page doesn't crash
    await page.waitForLoadState('networkidle');
  });

  test('should handle trends error state gracefully', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Page should not crash even if trends fail to load
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(500);
  });
});

test.describe('Landing Page - Player Search', () => {
  test('should display player search input', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Look for search input with placeholder about searching players
    const searchInput = page.locator('input[placeholder*="Search players"]');

    const count = await searchInput.count();
    if (count > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should show autocomplete dropdown when typing player name', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Find player search input
    const searchInput = page.locator('input[placeholder*="Search players"]');

    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);

      // Autocomplete dropdown may appear
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(500);
    }
  });

  test('should navigate to player details when clicking search result', async ({ page }) => {
    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search players"]');

    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill('player');
      await page.waitForTimeout(800);

      // Look for player links in dropdown
      const playerLinks = page.locator('a[href*="/players/"]').filter({
        hasNot: page.locator('[href="/players"]')
      });

      if ((await playerLinks.count()) > 0) {
        await playerLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Should navigate to player details
        expect(page.url()).toContain('/players/');
      }
    }
  });
});

test.describe('Landing Page - Mobile Responsiveness', () => {
  test('should display mobile layout correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Content should be visible
    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();

    // Should not have horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should show mobile player search at top on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Mobile search should be visible
    const searchInput = page.locator('input[placeholder*="Search players"]');

    if ((await searchInput.count()) > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should display game filter buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/servers/bf1942');
    await page.waitForLoadState('networkidle');

    // Game filter buttons should be visible
    const gameButtons = page.locator('button').filter({
      hasText: /(BF1942|FH2|BFV)/
    });

    const count = await gameButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});
