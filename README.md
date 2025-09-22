# BF1942 Servers Dashboard

A dashboard for monitoring BF1942 game servers with real-time player statistics and historical data visualization.

## Architecture

The application consists of two main components:

1. **Frontend**: A Vue.js application that displays server information and player statistics
2. **Backend API**: A Node.js Express server that proxies requests to Prometheus

### Data Flow

```
Frontend (Vue.js) → Backend API (Express) → Prometheus → Game Servers
```

The frontend makes API calls to the backend, which then queries Prometheus for server metrics. This architecture ensures that Prometheus remains secure within the Kubernetes cluster and is not exposed publicly.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (optional, for containerized development)

### Frontend Setup

1. Clone the repository
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```sh
   npm run dev
   ```

## Environment Configuration

### Frontend Environment Variables

- `VITE_API_BASE_URL`: The base URL for the backend API
  - Development: `http://localhost:3000`
  - Production: Leave empty to use relative URLs

### Backend Environment Variables

- `PORT`: The port on which the backend API will run (default: 3000)
- `PROMETHEUS_URL`: The URL of the Prometheus API (default: http://kube-prometheus-stack-prometheus.monitoring:9090/api/v1)

## Deployment

The application is deployed to Kubernetes using the configuration files in the `deploy/app` directory:

- `deployment.yaml`: Frontend deployment and service
- `backend-deployment.yaml`: Backend API deployment and service
- `ingress.yaml`: Ingress configuration for external access

### Building and Deploying

1. Build the frontend:
   ```sh
   npm run build
   ```
2. Build the Docker images:
   ```sh
   docker build -t bfstats-ui:latest .
   docker build -t bfstats-ui-backend:latest ./backend
   ```
3. Push the images to your registry
4. Apply the Kubernetes configurations:
   ```sh
   kubectl apply -f deploy/app/
   ```
