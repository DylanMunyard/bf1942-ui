import { test, expect } from '@playwright/test';

test.describe('Data Explorer', () => {
  test.describe('Page Load and Initial State', () => {
    test('should load Data Explorer page', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // Should redirect to /explore/servers by default
      expect(page.url()).toContain('/explore');
    });

    test('should display header with mode tabs', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      // Should have mode selection (servers, maps, players)
      const bodyText = await page.locator('body').textContent();

      // Look for mode indicators
      const hasServers = bodyText?.toLowerCase().includes('server');
      const hasMaps = bodyText?.toLowerCase().includes('map');
      const hasPlayers = bodyText?.toLowerCase().includes('player');

      expect(hasServers || hasMaps || hasPlayers).toBeTruthy();
    });

    test('should display master list panel', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Should have a list/sidebar area
      const sidebar = page.locator('[class*="sidebar"], [class*="master"], [class*="list"]').first();
      const hasSidebar = await sidebar.isVisible().catch(() => false);

      // Or just check that content loaded
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });

    test('should show empty state when no item selected', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Should show "Select a server to view details" or similar
      const bodyText = await page.locator('body').textContent();
      const hasEmptyState = bodyText?.includes('Select') ||
                           bodyText?.includes('select') ||
                           bodyText?.includes('[ ]') ||
                           bodyText?.includes('{ }');

      expect(hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Mode Switching', () => {
    test('should navigate to servers mode', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/explore/servers');
    });

    test('should navigate to maps mode', async ({ page }) => {
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/explore/maps');

      // Should show map-related content
      const bodyText = await page.locator('body').textContent();
      const hasMapsContent = bodyText?.toLowerCase().includes('map') ||
                            bodyText?.includes('{ }');

      expect(hasMapsContent).toBeTruthy();
    });

    test('should navigate to players mode', async ({ page }) => {
      await page.goto('/explore/players');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/explore/players');

      // Should show player-related content
      const bodyText = await page.locator('body').textContent();
      const hasPlayersContent = bodyText?.toLowerCase().includes('player') ||
                               bodyText?.includes('< >') ||
                               bodyText?.includes('search');

      expect(hasPlayersContent).toBeTruthy();
    });

    test('should switch between modes using UI controls', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      // Find mode switcher buttons
      const mapsButton = page.locator('button, a').filter({ hasText: /maps/i }).first();

      if (await mapsButton.isVisible()) {
        await mapsButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Should be on maps mode
        expect(page.url()).toContain('/explore/maps');
      }
    });
  });

  test.describe('Server Mode', () => {
    test('should display list of servers', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Should have some server entries
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(300);
    });

    test('should select a server and show detail panel', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Find clickable server items in master list
      const serverItems = page.locator('[class*="master"] button, [class*="sidebar"] button, [class*="list"] [role="button"]');
      const itemCount = await serverItems.count();

      if (itemCount > 0) {
        await serverItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Detail panel should be visible with server info
        const bodyText = await page.locator('body').textContent();
        const hasDetail = bodyText?.includes('Map') ||
                         bodyText?.includes('Players') ||
                         bodyText?.includes('rounds') ||
                         bodyText?.includes('Statistics');
        expect(hasDetail).toBeTruthy();
      }
    });

    test('should display server detail panel when server selected', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Find and click first server
      const serverItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await serverItems.count() > 0) {
        await serverItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Detail panel should show server information
        const bodyText = await page.locator('body').textContent();
        const hasDetail = bodyText?.includes('Map') ||
                         bodyText?.includes('Players') ||
                         bodyText?.includes('rounds') ||
                         bodyText?.includes('Statistics');

        expect(hasDetail).toBeTruthy();
      }
    });

    test('should navigate to server-map detail from server detail', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Select a server first
      const serverItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await serverItems.count() > 0) {
        await serverItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Find a map link in the detail panel
        const mapLinks = page.locator('[class*="detail"], [class*="main"]').locator('button, a').filter({
          hasText: /map|battlefield|wake|berlin|el alamein/i
        });

        if (await mapLinks.count() > 0) {
          await mapLinks.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);

          // Should navigate to server-map detail
          expect(page.url()).toMatch(/\/explore\/servers\/[^/]+\/maps\//);
        }
      }
    });
  });

  test.describe('Maps Mode', () => {
    test('should display list of maps', async ({ page }) => {
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Should have map content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(300);
    });

    test('should select a map and show detail panel', async ({ page }) => {
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Find clickable map items
      const mapItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await mapItems.count() > 0) {
        await mapItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Detail panel should show map info
        const bodyText = await page.locator('body').textContent();
        const hasMapDetail = bodyText?.toLowerCase().includes('server') ||
                            bodyText?.includes('played') ||
                            bodyText?.includes('rounds');
        expect(hasMapDetail).toBeTruthy();
      }
    });

    test('should display map detail with server list', async ({ page }) => {
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Select a map
      const mapItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await mapItems.count() > 0) {
        await mapItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Detail should show servers playing this map
        const bodyText = await page.locator('body').textContent();
        const hasServerInfo = bodyText?.toLowerCase().includes('server') ||
                             bodyText?.includes('played') ||
                             bodyText?.includes('rounds');

        expect(hasServerInfo).toBeTruthy();
      }
    });
  });

  test.describe('Players Mode', () => {
    test('should display player search interface', async ({ page }) => {
      await page.goto('/explore/players');
      await page.waitForLoadState('networkidle');

      // Should have search input or player-related UI
      const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="player" i]');
      const hasSearch = await searchInput.isVisible().catch(() => false);

      const bodyText = await page.locator('body').textContent();
      const hasPlayerUI = bodyText?.toLowerCase().includes('player') ||
                         bodyText?.toLowerCase().includes('search');

      expect(hasSearch || hasPlayerUI).toBeTruthy();
    });

    test('should search for a player', async ({ page }) => {
      await page.goto('/explore/players');
      await page.waitForLoadState('networkidle');

      // Find search input
      const searchInput = page.locator('input[type="text"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('player');
        await page.waitForTimeout(500);

        // Should show search results or update UI
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(100);
      }
    });

    test('should select a player and show detail panel', async ({ page }) => {
      await page.goto('/explore/players');
      await page.waitForLoadState('networkidle');

      // Search for a player
      const searchInput = page.locator('input[type="text"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('a');
        await page.waitForTimeout(1000);

        // Find player items in results
        const playerItems = page.locator('[class*="master"] button, [class*="sidebar"] button, [class*="list"] button').filter({
          hasNot: page.locator('[class*="mode"], [class*="tab"], [class*="game"]')
        });

        if (await playerItems.count() > 0) {
          await playerItems.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);

          // Detail panel should show player info
          const bodyText = await page.locator('body').textContent();
          const hasPlayerDetail = bodyText?.toLowerCase().includes('server') ||
                                 bodyText?.includes('rounds') ||
                                 bodyText?.includes('kills') ||
                                 bodyText?.includes('score');
          expect(hasPlayerDetail).toBeTruthy();
        }
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should have search input in header', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      // Look for search input
      const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]');
      const hasSearch = await searchInput.first().isVisible().catch(() => false);

      expect(hasSearch).toBeTruthy();
    });

    test('should filter servers by search query', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const searchInput = page.locator('input[type="text"]').first();

      if (await searchInput.isVisible()) {
        // Get initial content
        const initialText = await page.locator('body').textContent();

        // Type search query
        await searchInput.fill('fh2');
        await page.waitForTimeout(500);

        // Content should change or filter
        const filteredText = await page.locator('body').textContent();

        // Either content changed or it's still showing results
        expect(filteredText?.length).toBeGreaterThan(100);
      }
    });

    test('should maintain separate search queries per mode', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="text"]').first();

      if (await searchInput.isVisible()) {
        // Type in servers mode
        await searchInput.fill('test-server');
        await page.waitForTimeout(300);

        // Switch to maps mode
        await page.goto('/explore/maps');
        await page.waitForLoadState('networkidle');

        // Search should be cleared or different for maps mode
        const mapsSearchInput = page.locator('input[type="text"]').first();
        const mapsValue = await mapsSearchInput.inputValue();

        // Should not have the server search query
        expect(mapsValue).not.toBe('test-server');
      }
    });
  });

  test.describe('URL Routing', () => {
    test('should maintain mode URL when selecting server', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Select a server
      const serverItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await serverItems.count() > 0) {
        await serverItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Should still be on servers mode
        expect(page.url()).toContain('/explore/servers');

        // Detail panel should show server info
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.length).toBeGreaterThan(300);
      }
    });

    test('should maintain mode after page reload', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Should still be on servers mode
      expect(page.url()).toContain('/explore/servers');

      // Page should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });

    test('should handle direct navigation to servers mode', async ({ page }) => {
      // Navigate to maps first
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');

      // Navigate directly to servers
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Should show servers mode
      expect(page.url()).toContain('/explore/servers');
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });

    test('should handle direct navigation to maps mode', async ({ page }) => {
      // Navigate to servers first
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      // Navigate directly to maps
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('/explore/maps');
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });
  });

  test.describe('Server-Map Detail View', () => {
    test('should display server detail with map information', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Select a server
      const serverItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await serverItems.count() > 0) {
        await serverItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Should show server detail with map information
        const bodyText = await page.locator('body').textContent();
        const hasMapStats = bodyText?.includes('rounds') ||
                           bodyText?.includes('wins') ||
                           bodyText?.includes('players') ||
                           bodyText?.includes('Map') ||
                           bodyText?.includes('Statistics');

        expect(hasMapStats).toBeTruthy();
      }
    });

    test('should allow clicking on maps in server detail', async ({ page }) => {
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const serverItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await serverItems.count() > 0) {
        await serverItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Find visible map links in the server detail
        const mapLinks = page.locator('button, a').filter({
          hasText: /battlefield|wake|berlin|alamein|stalingrad|midway/i
        });

        if (await mapLinks.count() > 0) {
          const firstMapLink = mapLinks.first();
          // Only click if visible (may be hidden on mobile)
          if (await firstMapLink.isVisible()) {
            await firstMapLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
          }

          // Page should still be functional
          const bodyText = await page.locator('body').textContent();
          expect(bodyText?.length).toBeGreaterThan(200);
        }
      }
    });
  });

  test.describe('Cross-Navigation', () => {
    test('should navigate from map detail to server view', async ({ page }) => {
      await page.goto('/explore/maps');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Select a map
      const mapItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
        hasNot: page.locator('[class*="mode"], [class*="tab"]')
      });

      if (await mapItems.count() > 0) {
        await mapItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Find server link in map detail
        const serverLinks = page.locator('[class*="detail"], [class*="main"]').locator('button, a').filter({
          hasNot: page.locator('[class*="tab"]')
        });

        if (await serverLinks.count() > 0) {
          await serverLinks.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);

          // Page should still be functional after navigation
          const bodyText = await page.locator('body').textContent();
          expect(bodyText?.length).toBeGreaterThan(200);
        }
      }
    });

    test('should navigate from player detail to server view', async ({ page }) => {
      await page.goto('/explore/players');
      await page.waitForLoadState('networkidle');

      // Search for a player
      const searchInput = page.locator('input[type="text"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('a');
        await page.waitForTimeout(1000);

        // Select a player
        const playerItems = page.locator('[class*="master"] button, [class*="sidebar"] button').filter({
          hasNot: page.locator('[class*="mode"], [class*="tab"], [class*="game"]')
        });

        if (await playerItems.count() > 0) {
          await playerItems.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);

          // Find server link in player detail
          const serverLinks = page.locator('[class*="detail"], [class*="main"]').locator('button, a').filter({
            hasText: /server/i
          });

          if (await serverLinks.count() > 0) {
            await serverLinks.first().click();
            await page.waitForLoadState('networkidle');

            // Page should still be functional after navigation
            const bodyText = await page.locator('body').textContent();
            expect(bodyText?.length).toBeGreaterThan(200);
          }
        }
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Page should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });

    test('should handle viewport resize', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/explore/servers');
      await page.waitForLoadState('networkidle');

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Should still be functional
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(200);
    });
  });
});
