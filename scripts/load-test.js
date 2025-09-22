import axios from 'axios';

const urls = [
  'https://staging.bfstats.io/servers/bf1942',
  'https://staging.bfstats.io/servers/MoonGamers.com%20%7C%20Est.%202004',
  'https://staging.bfstats.io/players/The%20Muffin%20Man%C2%AE',
  'https://staging.bfstats.io/players/FIN-Winstonkalkaros',
  'https://staging.bfstats.io/servers/%5BPlayFH2%5DRANKED%20%232%20FH2.666%20%5B100p%5D',
  'https://staging.bfstats.io/servers/%C2%A5FOXES%C2%A5%20Modded%201.61%20BF42%2FRTR%2FSW'
];

const REQUESTS_PER_URL = 10;
const TOTAL_DURATION_MS = 60000; // 1 minute
const BASE_DELAY_MS = 500; // Base delay between requests
const RANDOM_DELAY_RANGE_MS = 1500; // Random delay up to this amount

// Track results
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: []
};

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get random delay between requests
function getRandomDelay() {
  return BASE_DELAY_MS + Math.random() * RANDOM_DELAY_RANGE_MS;
}

// Make a single request
async function makeRequest(url, requestNumber) {
  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'BFStats Load Tester/1.0'
      }
    });

    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    results.successfulRequests++;

    console.log(`✅ Request ${requestNumber} to ${url.split('/').pop()} - ${response.status} - ${responseTime}ms`);

    return { success: true, status: response.status, responseTime };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.failedRequests++;
    results.responseTimes.push(responseTime);

    const errorMsg = error.response
      ? `HTTP ${error.response.status}`
      : error.code || error.message;

    console.log(`❌ Request ${requestNumber} to ${url.split('/').pop()} - ${errorMsg} - ${responseTime}ms`);
    results.errors.push({ url, error: errorMsg, responseTime });

    return { success: false, error: errorMsg, responseTime };
  }
}

// Main load testing function
async function runLoadTest() {
  console.log('🚀 Starting load test...');
  console.log(`📊 Testing ${urls.length} URLs with ${REQUESTS_PER_URL} requests each (${urls.length * REQUESTS_PER_URL} total)`);
  console.log(`⏱️  Target duration: ${TOTAL_DURATION_MS / 1000} seconds`);
  console.log('');

  const startTime = Date.now();

  // Process each URL
  for (const url of urls) {
    console.log(`🔄 Testing URL: ${url.split('/').pop()}`);

    // Make REQUESTS_PER_URL requests for this URL
    for (let i = 1; i <= REQUESTS_PER_URL; i++) {
      results.totalRequests++;

      await makeRequest(url, i);

      // Add delay between requests (except for the last request of the last URL)
      if (!(url === urls[urls.length - 1] && i === REQUESTS_PER_URL)) {
        const delay = getRandomDelay();
        await sleep(delay);
      }
    }

    console.log('');
  }

  const totalDuration = Date.now() - startTime;

  // Calculate statistics
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  const minResponseTime = Math.min(...results.responseTimes);
  const maxResponseTime = Math.max(...results.responseTimes);
  const successRate = (results.successfulRequests / results.totalRequests) * 100;

  // Summary
  console.log('📈 Load Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Successful: ${results.successfulRequests}`);
  console.log(`Failed: ${results.failedRequests}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  console.log(`Requests per Second: ${(results.totalRequests / (totalDuration / 1000)).toFixed(2)}`);

  if (results.errors.length > 0) {
    console.log('');
    console.log('❌ Errors encountered:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.url.split('/').pop()} - ${error.error} (${error.responseTime}ms)`);
    });
  }

  console.log('');
  console.log('✅ Load test completed!');
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTest().catch(console.error);
}

export { runLoadTest };

