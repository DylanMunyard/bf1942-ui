const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Log environment variables
console.log('PROMETHEUS_URL:', process.env.PROMETHEUS_URL);
console.log('PORT:', process.env.PORT);

// Check if the environment variables are set
if (process.env.PROMETHEUS_URL) {
  console.log('✅ PROMETHEUS_URL is set correctly');
} else {
  console.log('❌ PROMETHEUS_URL is not set');
}

if (process.env.PORT) {
  console.log('✅ PORT is set correctly');
} else {
  console.log('❌ PORT is not set');
}