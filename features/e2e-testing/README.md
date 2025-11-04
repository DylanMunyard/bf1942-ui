# E2E Testing with Playwright

This project uses **Playwright** for end-to-end testing. These tests simulate real user interactions like clicking through pages, searching for players, and navigating between server views.

## Quick Start

### Prerequisites
- Backend services running (API, AI Backend, Player Stats service)
- Node dependencies installed (`npm install`)

### Run Tests

```bash
# Run all tests in headless mode (CI mode)
npm run test:e2e

# Run tests with UI - watch mode for development
npm run test:e2e:ui

# Run tests in debug mode - step through tests
npm run test:e2e:debug

# Run tests with visible browser window
npm run test:e2e:headed
```

## Test Files

Tests are located in the `e2e/` directory:

- **`landing.spec.ts`** - Tests server browser functionality (BF1942, FH2, BFV modes)
- **`player-search.spec.ts`** - Tests player search and navigation to player details
- **`navigation.spec.ts`** - Tests global navigation between major sections
- **`responsive.spec.ts`** - Tests responsive design on mobile and desktop

## How to Add New Tests

### Example: Test a specific flow

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Navigate to page
    await page.goto('/path');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Find and interact with elements
    const button = page.locator('button:has-text("Click me")');
    await button.click();

    // Verify expected behavior
    await expect(page).toHaveURL('/expected-path');
    await expect(page.locator('h1')).toContainText('Expected Title');
  });
});
```

### Useful Playwright Commands

```typescript
// Navigation
await page.goto('/path');
await page.goBack();
await page.reload();

// Waiting
await page.waitForLoadState('networkidle');
await page.waitForSelector('selector');
await page.waitForTimeout(1000);

// Finding elements
page.locator('selector')
page.locator('button:has-text("Text")')
page.locator('a[href*="/players"]')

// Interactions
await element.click();
await element.fill('text to type');
await element.check(); // checkboxes
await element.select('option'); // dropdowns

// Assertions
await expect(element).toBeVisible();
await expect(element).toContainText('text');
await expect(page).toHaveURL('/expected-url');
```

## Best Practices

1. **Use descriptive test names** - Make it clear what scenario is being tested
2. **Wait for network** - Use `await page.waitForLoadState('networkidle')` after navigation to ensure data loads
3. **Flexible selectors** - Use contains/has-text for more resilient tests that don't break on minor UI changes
4. **Handle optional elements** - Some UI elements may not always be present; use `.isVisible().catch(() => false)` to gracefully skip tests
5. **Keep tests focused** - Each test should verify one scenario or user flow
6. **Use baseURL** - The config uses `baseURL: 'http://localhost:5173'`, so relative paths work

## CI/CD Integration

The tests are configured to:
- Automatically start the dev server before running tests
- Reuse existing server if already running (for local development)
- Run with a single worker in CI mode for stability
- Generate HTML reports in `playwright-report/`

## Configuration

See `playwright.config.ts` for:
- Base URL configuration
- Browser targets (Chromium, Firefox, WebKit, Mobile)
- Reporter settings
- Dev server startup

## Debugging Tests

Use the UI mode to debug tests interactively:

```bash
npm run test:e2e:ui
```

This opens an interactive interface where you can:
- Step through tests
- Inspect elements
- View test timeline
- Watch test playback
