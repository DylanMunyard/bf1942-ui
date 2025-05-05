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
// Configure CORS to allow requests from the deployed frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);

    const allowedOrigins = [
      'https://1942.munyard.dev',
      'http://localhost:5173',
      'https://1942.home.net'
    ];

    if(allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Secure Prometheus endpoint for server player data (last 24 hours)
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

    // Calculate time range for last 24 hours
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(endDate.getHours() - 24);

    // Format dates for Prometheus
    const start = startDate.toISOString().split('.')[0] + 'Z';
    const end = endDate.toISOString().split('.')[0] + 'Z';
    const step = '30m'; // 30-minute intervals for 24 hours of data

    // Build the query
    const query = `bf1942_server_players{server_name="${serverName}"}`;

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

// Add this after all your routes
app.use((req, res) => {
  // Ensure CORS headers are set even for error responses
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
});