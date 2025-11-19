# E2E Tests

End-to-end tests for the bfstats UI using Playwright.

## Running Tests

### On Your Local Machine

#### Against Local Development Server (Default)

```bash
npm run test
# or
npx playwright test
```

This will start the local dev server and run all tests against `http://localhost:5173`.

#### Against Production (bfstats.io)

```bash
API_BASE_URL=https://bfstats.io npx playwright test
```

This will run tests directly against the production endpoint without starting a local dev server.

### Using Docker (Recommended for Arch Linux)

Docker provides a sandbox with all Playwright dependencies pre-installed. No local Playwright dependencies needed!

#### Build the Docker Image

```bash
docker build -f Dockerfile.e2e -t bfstats-e2e:latest .
```

#### Run Tests in Docker

**Against local dev server:**
```bash
docker run --rm --ipc=host bfstats-e2e:latest
```

**Against production (bfstats.io):**
```bash
docker run --rm --ipc=host -e API_BASE_URL=https://bfstats.io bfstats-e2e:latest
```

**Against any other endpoint:**
```bash
docker run --rm --ipc=host -e API_BASE_URL=https://staging.bfstats.io bfstats-e2e:latest
```

**Interactive shell (for debugging):**
```bash
docker run --rm --ipc=host -it bfstats-e2e:latest /bin/bash
# Then run: npx playwright test --debug
```

**Using the helper script:**
```bash
# Run tests and display report after completion
./run-e2e-docker.sh --build --prod --report

# Or just run tests (report available to view manually)
./run-e2e-docker.sh --local
```

## Viewing Test Results

### HTML Report

After tests complete, an HTML report is automatically generated in `playwright-report/`:

**Option 1: View with Playwright's built-in viewer**
```bash
npx playwright show-report
```

This opens an interactive report in your default browser showing:
- Test summary (passed/failed/skipped counts)
- Detailed results for each test
- Screenshots and videos of failures
- Trace recordings for debugging

**Option 2: Open directly in browser**
```bash
# Open the report file directly
open playwright-report/index.html  # macOS
xdg-open playwright-report/index.html  # Linux
```

**Option 3: Using the helper script**
```bash
# Run tests and automatically open the report
./run-e2e-docker.sh --prod --report
```

## Configuration

The base URL for tests is controlled via the `API_BASE_URL` environment variable in `playwright.config.ts`:

- **Not set / `http://localhost:5173`**: Uses local dev server with proxied API calls to local backend services
- **`https://bfstats.io`**: Tests against production (or any other URL)

When using a remote endpoint, the dev server is not started, so Playwright connects directly to the remote site.

## Test Files

- `landing.spec.ts` - Server browser landing page tests
- `player-search.spec.ts` - Player search and filtering tests
- `navigation.spec.ts` - Global navigation and page switching tests
- `responsive.spec.ts` - Responsive design tests for desktop viewports
- `responsive-mobile.spec.ts` - Responsive design tests for mobile viewports

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_BASE_URL` | `http://localhost:5173` | Base URL for all test navigation and API requests |
| `CI` | (not set) | When set, runs tests sequentially and enforces stricter rules |

## Browser Support

Tests run against:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Chrome (Mobile - Pixel 5)
