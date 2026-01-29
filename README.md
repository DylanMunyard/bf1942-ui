# BF1942 Servers Dashboard

Statistics dashboard for Battlefield 1942, Forgotten Hope 2 (a mod), and Battlefield Vietnam.

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup

1. Start the API backend (see [bf1942-stats](https://github.com/DylanMunyard/bf1942-stats) for instructions)
2. Install and run the frontend:

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` with proxies to backend services.

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npx vue-tsc --noEmit # Type check
npx playwright test  # Run E2E tests
```

## Project Structure

- `src/` - Vue 3 + TypeScript application
- `e2e/` - Playwright E2E tests
- `features/` - Feature documentation and design decisions

## Jenkins Configuration

### Application Insights Secret

The Jenkins pipeline requires an Application Insights connection string to be configured as a Jenkins secret.

**To add the secret:**

1. Go to Jenkins → Manage Jenkins → Credentials
2. Add a new "Secret text" credential with:
   - **ID**: `bfstats-appi-connection-string`
   - **Secret**: Your Application Insights connection string (format: `InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://xxx.livedata.monitor.azure.com/`)
3. Save the credential

The connection string is passed as a Docker build argument during the build process and baked into the frontend bundle at build time.
