# Project Overview

This is a **BF1942 Servers Dashboard** - a web application for monitoring Battlefield 1942, Forgotten Hope 2, and Battlefield Vietnam game servers with real-time player statistics and AI-powered analytics.

## System Architecture

The system consists of multiple components:

1. **Frontend**: Vue.js 3 + TypeScript application with Chart.js visualizations
2. **Backend API**: Express.js service that proxies requests to Prometheus (port 3000)
3. **AI Backend**: C# .NET service using Microsoft Semantic Kernel for player activity analytics (port 5126) 
4. **Player Stats Service**: Dedicated service for player statistics (port 9222)
5. **SignalR Hub**: Real-time communication service (port 9223)
6. **Infrastructure**: Kubernetes deployment with Prometheus for metrics collection

## Tech Stack

### Frontend
- **Framework**: Vue.js 3 with Composition API
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **UI Framework**: PrimeVue components + PrimeFlex + Tailwind CSS
- **Charts**: Chart.js with vue-chartjs wrapper
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Real-time**: Microsoft SignalR client
- **Authentication**: JWT decode, Google Auth Library

### Backend Services
- **Express API**: Node.js service proxying to Prometheus
- **AI Backend**: C# .NET with Microsoft Semantic Kernel
- **Player Stats**: Dedicated statistics service
- **Database**: Mentioned in directory structure
- **Metrics**: Prometheus for data collection
- **Deployment**: Kubernetes with Docker containers

## Development Environment
- **System**: Linux (Arch Linux 6.15.6)
- **Node.js**: Modern ES modules (type: "module")
- **Package Manager**: npm with package-lock.json