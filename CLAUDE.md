# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a BF1942 Servers Dashboard - a web application for monitoring Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam game servers with real-time player statistics and AI-powered analytics. The system consists of three main components:

1. **Frontend**: Vue.js 3 + TypeScript application with Chart.js visualizations
2. **AI Backend**: C# .NET 9 service using Microsoft Semantic Kernel for player activity analytics
3. **Infrastructure**: Kubernetes deployment with Prometheus for metrics collection

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

### AI Backend Development
```bash
# Navigate to AI backend
cd ai-backend/junie-des-semantic-kernel

# Run the AI service
dotnet run

# Build the service
dotnet build

# The service runs on port 5126 by default
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
- `/api` → Backend API (port 3000)
- `/ai` → AI Backend (port 5126) 
- `/stats` → Player Stats service (port 9222)

### AI Backend Architecture (C# .NET)
- **Framework**: ASP.NET Core Web API with Microsoft Semantic Kernel
- **AI Integration**: OpenAI GPT-4o-mini integration for natural language queries
- **Analytics Functions**: Specialized Kernel Functions for player activity analysis:
  - `get_busiest_hour_of_day` - Peak activity hours
  - `get_busiest_hours_by_day_of_week` - Day-specific patterns
  - `get_weekend_activity_profile` - Weekend vs weekday comparison
  - `get_day_over_day_pattern` - Weekly activity trends
  - `get_current_player_count` - Real-time player data
- **Data Source**: Prometheus metrics via `IMetricsService` with caching
- **Timezone Support**: Configurable timezone offset (default AEST UTC+10)

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
Frontend (Vue.js) → AI Backend (C#) → Prometheus → Game Servers
                  ↘ Backend API (Express) ↗
```

### TypeScript Structure
- **Types**: Defined in `src/types/` (server types, country codes)
- **Services**: API clients in `src/services/` for different backend endpoints
- **Strict TypeScript**: Enabled with unused locals/parameters checking

### Development Proxy Setup
Vite development server proxies requests to avoid CORS issues:
- AI queries go to the C# Semantic Kernel service
- API requests go to the Express backend
- Stats requests go to the dedicated stats service

This architecture ensures secure access to Prometheus within the Kubernetes cluster while providing rich AI-powered analytics and real-time monitoring capabilities.