# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a BF1942 Servers Dashboard - a web application for monitoring Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam game servers with real-time player statistics and AI-powered analytics. The system consists of multiple components:

1. **Frontend**: Vue.js 3 + TypeScript application with Chart.js visualizations
2. **Backend API**: Express.js service that proxies requests to Prometheus (port 3000)
3. **AI Backend**: C# .NET service using Microsoft Semantic Kernel for player activity analytics (port 5126) 
4. **Player Stats Service**: Dedicated service for player statistics (port 9222)
5. **Infrastructure**: Kubernetes deployment with Prometheus for metrics collection

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (with proxy to backends)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### TypeScript Type Checking
```bash
# Type check the project
npx vue-tsc --noEmit
```

## Architecture Overview

### Frontend Architecture (Vue.js)
- **Entry Point**: `src/main.ts` bootstraps the Vue application
- **Routing**: Vue Router configuration in `src/router/index.js` with routes for:
  - Servers (BF1942/FH2/BF Vietnam modes)
  - Server details and rankings
  - Players and player details
  - Round reports
  - Team killer live wire
- **Layout**: Uses `DashboardLayout.vue` as the main layout component
- **State Management**: No centralized store - uses Vue composition API with provide/inject for dark mode
- **Styling**: CSS custom properties for theming with dark/light mode support

### Services Architecture
The frontend communicates with multiple backend services through Vite's dev proxy:
- `/api` → Backend API (port 3000) - Express.js service for Prometheus data
- `/ai` → AI Backend (port 5126) - C# service for AI-powered analytics
- `/stats` → Player Stats service (port 9222) - Dedicated player statistics service

### Backend Services
- **Express Backend**: Proxies requests to Prometheus to keep it secure within Kubernetes cluster
- **AI Backend**: C# .NET service with Microsoft Semantic Kernel for natural language queries about player activity
- **Player Stats Service**: Handles player-specific data and statistics

### Key Components
- **ServerTable.vue**: Main server listing with real-time data
- **LineChart.vue**: Chart.js wrapper for visualizations
- **PlayerSessionsPage.vue**: Player activity tracking
- **TKLivewirePage.vue**: Team killer detection and reporting
- **DetailedChartPopup.vue**: Interactive chart overlays

### Configuration
- **Frontend**: Environment variables via Vite (`VITE_API_BASE_URL`)
- **AI Backend**: Configuration via `appsettings.json`:
  - `OpenAI:Key` - OpenAI API key
  - `OpenAI:ModelId` - AI model (default: gpt-4o-mini)
  - `Prometheus:Url` - Prometheus endpoint
  - `TimeZoneOffsetHours` - Timezone offset for analytics

### Data Flow
```
Frontend (Vue.js) → Backend API (Express) → Prometheus → Game Servers
                  → AI Backend (C#) ↗
                  → Player Stats Service
```

### TypeScript Configuration
- **Strict Mode**: Enabled with `noUnusedLocals` and `noUnusedParameters` for code quality
- **Types**: Organized in `src/types/` directory
- **Path Aliases**: `@/*` maps to `./src/*` for clean imports
- **Services**: API clients in `src/services/` for different backend endpoints

### Coding Standards
- **JSON Properties**: Use camelCase for JSON properties (e.g., `isActive` not `IsActive`) as per `.cursor/rules/json-property-naming.mdc`
- **Components**: Vue 3 Composition API with TypeScript
- **Styling**: CSS custom properties for theming support

### Development Proxy Setup
Vite development server proxies requests to avoid CORS issues:
- `/api/*` → Express backend (localhost:3000)
- `/ai/*` → AI backend (localhost:5126) 
- `/stats/*` → Player stats service (localhost:9222)

This architecture ensures secure access to Prometheus within the Kubernetes cluster while providing rich AI-powered analytics and real-time monitoring capabilities.

## Code Quality Guidelines

- Always ensure changes to the UI components render cleanly on mobile and desktop