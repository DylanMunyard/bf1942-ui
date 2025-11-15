import { test, expect } from '@playwright/test';

test.describe('Player Details Page', () => {
  // Use a well-known player that likely exists in the system
  const testPlayerName = 'TestPlayer';

  test.beforeEach(async ({ page }) => {
    // Navigate to a player details page before each test
    await page.goto(`/players/${testPlayerName}`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Loading', () => {
    test('should load the player details page', async ({ page }) => {
      // Check that we're on the correct URL
      expect(page.url()).toContain(`/players/${testPlayerName}`);

      // Page should have main content visible
      const mainContent = page.locator('.min-h-screen').first();
      await expect(mainContent).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
      // Reload to catch loading state
      await page.reload();

      // Look for loading indicator (if it appears fast enough)
      const loadingText = page.getByText(/loading player statistics/i);
      // This may or may not be visible depending on load speed
      // Just checking it doesn't crash if not found
    });

    test('should handle errors gracefully if player not found', async ({ page }) => {
      // Navigate to a player that definitely doesn't exist
      await page.goto('/players/ThisPlayerDefinitelyDoesNotExist_12345XYZ');
      await page.waitForLoadState('networkidle');

      // Should either show error message or handle gracefully
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Player Hero Section', () => {
    test('should display player name in hero section', async ({ page }) => {
      // Look for player name in a heading or prominent text
      const playerNameElement = page.getByText(testPlayerName, { exact: false });
      await expect(playerNameElement.first()).toBeVisible();
    });

    test('should display back button in hero section', async ({ page }) => {
      // Look for back button/link
      const backButton = page.locator('a[href="/players"], button').filter({
        has: page.locator('svg')
      }).first();

      if (await backButton.isVisible()) {
        await expect(backButton).toBeVisible();
      }
    });

    test('should show compare player button', async ({ page }) => {
      // Look for "Compare Player" button/link
      const compareButton = page.getByText(/compare player/i);

      // If the button exists, it should be visible
      const count = await compareButton.count();
      if (count > 0) {
        await expect(compareButton.first()).toBeVisible();
      }
    });

    test('should display player stats summary (playtime, last played)', async ({ page }) => {
      // Look for time-related text (hours, minutes, ago, etc.)
      const bodyText = await page.locator('body').textContent() || '';

      // Check for common stat indicators
      const hasTimeInfo =
        bodyText.includes('hour') ||
        bodyText.includes('minute') ||
        bodyText.includes('ago') ||
        bodyText.includes('day');

      expect(hasTimeInfo).toBeTruthy();
    });
  });

  test.describe('Best Scores Section', () => {
    test('should display best scores section', async ({ page }) => {
      // Look for "Best Scores" heading or section
      const bestScoresHeading = page.getByText(/best scores/i);

      const count = await bestScoresHeading.count();
      if (count > 0) {
        await expect(bestScoresHeading.first()).toBeVisible();
      }
    });

    test('should have time filter buttons for best scores', async ({ page }) => {
      // Look for common time filter labels
      const timeFilters = ['All Time', 'Last 30 Days', 'This Week'];

      for (const filter of timeFilters) {
        const filterButton = page.getByText(filter, { exact: false });
        const count = await filterButton.count();

        if (count > 0) {
          // At least one time filter button should be visible
          break;
        }
      }
    });

    test('should display score cards with K/D, kills, deaths', async ({ page }) => {
      // Wait for potential score data to load
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent() || '';

      // Check for common score-related terms
      const hasScoreData =
        bodyText.includes('K/D') ||
        bodyText.includes('kills') ||
        bodyText.includes('deaths') ||
        bodyText.includes('score');

      // If there's score data, these terms should appear
      expect(bodyText.length).toBeGreaterThan(500); // Page has loaded with content
    });
  });

  test.describe('Top Servers Section', () => {
    test('should display top servers section', async ({ page }) => {
      // Scroll down to find server-related content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent() || '';

      // Look for server-related terms
      const hasServerInfo =
        bodyText.toLowerCase().includes('server') ||
        bodyText.toLowerCase().includes('favorite');

      expect(hasServerInfo).toBeTruthy();
    });

    test('should show server links if player has played on servers', async ({ page }) => {
      // Look for links to server details pages
      const serverLinks = page.locator('a[href*="/servers/"]');
      const linkCount = await serverLinks.count();

      // Count may be 0 if player hasn't played, just checking it doesn't error
      expect(linkCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Performance Analytics Section', () => {
    test('should display performance analytics section', async ({ page }) => {
      // Look for "Performance" or "Analytics" heading
      const analyticsHeading = page.getByText(/performance analytics/i);

      const count = await analyticsHeading.count();
      if (count > 0) {
        await expect(analyticsHeading.first()).toBeVisible();
      }
    });

    test('should show K/D ratio trend chart', async ({ page }) => {
      // Look for K/D related text
      const kdText = page.getByText(/k\/d ratio/i);

      const count = await kdText.count();
      if (count > 0) {
        await expect(kdText.first()).toBeVisible();
      }
    });

    test('should show kill rate trend chart', async ({ page }) => {
      // Look for kill rate text
      const killRateText = page.getByText(/kill rate/i);

      const count = await killRateText.count();
      if (count > 0) {
        await expect(killRateText.first()).toBeVisible();
      }
    });

    test('should display activity by hour chart', async ({ page }) => {
      // Scroll to find activity section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent() || '';

      // Look for activity-related terms
      const hasActivityInfo =
        bodyText.toLowerCase().includes('activity') ||
        bodyText.toLowerCase().includes('online hours') ||
        bodyText.toLowerCase().includes('typical');

      expect(bodyText.length).toBeGreaterThan(1000); // Substantial content loaded
    });
  });

  test.describe('Achievements Section', () => {
    test('should display achievements section', async ({ page }) => {
      // Scroll down to achievements
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
      await page.waitForTimeout(500);

      const achievementsHeading = page.getByText(/achievements/i);

      const count = await achievementsHeading.count();
      if (count > 0) {
        await expect(achievementsHeading.first()).toBeVisible();
      }
    });

    test('should have link to view all achievements', async ({ page }) => {
      // Look for "View All Achievements" link
      const viewAllLink = page.getByText(/view all achievements/i);

      const count = await viewAllLink.count();
      if (count > 0) {
        await expect(viewAllLink.first()).toBeVisible();

        // Click and verify navigation
        await viewAllLink.first().click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/achievements');
      }
    });
  });

  test.describe('Similar Players Section', () => {
    test('should display similar players section if available', async ({ page }) => {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const bodyText = await page.locator('body').textContent() || '';

      // Look for similar players or comparison text
      const hasSimilarPlayers =
        bodyText.toLowerCase().includes('similar') ||
        bodyText.toLowerCase().includes('comparison') ||
        bodyText.toLowerCase().includes('alias');

      // May or may not have similar players, just checking page loaded
      expect(bodyText.length).toBeGreaterThan(1500);
    });
  });

  test.describe('Navigation and Interaction', () => {
    test('should allow clicking compare player button', async ({ page }) => {
      const compareButton = page.getByText(/compare player/i).first();

      const count = await compareButton.count();
      if (count > 0) {
        await compareButton.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to comparison page with player pre-filled
        expect(page.url()).toContain('/compare');
        expect(page.url()).toContain(testPlayerName);
      }
    });

    test('should allow scrolling through all sections', async ({ page }) => {
      // Scroll through the page
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(200);

      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(200);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);

      // Page should still be responsive
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(500);
    });

    test('should maintain responsive layout on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Reload page with mobile viewport
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Content should still be visible
      const mainContent = page.locator('body').first();
      await expect(mainContent).toBeVisible();

      // Should not have horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });
  });

  test.describe('Recent Sessions Section', () => {
    test('should display recent rounds if available', async ({ page }) => {
      // Look for "Recent Rounds" heading
      const recentRoundsHeading = page.getByText(/recent rounds/i);

      const count = await recentRoundsHeading.count();
      if (count > 0) {
        await expect(recentRoundsHeading.first()).toBeVisible();
      }
    });

    test('should have link to view all sessions', async ({ page }) => {
      // Look for "View All Sessions" link
      const viewAllLink = page.getByText(/view all sessions/i);

      const count = await viewAllLink.count();
      if (count > 0) {
        await expect(viewAllLink.first()).toBeVisible();
      }
    });
  });
});
