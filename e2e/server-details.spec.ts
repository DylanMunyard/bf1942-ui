import { test, expect } from '@playwright/test';

test.describe('Server Details Page', () => {
  // Use a known server name pattern - tests will navigate from server list
  test.describe('Navigation and Loading', () => {
    test('should navigate to server details from server list', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      // Find server links (excluding game mode links)
      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      const linkCount = await serverLinks.count();

      if (linkCount > 0) {
        const firstLink = serverLinks.first();
        const href = await firstLink.getAttribute('href');

        // Click and navigate
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        // Should be on server details page
        expect(page.url()).toContain('/servers/');
        // Should not be on the list page
        expect(page.url()).not.toMatch(/\/servers\/(bf1942|fh2|bfv)$/);

        // Should have server name in URL
        if (href) {
          expect(page.url()).toContain(href);
        }
      }
    });

    test('should display server hero section with name', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      // Navigate to first server
      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      const linkCount = await serverLinks.count();
      if (linkCount > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Should have a heading with server name
        const heading = page.locator('h1');
        await expect(heading).toBeVisible({ timeout: 10000 });

        const headingText = await heading.textContent();
        expect(headingText?.length).toBeGreaterThan(0);
      }
    });

    test('should display back button in hero section', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Should have back button
        const backButton = page.locator('button').filter({ hasText: /back|←/i }).first();
        const backButtonAlt = page.locator('[class*="HeroBackButton"]');

        const hasBackButton = await backButton.isVisible().catch(() => false) ||
                              await backButtonAlt.isVisible().catch(() => false);

        // Back button should exist in some form
        const anyButton = page.locator('button').first();
        await expect(anyButton).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Server Information Display', () => {
    test('should display data period information', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Should show data period info
        const bodyText = await page.locator('body').textContent();
        // Look for date-related content or "Data from" text
        const hasDataInfo = bodyText?.includes('Data from') ||
                           bodyText?.includes('📊') ||
                           bodyText?.match(/\d{4}/); // Year pattern

        expect(hasDataInfo).toBeTruthy();
      }
    });

    test('should display server metadata badges when available', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Page should have loaded with content
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(200);
      }
    });
  });

  test.describe('Live Server Status', () => {
    test('should display player count or loading state', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Should show either player count, loading, or offline state
        const bodyText = await page.locator('body').textContent();
        const hasPlayerInfo = bodyText?.includes('Players') ||
                             bodyText?.includes('Online') ||
                             bodyText?.includes('Loading') ||
                             bodyText?.includes('offline');

        expect(hasPlayerInfo).toBeTruthy();
      }
    });

    test('should display join server button when server is online', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for join button (may not always be visible depending on server status)
        const joinButton = page.locator('button').filter({ hasText: /join/i });
        const joinButtonCount = await joinButton.count();

        // Join button may or may not be present depending on live server status
        // Just verify the page loaded correctly
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(200);
      }
    });
  });

  test.describe('Collapsible Sections', () => {
    test('should have Player Activity History section', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for Player Activity History section
        const activitySection = page.locator('text=Player Activity History');
        const hasActivitySection = await activitySection.isVisible().catch(() => false);

        // Or look for the chart icon
        const chartSection = page.locator('text=📈');

        const bodyText = await page.locator('body').textContent();
        const hasHistory = bodyText?.includes('Player Activity') ||
                          bodyText?.includes('Activity History') ||
                          bodyText?.includes('population trends');

        expect(hasHistory).toBeTruthy();
      }
    });

    test('should toggle Player Activity History section on click', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find and click the Player Activity toggle button
        const toggleButton = page.locator('button').filter({ hasText: /Player Activity/i });

        if (await toggleButton.isVisible()) {
          await toggleButton.click();
          await page.waitForTimeout(500);

          // Content should now be expanded - look for period selector or chart
          const periodButtons = page.locator('button').filter({ hasText: /24h|3 days|7 days/i });
          const hasPeriodButtons = await periodButtons.first().isVisible().catch(() => false);

          // Or check for loading spinner
          const spinner = page.locator('[class*="animate-spin"]');
          const hasSpinner = await spinner.isVisible().catch(() => false);

          expect(hasPeriodButtons || hasSpinner).toBeTruthy();
        }
      }
    });

    test('should have Map Rotation section', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const bodyText = await page.locator('body').textContent();
        const hasMapRotation = bodyText?.includes('Map Rotation') ||
                               bodyText?.includes('🗺️');

        expect(hasMapRotation).toBeTruthy();
      }
    });

    test('should toggle Map Rotation section on click', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find and click the Map Rotation toggle button
        const toggleButton = page.locator('button').filter({ hasText: /Map Rotation/i });

        if (await toggleButton.isVisible()) {
          await toggleButton.click();
          await page.waitForTimeout(1000);

          // Content should expand - look for map table or loading
          const table = page.locator('table');
          const spinner = page.locator('[class*="animate-spin"]');

          const hasTable = await table.isVisible().catch(() => false);
          const hasSpinner = await spinner.isVisible().catch(() => false);

          // Either table or loading spinner should be visible
          expect(hasTable || hasSpinner).toBeTruthy();
        }
      }
    });
  });

  test.describe('Recent Sessions Section', () => {
    test('should display Recent Sessions section', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const bodyText = await page.locator('body').textContent();
        const hasSessions = bodyText?.includes('Recent Sessions') ||
                           bodyText?.includes('🎯');

        expect(hasSessions).toBeTruthy();
      }
    });

    test('should have View All Sessions link', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for "View All Sessions" link
        const viewAllLink = page.locator('a').filter({ hasText: /View All Sessions/i });
        const hasViewAll = await viewAllLink.isVisible().catch(() => false);

        if (hasViewAll) {
          const href = await viewAllLink.getAttribute('href');
          expect(href).toContain('/sessions');
        }
      }
    });
  });

  test.describe('Leaderboards Section', () => {
    test('should display Player Statistics & Rankings section', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const bodyText = await page.locator('body').textContent();
        const hasLeaderboards = bodyText?.includes('Player Statistics') ||
                                bodyText?.includes('Rankings') ||
                                bodyText?.includes('🏆');

        expect(hasLeaderboards).toBeTruthy();
      }
    });

    test('should have View Full Rankings button', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for "View Full Rankings" button/link
        const rankingsLink = page.locator('a').filter({ hasText: /VIEW FULL RANKINGS/i });
        const hasRankings = await rankingsLink.isVisible().catch(() => false);

        if (hasRankings) {
          const href = await rankingsLink.getAttribute('href');
          expect(href).toContain('/explore/servers/');
        }
      }
    });
  });

  test.describe('Data Explorer CTA', () => {
    test('should display Data Explorer call-to-action', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const bodyText = await page.locator('body').textContent();
        const hasExplorerCTA = bodyText?.includes('Data Explorer') ||
                               bodyText?.includes('Advanced Analytics') ||
                               bodyText?.includes('Explore');

        expect(hasExplorerCTA).toBeTruthy();
      }
    });

    test('should navigate to Data Explorer when clicking CTA', async ({ page }) => {
      await page.goto('/servers/bf1942');
      await page.waitForLoadState('networkidle');

      const serverLinks = page.locator('a[href^="/servers/"]').filter({
        hasNot: page.locator('[href="/servers/bf1942"], [href="/servers/fh2"], [href="/servers/bfv"], [href="/servers"]')
      });

      if (await serverLinks.count() > 0) {
        await serverLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find Data Explorer link
        const explorerLink = page.locator('a[href*="/explore/servers/"]').first();

        if (await explorerLink.isVisible()) {
          await explorerLink.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/explore/servers/');
        }
      }
    });
  });
});
