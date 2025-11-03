<template>
  <div class="relative min-h-screen px-3 sm:px-6">
    <!-- Background Effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <div class="relative z-10 pb-6 sm:pb-12">
      <div class="max-w-7xl mx-auto">
        <!-- Header Section -->
        <div class="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-green-500/10 opacity-50" />
          <div class="relative z-10 p-6 sm:p-8 md:p-12">
            <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 mb-4">
              System Statistics
            </h1>
            <p class="text-slate-300 text-lg sm:text-xl leading-relaxed">
              Real-time data volume metrics across analytical and operational databases
            </p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !stats" class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div v-for="i in 2" :key="i" class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6 animate-pulse">
            <div class="h-6 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div class="space-y-6">
              <div>
                <div class="h-12 bg-slate-700 rounded w-2/3 mb-2"></div>
                <div class="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
              <div>
                <div class="h-12 bg-slate-700 rounded w-2/3 mb-2"></div>
                <div class="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 sm:p-8">
          <div class="flex items-center gap-3 text-red-400 mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-xl font-bold">Error Loading Statistics</h2>
          </div>
          <p class="text-slate-300">{{ error }}</p>
          <button
            @click="fetchStats"
            class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>

        <!-- Data Grid -->
        <div v-else-if="stats" class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <!-- ClickHouse Card -->
          <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-blue-500/30 overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
            <div class="p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                <h2 class="text-2xl font-semibold text-blue-400">ClickHouse</h2>
                <span class="text-sm text-slate-500 ml-auto">Analytics Engine</span>
              </div>

              <div class="space-y-8">
                <div class="group">
                  <div class="text-5xl sm:text-6xl font-mono font-bold text-white transition-all duration-300 group-hover:text-blue-400">
                    {{ formatNumber(stats.clickHouseMetrics.roundsTracked) }}
                  </div>
                  <div class="text-sm text-slate-400 mt-2 flex items-center gap-2">
                    Rounds Tracked
                    <span class="group-hover:opacity-100 opacity-0 transition-opacity text-xs text-slate-500" title="Total completed game rounds across all servers">ℹ️</span>
                  </div>
                </div>

                <div class="group">
                  <div class="text-5xl sm:text-6xl font-mono font-bold text-white transition-all duration-300 group-hover:text-blue-400">
                    {{ formatNumber(stats.clickHouseMetrics.playerMetricsTracked) }}
                  </div>
                  <div class="text-sm text-slate-400 mt-2 flex items-center gap-2">
                    Player Metrics Tracked
                    <span class="group-hover:opacity-100 opacity-0 transition-opacity text-xs text-slate-500" title="Time-series snapshots of player stats">ℹ️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SQLite Card -->
          <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-green-500/30 overflow-hidden transition-all duration-300 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10">
            <div class="p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <h2 class="text-2xl font-semibold text-green-400">SQLite</h2>
                <span class="text-sm text-slate-500 ml-auto">Operational Database</span>
              </div>

              <div class="space-y-8">
                <div class="group">
                  <div class="text-5xl sm:text-6xl font-mono font-bold text-white transition-all duration-300 group-hover:text-green-400">
                    {{ formatNumber(stats.sqliteMetrics.serversTracked) }}
                  </div>
                  <div class="text-sm text-slate-400 mt-2 flex items-center gap-2">
                    Servers Tracked
                    <span class="group-hover:opacity-100 opacity-0 transition-opacity text-xs text-slate-500" title="Unique game servers being monitored">ℹ️</span>
                  </div>
                </div>

                <div class="group">
                  <div class="text-5xl sm:text-6xl font-mono font-bold text-white transition-all duration-300 group-hover:text-green-400">
                    {{ formatNumber(stats.sqliteMetrics.playersTracked) }}
                  </div>
                  <div class="text-sm text-slate-400 mt-2 flex items-center gap-2">
                    Players Tracked
                    <span class="group-hover:opacity-100 opacity-0 transition-opacity text-xs text-slate-500" title="Unique players observed across all servers">ℹ️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- About This System Section -->
        <div v-if="stats" class="mt-8">
          <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
            <div class="p-6 sm:p-8">
              <h2 class="text-xl font-semibold text-slate-300 mb-4">About This System</h2>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li>• Server stats scraped every 30 seconds</li>
                <li>• Built entirely with AI/LLMs (learning exercise in prompt engineering)</li>
                <li>• ClickHouse for analytics, SQLite for operational data</li>
                <li>• Hosted on Azure Kubernetes Service</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Credits Section -->
        <div v-if="stats" class="mt-8">
          <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
            <div class="p-6 sm:p-8">
              <h2 class="text-xl font-semibold text-slate-300 mb-4">Credits</h2>
              <div class="space-y-4 text-slate-400 text-sm">
                <!-- Data Source Credit -->
                <div>
                  <p class="mb-2">
                    <strong class="text-slate-300">Data provided by:</strong>
                  </p>
                  <p>
                    <a href="https://bflist.io/" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 transition-colors underline">
                      bflist.io
                    </a>
                    - Special thanks to 
                    <a href="https://github.com/sponsors/cetteup" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 transition-colors underline">
                      ceeteup
                    </a>
                    for providing the APIs that make all server and player data possible.
                  </p>
                </div>

                <!-- Feedback Contributors -->
                <div>
                  <p class="mb-2">
                    <strong class="text-slate-300">Early feedback and suggestions:</strong>
                  </p>
                  <ul class="space-y-1 ml-4">
                    <li>
                      • <a href="/players/pada" class="text-cyan-400 hover:text-cyan-300 transition-colors underline">pada</a>
                    </li>
                    <li>
                      • <a href="/players/tragic!" class="text-cyan-400 hover:text-cyan-300 transition-colors underline">tragic!</a>
                    </li>
                    <li>
                      • <a href="/players/Black%20Mamba" class="text-cyan-400 hover:text-cyan-300 transition-colors underline">Black Mamba</a>
                    </li>
                  </ul>
                </div>

                <!-- Special Recognition -->
                <div>
                  <p class="mb-2">
                    <strong class="text-slate-300">Special recognition:</strong>
                  </p>
                  <p>
                    <a href="/players/Black%20Mamba" class="text-yellow-400 hover:text-yellow-300 transition-colors underline">
                      Black Mamba
                    </a>
                    for originating the tournaments idea and providing detailed documentation to make it happen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Last Updated -->
        <div v-if="stats && !loading" class="mt-8 text-center">
          <div class="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-slate-800/40 backdrop-blur-lg rounded-full px-6 py-3 border border-slate-700/50">
            <div class="flex items-center gap-2 text-sm text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last updated: {{ formatTimestamp(stats.generatedAt) }}</span>
            </div>
            <span class="hidden sm:inline text-slate-600">•</span>
            <div class="flex items-center gap-2 text-sm text-slate-400">
              <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Next refresh in {{ formatCountdown(timeUntilRefresh) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

interface SystemStats {
  clickHouseMetrics: {
    roundsTracked: number;
    playerMetricsTracked: number;
  };
  sqliteMetrics: {
    serversTracked: number;
    playersTracked: number;
  };
  generatedAt: string;
}

const stats = ref<SystemStats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const lastUpdate = ref<Date | null>(null);
const currentTime = ref(new Date());
let refreshInterval: number | null = null;
let clockInterval: number | null = null;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

const fetchStats = async () => {
  const wasInitialLoad = !stats.value;
  if (!wasInitialLoad) {
    loading.value = true;
  }
  error.value = null;

  try {
    const response = await fetch('/stats/app/systemstats');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    stats.value = data;
    lastUpdate.value = new Date();
  } catch (err) {
    console.error('Failed to fetch system stats:', err);
    error.value = err instanceof Error ? err.message : 'Failed to fetch system statistics';
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return 'refreshing...';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const timeUntilRefresh = computed(() => {
  if (!lastUpdate.value) return 0;

  const elapsed = currentTime.value.getTime() - lastUpdate.value.getTime();
  const remaining = REFRESH_INTERVAL - elapsed;

  return Math.max(0, remaining);
});

onMounted(() => {
  // Initial fetch
  fetchStats();

  // Set up auto-refresh every 5 minutes
  refreshInterval = window.setInterval(fetchStats, REFRESH_INTERVAL);

  // Update current time every second for countdown
  clockInterval = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  if (clockInterval) {
    clearInterval(clockInterval);
  }
});
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-1000 {
  animation-delay: 1s;
}
</style>
