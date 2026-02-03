# CLAUDE.md

This is the UI for bfstats.io - a statistics dashboard for Battlefield 1942, Forgotten Hope 2 (a mod), and Battlefield Vietnam servers and players.

## Critical Requirements

### Mobile Friendly
All changes must be mobile-friendly. UI components must render cleanly on both mobile and desktop.

### End-to-End Tests
Maintain and update Playwright E2E tests with all changes. Tests are located in `/e2e` and must pass after any UI modifications.

## Design System

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for quick reference on components, colors, themes, and responsive patterns. Use this when implementing frontend changes with vague UX requirements.

## Feature Documentation

When building documentation for a feature decision:
- Create a folder: `/features/<feature-name>` (use a concise, descriptive name)
- Add a `README.md` file in that folder explaining the design decision

## Tech Stack

- **Frontend**: Vue.js 3 + TypeScript
- **Styling**: CSS custom properties with dark/light mode support
- **Testing**: Playwright E2E tests
- **Build**: Vite

## Development

```bash
npm install
npm run dev          # Start development server
npm run build        # Build for production
npx vue-tsc --noEmit # Type check
```
- When working on a change, do not commit or push unless explicitly asked.