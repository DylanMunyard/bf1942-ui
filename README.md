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

## Tech Stack

- Vue 3 + TypeScript
- Tailwind CSS (in progress)
