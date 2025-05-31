const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
// Check if we're in development mode and load the appropriate .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, envFile) });

// Log environment variables for debugging
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PROMETHEUS_URL:', process.env.PROMETHEUS_URL);

const app = express();
const PORT = process.env.PORT || 3000;
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://kube-prometheus-stack-prometheus.monitoring:9090/api/v1';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Secure Prometheus endpoint for server player data (last 7 days)
app.get('/api/prometheus/server_players', async (req, res) => {
  try {
    // Extract server name from query parameters
    const { serverName } = req.query;

    // Validate required parameters
    if (!serverName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: serverName'
      });
    }

    // Calculate time range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Format dates for Prometheus
    const start = startDate.toISOString().split('.')[0] + 'Z';
    const end = endDate.toISOString().split('.')[0] + 'Z';
    const step = '2h'; // 2-hour intervals for 7 days of data

    // Build the query
    const query = `sum without (pod, instance) (bf1942_server_players{server_name="${serverName}"})`;

    // Forward the request to Prometheus with hardcoded time parameters
    const response = await axios.get(`${PROMETHEUS_URL}/query_range`, {
      params: {
        query,
        start,
        end,
        step
      }
    });

    // Return the Prometheus response
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying request to Prometheus:', error);

    // Return appropriate error response
    if (error.response) {
      // Prometheus returned an error
      res.status(error.response.status).json({
        status: 'error',
        message: error.response.data.error || 'Error from Prometheus',
        data: error.response.data
      });
    } else {
      // Network error or other issue
      res.status(500).json({
        status: 'error',
        message: 'Failed to connect to Prometheus',
        error: error.message
      });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Proxying Prometheus requests to ${PROMETHEUS_URL}`);
});
