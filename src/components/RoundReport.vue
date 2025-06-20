<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchRoundReport, fetchLiveServerData, RoundReport, LeaderboardSnapshot } from '../services/serverDetailsService';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Router
const router = useRouter();
const route = useRoute();

interface Props {
  serverGuid: string;
  mapName: string;
  startTime: string;
}

const props = defineProps<Props>();

const roundReport = ref<RoundReport | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedSnapshotIndex = ref(0);
const isPlaying = ref(false);
const playbackInterval = ref<NodeJS.Timeout | null>(null);
const playbackSpeed = ref(500); // milliseconds between snapshots (slower default for smoother playback)
const isDragging = ref(false);
const scrubberElement = ref<HTMLElement | null>(null);
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);
const isLiveUpdating = ref(false);
const selectedTeamTab = ref(0); // For mobile tabbed interface

// --- Player pinning state (now handles both pinning and focusing) ---
const pinnedPlayers = ref<Set<string>>(new Set(
  route.query.players ? 
    (typeof route.query.players === 'string' ? route.query.players.split(',') : route.query.players) :
    (route.query.player ? [route.query.player as string] : [])
));

function togglePlayerPin(playerName: string) {
  if (pinnedPlayers.value.has(playerName)) {
    pinnedPlayers.value.delete(playerName);
  } else {
    pinnedPlayers.value.add(playerName);
  }
  updateUrlWithPinnedPlayers();
}

function clearAllPinnedPlayers() {
  pinnedPlayers.value.clear();
  updateUrlWithPinnedPlayers();
}

function updateUrlWithPinnedPlayers() {
  const players = Array.from(pinnedPlayers.value);
  const newQuery = { ...route.query };
  
  // Remove legacy single player param
  delete newQuery.player;
  
  if (players.length > 0) {
    newQuery.players = players.join(',');
  } else {
    delete newQuery.players;
  }
  
  router.replace({ query: newQuery });
}

// Pinned players performance over time
const pinnedPlayersPerformance = computed(() => {
  if (!pinnedPlayers.value.size || !roundReport.value) return {};
  
  const performances: Record<string, any[]> = {};
  
  Array.from(pinnedPlayers.value).forEach(playerName => {
    performances[playerName] = roundReport.value!.leaderboardSnapshots.map((snap, idx) => {
      const entry = snap.entries.find(e => e.playerName === playerName);
      if (!entry) return null;
      return {
        snapshotIndex: idx,
        timestamp: snap.timestamp,
        ...entry
      };
    }).filter(Boolean);
  });
  
  return performances;
});

// Chart data for pinned players
const pinnedPlayersChartData = computed(() => {
  if (!pinnedPlayers.value.size || !roundReport.value) return { labels: [], datasets: [] };
  
  // Create labels from timestamps
  const labels = roundReport.value.leaderboardSnapshots.map((snap, idx) => 
    getElapsedTime(snap.timestamp)
  );
  
  // Generate a dataset for each pinned player
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
  const datasets = Array.from(pinnedPlayers.value).map((playerName, index) => {
    const performance = pinnedPlayersPerformance.value[playerName] || [];
    const data = roundReport.value!.leaderboardSnapshots.map((snap, idx) => {
      const entry = performance.find(p => p.snapshotIndex === idx);
      return entry ? entry.score : null;
    });
    
    // Create dynamic point styling based on current snapshot
    const pointRadii = data.map((_, idx) => idx === selectedSnapshotIndex.value ? 8 : 3);
    const pointBackgroundColors = data.map((_, idx) => 
      idx === selectedSnapshotIndex.value ? '#FFD700' : colors[index % colors.length]
    );
    const pointBorderColors = data.map((_, idx) => 
      idx === selectedSnapshotIndex.value ? '#FF6B00' : '#ffffff'
    );
    const pointBorderWidths = data.map((_, idx) => idx === selectedSnapshotIndex.value ? 3 : 2);
    
    return {
      label: playerName,
      backgroundColor: colors[index % colors.length] + '20',
      borderColor: colors[index % colors.length],
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: pointRadii,
      pointHoverRadius: 10,
      pointBackgroundColor: pointBackgroundColors,
      pointBorderColor: pointBorderColors,
      pointBorderWidth: pointBorderWidths,
      data
    };
  });
  
  return { labels, datasets };
});

// Chart options for pinned players
const pinnedPlayersChartOptions = computed(() => {
  // Get computed styles to access CSS variables - same approach as ServerDetails.vue
  const computedStyles = window.getComputedStyle(document.documentElement);
  const textColor = computedStyles.getPropertyValue('--color-text').trim() || '#333333';
  const textMutedColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#666666';
  const isDarkMode = computedStyles.getPropertyValue('--color-background').trim().includes('26, 16, 37') || 
                    document.documentElement.classList.contains('dark-mode') ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Dynamic grid color based on theme - same approach as ServerDetails.vue
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 300,
      easing: 'easeInOutQuad'
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: gridColor
        },
        title: {
          display: true,
          text: 'Score',
          color: textMutedColor,
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: textMutedColor,
          font: {
            weight: '500'
          }
        }
      },
      x: {
        grid: {
          color: gridColor
        },
        title: {
          display: true,
          text: 'Elapsed Time',
          color: textMutedColor,
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: textMutedColor,
          maxTicksLimit: 8,
          font: {
            weight: '500'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          font: {
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(35, 21, 53, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#ffffff' : '#ffffff',
        borderColor: isDarkMode ? '#805ad5' : '#666666',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            // Find the player performance data for additional info
            const playerName = context.dataset.label;
            const snapshotIndex = context.dataIndex;
            const performance = pinnedPlayersPerformance.value[playerName];
            if (performance) {
              const point = performance.find(p => p.snapshotIndex === snapshotIndex);
              if (point) {
                return `${playerName}: ${point.score} | ${point.kills} | ${point.deaths}`;
              }
            }
            return `${playerName}: ${context.parsed.y}`;
          }
        }
      }
    }
  };
});

// Fetch round report when component is mounted or when props change
const fetchData = async () => {
  if (!props.serverGuid || !props.mapName || !props.startTime) return;

  loading.value = true;
  error.value = null;

  try {
    // Fetch round report using the provided parameters
    const data = await fetchRoundReport(
      props.serverGuid,
      props.mapName,
      props.startTime
    );
    roundReport.value = data;
    selectedSnapshotIndex.value = data.leaderboardSnapshots.length - 1; // Default to final snapshot
    
    // Start auto-refresh if this is a live match
    if (data.round.isActive) {
      startAutoRefresh();
    }
  } catch (err) {
    console.error('Error fetching round report:', err);
    error.value = 'Failed to fetch round report';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// Format date to a readable format in the user's locale
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

  // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();

  // Format time without seconds
  const timeFormat = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  // Calculate the difference in days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Get day name
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];

  // Format date based on how recent it is
  if (diffDays === 0) {
    // Today
    return `Today at ${timeFormat}`;
  } else if (diffDays === 1) {
    // Yesterday
    return `Yesterday at ${timeFormat}`;
  } else if (diffDays < 7) {
    // Within the last week
    return `${dayName} at ${timeFormat}`;
  } else {
    // More than a week ago
    const formattedDate = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${formattedDate} at ${timeFormat} (${diffDays} days ago)`;
  }
};

// Format duration between start and end times
const formatDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (hours === 1) {
    return `${hours} hour ${remainingMinutes} minutes`;
  } else {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
};

// Calculate K/D ratio
const calculateKDR = (kills: number, deaths: number): string => {
  if (deaths === 0) return kills.toString();
  return (kills / deaths).toFixed(2);
};

// Get the currently selected leaderboard snapshot
const currentSnapshot = computed(() => {
  if (!roundReport.value || !roundReport.value.leaderboardSnapshots.length) return null;
  return roundReport.value.leaderboardSnapshots[selectedSnapshotIndex.value];
});

// Get snapshots formatted for the timeline selector
const snapshotTimeline = computed(() => {
  if (!roundReport.value) return [];
  
  return roundReport.value.leaderboardSnapshots.map((snapshot, index) => {
    let label = `${index + 1}`;
    if (index === 0) label = `Start`;
    else if (index === roundReport.value!.leaderboardSnapshots.length - 1) label = `End`;
    
    return {
      index,
      label,
      timestamp: snapshot.timestamp
    };
  });
});

// Removed player highlighting functionality as it no longer makes sense

// Playback controls
const startPlayback = () => {
  if (!roundReport.value || roundReport.value.leaderboardSnapshots.length <= 1) return;
  
  // If we're at the last snapshot, restart from the beginning
  if (selectedSnapshotIndex.value >= roundReport.value.leaderboardSnapshots.length - 1) {
    selectedSnapshotIndex.value = 0;
  }
  
  isPlaying.value = true;
  
  playbackInterval.value = setInterval(() => {
    if (selectedSnapshotIndex.value < roundReport.value!.leaderboardSnapshots.length - 1) {
      selectedSnapshotIndex.value++;
    } else {
      stopPlayback();
    }
  }, playbackSpeed.value);
};

const stopPlayback = () => {
  isPlaying.value = false;
  if (playbackInterval.value) {
    clearInterval(playbackInterval.value);
    playbackInterval.value = null;
  }
};

const resetPlayback = () => {
  stopPlayback();
  selectedSnapshotIndex.value = 0;
};

const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
};

const setPlaybackSpeed = (speed: number) => {
  playbackSpeed.value = speed;
  if (isPlaying.value) {
    stopPlayback();
    startPlayback();
  }
};

// Group leaderboard entries by team
const teamGroups = computed(() => {
  if (!currentSnapshot.value || !currentSnapshot.value.entries.length) return [];
  const groups = currentSnapshot.value.entries.reduce((acc, entry) => {
    if (!acc[entry.teamLabel]) acc[entry.teamLabel] = [];
    acc[entry.teamLabel].push(entry);
    return acc;
  }, {} as Record<string, typeof currentSnapshot.value.entries>);
  Object.values(groups).forEach(team => {
    // Pin pinned players at the top
    team.sort((a, b) => {
      if (pinnedPlayers.value.has(a.playerName) && !pinnedPlayers.value.has(b.playerName)) return -1;
      if (!pinnedPlayers.value.has(a.playerName) && pinnedPlayers.value.has(b.playerName)) return 1;
      return a.rank - b.rank;
    });
  });
  return Object.entries(groups).map(([teamName, players]) => ({
    teamName,
    players,
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    totalKills: players.reduce((sum, player) => sum + player.kills, 0),
    totalDeaths: players.reduce((sum, player) => sum + player.deaths, 0)
  })).sort((a, b) => a.teamName.localeCompare(b.teamName));
});

// Cleanup on unmount - ensure all intervals are cleared
onUnmounted(() => {
  stopPlayback();
  stopAutoRefresh();
  // Clean up drag state if component unmounts during drag
  if (isDragging.value) {
    stopDrag();
  }
});

const sampledDots = computed(() => {
  const maxDots = 20; // Maximum number of dots to display
  const totalSnapshots = snapshotTimeline.value.length;
  
  if (totalSnapshots <= maxDots) {
    return snapshotTimeline.value;
  }
  
  // Sample dots evenly
  const step = Math.floor(totalSnapshots / maxDots);
  const dots = [];
  for (let i = 0; i < totalSnapshots; i += step) {
    dots.push(snapshotTimeline.value[i]);
  }
  
  // Ensure the last snapshot is included
  if (dots[dots.length - 1].index !== totalSnapshots - 1) {
    dots.push(snapshotTimeline.value[totalSnapshots - 1]);
  }
  
  return dots;
});

const handleDotClick = (index: number) => {
  stopPlayback();
  selectedSnapshotIndex.value = index;
};

const startDrag = (event: MouseEvent) => {
  event.preventDefault(); // Prevent text selection
  isDragging.value = true;
  scrubberElement.value = event.currentTarget as HTMLElement;
  stopPlayback();
  updateSnapshotIndex(event);
  
  // Add dragging class to body for visual feedback
  document.body.classList.add('dragging');
  
  // Add event listeners to document for smooth dragging
  document.addEventListener('mousemove', handleDrag, { passive: false });
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('selectstart', preventSelection); // Prevent text selection during drag
};

const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value || !scrubberElement.value) return;
  event.preventDefault(); // Prevent text selection
  updateSnapshotIndex(event);
};

const stopDrag = () => {
  isDragging.value = false;
  scrubberElement.value = null;
  
  // Remove dragging class from body
  document.body.classList.remove('dragging');
  
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('selectstart', preventSelection);
};

const preventSelection = (event: Event) => {
  event.preventDefault();
};

const updateSnapshotIndex = (event: MouseEvent) => {
  if (!scrubberElement.value) return;
  
  const rect = scrubberElement.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = Math.min(Math.max(x / rect.width, 0), 1);
  
  // Find the closest dot
  const closestDotIndex = Math.round(percent * (sampledDots.value.length - 1));
  selectedSnapshotIndex.value = sampledDots.value[closestDotIndex].index;
};

// Calculate elapsed time from round start
const getElapsedTime = (timestamp: string): string => {
  if (!roundReport.value) return '+0m';
  
  const roundStart = new Date(roundReport.value.round.startTime);
  const snapshotTime = new Date(timestamp);
  const diffMs = snapshotTime.getTime() - roundStart.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `+${hours}h ${minutes}m`;
  } else {
    return `+${totalMinutes}m`;
  }
};

// Get current snapshot elapsed time
const currentElapsedTime = computed(() => {
  if (!currentSnapshot.value) return '0:00';
  return getElapsedTime(currentSnapshot.value.timestamp);
});

// Auto-refresh for live matches
const startAutoRefresh = () => {
  if (autoRefreshInterval.value) return;
  
  isLiveUpdating.value = true;
  autoRefreshInterval.value = setInterval(async () => {
    if (roundReport.value?.round.isActive && roundReport.value?.session) {
      try {
        // Fetch live leaderboard data from BFList API
        const liveServerData = await fetchLiveServerData(
          roundReport.value.session.gameId,
          roundReport.value.session.serverIp,
          roundReport.value.session.serverPort
        );
        
        // Guard: Check if map has changed - if so, stop auto-refresh
        if (liveServerData.mapName !== roundReport.value.round.mapName) {
          console.log('Map changed from', roundReport.value.round.mapName, 'to', liveServerData.mapName, '- stopping live updates');
          // Mark the round as no longer active since it has ended
          roundReport.value.round.isActive = false;
          stopAutoRefresh();
          return;
        }
        
        // Convert BFList API response to LeaderboardSnapshot format
        // First, sort players by score (descending) to fix ordering
        const sortedPlayers = liveServerData.players.sort((a, b) => b.score - a.score);
        
        const liveSnapshot: LeaderboardSnapshot = {
          timestamp: new Date().toISOString(),
          entries: sortedPlayers.map((player, index) => {
            // Handle empty teamLabel by looking it up in teams array
            let teamLabel = player.teamLabel;
            if (!teamLabel && liveServerData.teams && typeof player.team === 'number') {
              const team = liveServerData.teams.find(t => t.index === player.team);
              teamLabel = team?.label || 'Unknown';
            }
            
            return {
              rank: index + 1, // Now correctly ranked by score order
              playerName: player.name,
              score: player.score,
              kills: player.kills,
              deaths: player.deaths,
              ping: player.ping,
              teamLabel: teamLabel
            };
          })
        };
        
        // Update the latest snapshot with live data
        if (roundReport.value && roundReport.value.leaderboardSnapshots.length > 0) {
          const lastIndex = roundReport.value.leaderboardSnapshots.length - 1;
          roundReport.value.leaderboardSnapshots[lastIndex] = liveSnapshot;
          
          // If user is viewing the latest snapshot, it will auto-update
          if (selectedSnapshotIndex.value === lastIndex) {
            // The computed currentSnapshot will automatically reflect the new data
          }
        }
      } catch (err) {
        console.error('Error fetching live leaderboard data:', err);
        // Mark the round as no longer active since live updates are failing
        if (roundReport.value) {
          roundReport.value.round.isActive = false;
        }
        stopAutoRefresh();
      }
    } else {
      stopAutoRefresh();
    }
  }, 10000); // 10 seconds for live updates
};

const stopAutoRefresh = () => {
  isLiveUpdating.value = false;
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};

const goBack = () => {
  // Use native browser back functionality
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Fallback to servers page if no history
    router.push('/servers');
  }
};
</script>

<template>
  <div class="round-report-container">
    <div class="round-report-header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back
        </button>
        <div class="header-titles" v-if="roundReport">
          <h2>🗺️ {{ roundReport.round.mapName }}</h2>
          <router-link 
            :to="'/servers/' + encodeURIComponent(roundReport.session.serverName)" 
            class="server-name-header"
          >
            {{ roundReport.session.serverName }}
          </router-link>
        </div>
        <h2 v-else>Round Report</h2>
      </div>
    </div>
    <div class="round-report-body">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading round report...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
      </div>
      <div v-else-if="roundReport" class="details-container">

        
        <!-- Consolidated Leaderboard Section with Session Details -->
        <div v-if="currentSnapshot && teamGroups.length" class="leaderboard-section">
          <!-- Performance Chart for Pinned Players -->
          <div v-if="pinnedPlayers.size > 0" class="performance-chart-section">
            <div class="pinned-players-info">
              <h3>📌 Pinned Players Performance</h3>
              <div class="pinned-players-badges">
                <div v-for="playerName in Array.from(pinnedPlayers)" :key="playerName" class="pinned-player-badge">
                  {{ playerName }}
                </div>
                <button v-if="pinnedPlayers.size > 1" class="clear-all-button" @click="clearAllPinnedPlayers" title="Clear all pinned players">
                  Clear All
                </button>
              </div>
            </div>
            
            <div v-if="pinnedPlayersChartData.datasets.length > 0" class="performance-chart-container">
              <div class="chart-wrapper" :class="{ 'playing': isPlaying }">
                <Line :data="pinnedPlayersChartData" :options="pinnedPlayersChartOptions" />
              </div>
            </div>
          </div>
          
          <div class="leaderboard-header">
            <div class="match-info">
              <div class="match-meta">
                <span class="game-id">#{{ roundReport.session.gameId }}</span>
                <span class="separator">•</span>
                <span class="match-time">{{ formatDate(roundReport.round.startTime) }}</span>
                <span v-if="roundReport.round.isActive" class="status-badge active" :class="{ 'live-updating': isLiveUpdating }">
                  Live
                  <span v-if="isLiveUpdating" class="live-dot"></span>
                </span>
              </div>
            </div>
            <div class="header-controls">
            </div>
          </div>
          
          <div v-if="snapshotTimeline.length > 1" class="timeline-section">
            <div class="timeline-header">
              <div class="instructions-text">Click play to watch the match unfold, or drag through the timeline</div>
              <div class="timeline-controls-compact">
                <div class="compact-playback">
                  <button @click="resetPlayback" class="mini-button" title="Reset">⏮️</button>
                  <button @click="togglePlayback" class="mini-button play-mini" :class="{ playing: isPlaying }" title="Play/Pause">
                    {{ isPlaying ? '⏸️' : '▶️' }}
                  </button>
                  <select v-model="playbackSpeed" @change="setPlaybackSpeed(playbackSpeed)" class="mini-select">
                    <option :value="500">0.5x</option>
                    <option :value="250">1x</option>
                    <option :value="150" selected>2x</option>
                    <option :value="75">4x</option>
                  </select>
                  <span v-if="isPlaying" class="mini-indicator">🔴</span>
                </div>
                
                <div class="elapsed-badge">
                  {{ currentElapsedTime }}
                </div>
              </div>
            </div>
            
            <div class="timeline-scrubber">
              <div 
                class="mini-progress-bar"
                @mousedown="startDrag"
              >
                <div 
                  class="mini-progress-fill"
                  :style="{ width: `${(selectedSnapshotIndex / Math.max(snapshotTimeline.length - 1, 1)) * 100}%` }"
                ></div>
                <div class="scrubber-dots">
                  <div 
                    v-for="(dot, index) in sampledDots" 
                    :key="index"
                    class="scrubber-dot"
                    :class="{ 'active-dot': index === selectedSnapshotIndex }"
                    :title="`${getElapsedTime(dot.timestamp)} elapsed`"
                    @click="handleDotClick(dot.index)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mobile Team Tabs -->
          <div class="mobile-team-tabs">
            <div class="tab-buttons">
              <button 
                v-for="(team, index) in teamGroups" 
                :key="team.teamName"
                class="tab-button"
                :class="{ 'active': selectedTeamTab === index }"
                @click="selectedTeamTab = index"
              >
                <span class="team-icon">🛡️</span>
                {{ team.teamName }}
                <span class="team-score-badge">{{ team.totalScore.toLocaleString() }}</span>
              </button>
            </div>
            <div class="tab-content">
              <div 
                v-for="(team, index) in teamGroups" 
                :key="team.teamName"
                v-show="selectedTeamTab === index"
                class="team-column mobile-tab-panel"
                :class="`team-${team.teamName.toLowerCase()}`"
              >
                <!-- Team Header -->
                <div class="team-header">
                  <div class="team-name">
                    <span class="team-icon">🛡️</span>
                    {{ team.teamName }}
                  </div>
                  <div class="team-stats">
                    <div class="team-stat">
                      <span class="stat-label">Score</span>
                      <span class="stat-value">{{ team.totalScore.toLocaleString() }}</span>
                    </div>
                    <div class="team-stat">
                      <span class="stat-label"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></span>
                      <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Team Players -->
                <div class="team-players">
                  <div class="players-header">
                    <div class="header-rank">#</div>
                    <div class="header-player">Player</div>
                    <div class="header-score">Score</div>
                    <div class="header-kd"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></div>
                    <div class="header-ping">Ping</div>
                  </div>
                  
                  <div class="players-list">
                    <div
                      v-for="player in team.players"
                      :key="player.playerName"
                      class="player-row"
                      :class="{
                        'top-player': player.rank === 1,
                        'pinned-player-row': pinnedPlayers.has(player.playerName)
                      }"
                    >
                      <div class="player-rank">
                        <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                        <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                        <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                        <span v-else class="rank-number">{{ player.rank }}</span>
                      </div>
                      <div class="player-name">
                        <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                          {{ player.playerName }}
                        </router-link>
                        <button
                          class="pin-player-btn"
                          :title="pinnedPlayers.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                          @click.stop="togglePlayerPin(player.playerName)"
                        >
                          <span v-if="pinnedPlayers.has(player.playerName)">📌</span>
                          <span v-else>📍</span>
                        </button>
                        <span v-if="pinnedPlayers.has(player.playerName)" class="pinned-badge">Pinned</span>
                      </div>
                      <div class="player-score">{{ player.score.toLocaleString() }}</div>
                      <div class="player-kd">
                        <div class="kd-section">
                          <span class="kd-label"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></span>
                          <span class="kd-values">
                            <span class="kills">{{ player.kills }}</span>
                            <span class="separator">/</span>
                            <span class="deaths">{{ player.deaths }}</span>
                          </span>
                        </div>
                        <div class="ping-section">
                          <span class="ping-label">Ping:</span>
                          <span class="player-ping" :class="{ 
                            'ping-good': player.ping < 50, 
                            'ping-ok': player.ping >= 50 && player.ping < 100,
                            'ping-bad': player.ping >= 100
                          }">
                            {{ player.ping }}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Teams Grid -->
          <div class="teams-container">
            <div 
              v-for="team in teamGroups" 
              :key="team.teamName"
              class="team-column"
              :class="`team-${team.teamName.toLowerCase()}`"
            >
              <!-- Team Header -->
              <div class="team-header">
                <div class="team-name">
                  <span class="team-icon">🛡️</span>
                  {{ team.teamName }}
                </div>
                <div class="team-stats">
                  <div class="team-stat">
                    <span class="stat-label">Score</span>
                    <span class="stat-value">{{ team.totalScore.toLocaleString() }}</span>
                  </div>
                  <div class="team-stat">
                    <span class="stat-label"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></span>
                    <span class="stat-value">{{ calculateKDR(team.totalKills, team.totalDeaths) }}</span>
                  </div>
                </div>
              </div>

              <!-- Team Players -->
              <div class="team-players">
                <div class="players-header">
                  <div class="header-rank">#</div>
                  <div class="header-player">Player</div>
                  <div class="header-score">Score</div>
                  <div class="header-kd"><img src="@/assets/kdr.png" alt="KDR" class="kdr-icon" /></div>
                  <div class="header-ping">Ping</div>
                </div>
                
                <div class="players-list">
                  <div
                    v-for="player in team.players"
                    :key="player.playerName"
                    class="player-row"
                    :class="{
                      'top-player': player.rank === 1,
                      'pinned-player-row': pinnedPlayers.has(player.playerName)
                    }"
                  >
                    <div class="player-rank">
                      <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                      <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                      <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                      <span v-else class="rank-number">{{ player.rank }}</span>
                    </div>
                    <div class="player-name">
                      <router-link :to="`/players/${encodeURIComponent(player.playerName)}`" class="player-link">
                        {{ player.playerName }}
                      </router-link>
                      <button
                        class="pin-player-btn"
                        :title="pinnedPlayers.has(player.playerName) ? 'Unpin & remove from chart' : 'Pin to top & show in chart'"
                        @click.stop="togglePlayerPin(player.playerName)"
                      >
                        <span v-if="pinnedPlayers.has(player.playerName)">📌</span>
                        <span v-else>📍</span>
                      </button>
                      <span v-if="pinnedPlayers.has(player.playerName)" class="pinned-badge">Pinned</span>
                    </div>
                    <div class="player-score">{{ player.score.toLocaleString() }}</div>
                    <div class="player-kd">
                      <span class="kills">{{ player.kills }}</span>
                      <span class="separator">/</span>
                      <span class="deaths">{{ player.deaths }}</span>
                    </div>
                    <div class="player-ping" :class="{
                      'ping-good': player.ping < 50,
                      'ping-ok': player.ping >= 50 && player.ping < 100,
                      'ping-bad': player.ping >= 100
                    }">
                      {{ player.ping }}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data-container">
        <p>No round report available.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.round-report-container {
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

.round-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-background-mute);
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.back-button:hover {
  background-color: var(--color-primary);
  color: white;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-titles h2 {
  margin: 0;
  color: var(--color-heading);
}

.server-name-header {
  font-size: 0.9rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.server-name-header:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.loading-container, .error-container, .no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ff5252;
  font-weight: bold;
}

.details-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.leaderboard-section {
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--color-border);
}

.match-info {
  flex: 1;
}

.header-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.compact-playback {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-background);
  padding: 4px 8px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.mini-button {
  padding: 4px 6px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
}

.mini-button:hover {
  background: var(--color-background-mute);
}

.play-mini.playing {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.mini-select {
  padding: 2px 4px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.75rem;
  cursor: pointer;
  min-width: 45px;
}

.mini-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.mini-indicator {
  color: #ff4444;
  font-size: 0.7rem;
  animation: blink 1.5s infinite alternate;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.timeline-section {
  margin: 20px 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.timeline-controls-compact {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-scrubber {
  width: 100%;
}

.mini-progress-bar {
  width: 100%;
  height: 20px;
  background: var(--color-background-mute);
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  user-select: none; /* Prevent text selection */
}

.mini-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.scrubber-dots {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transform: translateY(-50%);
  pointer-events: none;
  padding: 0 10px;
}

.scrubber-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid rgba(0, 0, 0, 0.3);
  opacity: 0.8;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
  z-index: 2;
}

.scrubber-dot:hover, .active-dot {
  opacity: 1;
  transform: scale(1.3);
  border-color: rgba(0, 0, 0, 0.5);
}

/* Improve dragging experience */
.mini-progress-bar:active {
  cursor: grabbing;
}

body.dragging {
  user-select: none;
  cursor: grabbing !important;
}

body.dragging * {
  cursor: grabbing !important;
}

/* Mobile Team Tabs - Hidden on desktop */
.mobile-team-tabs {
  display: none;
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-column {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
}

.team-header {
  padding: 15px;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.team-name {
  font-weight: bold;
  color: var(--color-heading);
}

.team-stats {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.team-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-weight: bold;
  color: var(--color-primary);
}

.team-players {
  padding: 0;
}

.players-header {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
  gap: 10px;
  padding: 12px 15px;
  background: var(--color-background-mute);
  font-size: 0.8rem;
  font-weight: 600;
}

.players-list {
  overflow-y: auto;
}

.player-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border);
}

.player-row:hover {
  background: var(--color-background-soft);
}

.player-row.top-player {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.player-rank {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-medal {
  font-size: 1.2rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.rank-number {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-name {
  font-weight: 500;
}

.player-link {
  color: var(--color-primary);
  text-decoration: none;
}

.player-link:hover {
  text-decoration: underline;
}

.player-score {
  text-align: center;
}

.player-kd {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.kills {
  color: #4caf50;
  font-weight: 600;
}

.separator {
  color: var(--color-text-muted);
}

.deaths {
  color: #f44336;
  font-weight: 600;
}

.player-ping {
  text-align: center;
}

.ping-good {
  background: rgba(76, 175, 80, 0.2);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.4);
  font-weight: 600;
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #e65100;
  border: 1px solid rgba(255, 152, 0, 0.4);
  font-weight: 600;
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.4);
  font-weight: 600;
}

/* Dark mode ping styling */
@media (prefers-color-scheme: dark) {
  .ping-good {
    background: rgba(76, 175, 80, 0.3);
    color: #81c784;
    border: 1px solid rgba(76, 175, 80, 0.5);
  }

  .ping-ok {
    background: rgba(255, 152, 0, 0.3);
    color: #ffb74d;
    border: 1px solid rgba(255, 152, 0, 0.5);
  }

  .ping-bad {
    background: rgba(244, 67, 54, 0.3);
    color: #e57373;
    border: 1px solid rgba(244, 67, 54, 0.5);
  }
}

html[data-theme="dark"] .ping-good,
.dark-mode .ping-good {
  background: rgba(76, 175, 80, 0.3);
  color: #81c784;
  border: 1px solid rgba(76, 175, 80, 0.5);
}

html[data-theme="dark"] .ping-ok,
.dark-mode .ping-ok {
  background: rgba(255, 152, 0, 0.3);
  color: #ffb74d;
  border: 1px solid rgba(255, 152, 0, 0.5);
}

html[data-theme="dark"] .ping-bad,
.dark-mode .ping-bad {
  background: rgba(244, 67, 54, 0.3);
  color: #e57373;
  border: 1px solid rgba(244, 67, 54, 0.5);
}

@media (max-width: 768px) {
  .teams-container {
    grid-template-columns: 1fr;
  }
  
  .players-header,
  .player-row {
    grid-template-columns: 30px 1fr 60px 50px 50px;
    padding: 10px 12px;
  }
}

.elapsed-badge {
  background: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.instructions-text {
  background: var(--color-background-mute);
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.match-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: transparent;
  padding: 4px 0;
  border-radius: 0;
  border: none;
}

.game-id {
  background: var(--color-background-mute);
  color: var(--color-text-muted);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
}

.separator {
  opacity: 0.6;
  user-select: none;
  color: var(--color-text-muted);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.status-badge.active {
  background-color: #4CAF50;
}

.status-badge.completed {
  background-color: #757575;
}

.status-badge.live-updating {
  background: linear-gradient(45deg, #4CAF50, #66BB6A);
  animation: live-pulse 2s ease-in-out infinite;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  animation: live-blink 1.5s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { 
    background: linear-gradient(45deg, #4CAF50, #66BB6A);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  50% { 
    background: linear-gradient(45deg, #66BB6A, #81C784);
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0);
  }
}

@keyframes live-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

/* Base mobile improvements */
.round-report-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .teams-container {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
  }
  
  .round-report-container {
    padding: 15px;
  }
  
  .leaderboard-section {
    padding: 15px;
    margin-bottom: 15px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .round-report-container {
    padding: 4px;
  }

  /* Remove leaderboard container styling on mobile */
  .leaderboard-section {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    margin-bottom: 12px;
  }

  /* Show mobile tabs, hide desktop grid */
  .mobile-team-tabs {
    display: block;
  }

  .teams-container {
    display: none;
  }

  /* Mobile tab styles */
  .tab-buttons {
    display: flex;
    background: var(--color-background-mute);
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 12px;
    gap: 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 6px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 80px;
    white-space: nowrap;
  }

  .tab-button.active {
    background: var(--color-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .tab-button:hover:not(.active) {
    background: var(--color-background-soft);
    color: var(--color-text);
  }

  .team-score-badge {
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .tab-button.active .team-score-badge {
    opacity: 1;
  }

  .tab-content {
    min-height: 400px;
  }

  .mobile-tab-panel {
    width: 100%;
    margin: 0;
  }

  .round-report-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    margin-bottom: 12px;
    padding-bottom: 8px;
  }

  .header-left {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .header-titles h2 {
    font-size: 1.3rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .back-button {
    width: fit-content;
    padding: 6px 10px;
  }

  .leaderboard-header {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .timeline-section {
    margin: 15px 0;
  }

  .timeline-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    margin-bottom: 8px;
  }

  .timeline-controls-compact {
    justify-content: center;
    gap: 8px;
  }

  .instructions-text {
    font-size: 0.75rem;
    text-align: center;
    padding: 4px 8px;
  }

  .team-header {
    padding: 12px;
  }

  .team-stats {
    gap: 12px;
  }

  /* Mobile leaderboard layout - two rows per player */
  .players-header {
    display: grid;
    grid-template-columns: 30px 1fr 70px;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.75rem;
  }

  .header-kd,
  .header-ping {
    display: none;
  }

  .player-row {
    display: grid;
    grid-template-columns: 30px 1fr 70px;
    gap: 8px;
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .player-row .player-kd,
  .player-row .player-ping {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    margin-top: 4px;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    border-top: 1px solid var(--color-border);
  }

  .player-row .player-kd {
    border-top: none;
    justify-content: space-between;
    gap: 8px;
    background: var(--color-background-mute);
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 6px;
  }

  .kd-section,
  .ping-section {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ping-section {
    align-items: center;
  }

  .kd-label,
  .ping-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1;
  }

  .ping-label {
    padding: 2px 0;
  }

  .kd-values {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  /* Preserve ping styling in mobile layout */
  .player-row .player-ping {
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
    text-align: center;
  }

  .player-row .player-ping.ping-good {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  .player-row .player-ping.ping-ok {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }

  .player-row .player-ping.ping-bad {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }

  .rank-medal {
    font-size: 1.1rem;
  }

  .rank-number {
    width: 22px;
    height: 22px;
    font-size: 0.8rem;
  }

  .match-meta {
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  .game-id {
    font-size: 0.65rem;
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 2px 6px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .round-report-container {
    padding: 2px;
  }

  /* Ensure mobile tabs are shown and desktop grid is hidden */
  .mobile-team-tabs {
    display: block;
  }

  .teams-container {
    display: none;
  }

  /* Smaller tab buttons for small screens */
  .tab-button {
    font-size: 0.75rem;
    padding: 6px 4px;
    min-width: 70px;
  }

  .team-score-badge {
    font-size: 0.65rem;
  }

  .tab-content {
    min-height: 350px;
  }

  .round-report-header {
    gap: 6px;
    margin-bottom: 8px;
    padding-bottom: 6px;
  }

  .header-titles h2 {
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .back-button {
    padding: 5px 8px;
    font-size: 0.9rem;
  }

  .leaderboard-header {
    margin-bottom: 8px;
    padding-bottom: 6px;
  }

  .timeline-section {
    margin: 10px 0;
  }

  .timeline-header {
    gap: 6px;
    margin-bottom: 6px;
  }

  .instructions-text {
    font-size: 0.7rem;
    padding: 3px 6px;
  }

  .compact-playback {
    padding: 3px 6px;
    gap: 4px;
  }

  .mini-button {
    padding: 3px 5px;
    font-size: 0.9rem;
  }

  .mini-select {
    font-size: 0.7rem;
    padding: 1px 3px;
    min-width: 40px;
  }

  .elapsed-badge {
    font-size: 0.7rem;
    padding: 3px 6px;
  }

  .team-header {
    padding: 8px;
  }

  .team-name {
    font-size: 0.9rem;
  }

  .team-stats {
    gap: 8px;
    margin-top: 6px;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-value {
    font-size: 0.8rem;
  }

  .players-header {
    grid-template-columns: 25px 1fr 60px;
    gap: 6px;
    padding: 6px 8px;
    font-size: 0.7rem;
  }

  .player-row {
    grid-template-columns: 25px 1fr 60px;
    gap: 6px;
    padding: 8px;
    font-size: 0.85rem;
  }

  .player-row .player-kd {
    font-size: 0.75rem;
    gap: 6px;
  }

  .kd-label,
  .ping-label {
    font-size: 0.65rem;
  }

  .rank-medal {
    font-size: 1rem;
  }

  .rank-number {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }

  .player-link {
    font-size: 0.85rem;
  }

  .player-score, .player-kd, .player-ping {
    font-size: 0.8rem;
  }

  .match-meta {
    font-size: 0.7rem;
    gap: 3px;
  }

  .game-id {
    font-size: 0.6rem;
    padding: 1px 3px;
  }

  .status-badge {
    font-size: 0.7rem;
    padding: 1px 4px;
  }

  .mini-progress-bar {
    height: 16px;
  }

  .scrubber-dot {
    width: 12px;
    height: 12px;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .round-report-container {
    padding: 2px;
  }

  /* Ensure mobile tabs are shown and desktop grid is hidden */
  .mobile-team-tabs {
    display: block;
  }

  .teams-container {
    display: none;
  }

  /* Even smaller tab buttons for extra small screens */
  .tab-button {
    font-size: 0.7rem;
    padding: 5px 3px;
    min-width: 60px;
  }

  .team-score-badge {
    font-size: 0.6rem;
  }

  .tab-content {
    min-height: 300px;
  }

  .round-report-header {
    gap: 4px;
    margin-bottom: 6px;
    padding-bottom: 4px;
  }

  .header-titles h2 {
    font-size: 1.1rem;
  }

  .back-button {
    padding: 4px 6px;
    font-size: 0.85rem;
  }

  .leaderboard-header {
    margin-bottom: 6px;
    padding-bottom: 4px;
  }

  .timeline-section {
    margin: 8px 0;
  }

  .timeline-header {
    gap: 4px;
    margin-bottom: 4px;
  }

  .instructions-text {
    font-size: 0.65rem;
    padding: 2px 4px;
  }

  .team-header {
    padding: 6px;
  }

  .team-name {
    font-size: 0.85rem;
  }

  .team-stats {
    gap: 6px;
    margin-top: 4px;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .stat-value {
    font-size: 0.75rem;
  }

  .players-header {
    grid-template-columns: 22px 1fr 55px;
    gap: 4px;
    padding: 4px 6px;
    font-size: 0.65rem;
  }

  .player-row {
    grid-template-columns: 22px 1fr 55px;
    gap: 4px;
    padding: 6px;
    font-size: 0.8rem;
  }

  .player-row .player-kd {
    font-size: 0.7rem;
    gap: 4px;
  }

  .kd-label,
  .ping-label {
    font-size: 0.6rem;
  }

  .rank-medal {
    font-size: 0.9rem;
  }

  .rank-number {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }

  .player-link {
    font-size: 0.8rem;
  }

  .player-score, .player-kd, .player-ping {
    font-size: 0.75rem;
  }

  .match-meta {
    font-size: 0.65rem;
    gap: 2px;
  }

  .game-id {
    font-size: 0.55rem;
    padding: 1px 2px;
  }

  .status-badge {
    font-size: 0.65rem;
    padding: 1px 3px;
  }

  .compact-playback {
    padding: 2px 4px;
    gap: 3px;
  }

  .mini-button {
    padding: 2px 4px;
    font-size: 0.8rem;
  }

  .mini-select {
    font-size: 0.65rem;
    padding: 1px 2px;
    min-width: 35px;
  }

  .elapsed-badge {
    font-size: 0.65rem;
    padding: 2px 4px;
  }

  .mini-progress-bar {
    height: 14px;
  }

  .scrubber-dot {
    width: 10px;
    height: 10px;
  }
}

/* Mobile responsive styles for performance chart */
@media (max-width: 768px) {
  .performance-chart-section {
    padding: 8px;
  }
  
  .pinned-players-info h3 {
    font-size: 0.9rem;
  }
  
  .pinned-players-badges {
    justify-content: center;
  }
  
  .chart-wrapper {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .pinned-player-badge {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
  
  .clear-all-button {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .chart-wrapper {
    height: 120px;
  }
}

.kdr-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 4px;
}

.player-row.pinned-player-row {
  background: linear-gradient(90deg, #ffe082 0%, #fffde7 100%);
  border-left: 4px solid #ffd600;
  color: #1a1a1a;
}

/* Dark mode pinned player styling - keep original background, just fix text contrast */
@media (prefers-color-scheme: dark) {
  .player-row.pinned-player-row {
    color: #1a1a1a;
  }
  
  .player-row.pinned-player-row .player-link {
    color: #1a1a1a;
    font-weight: 600;
  }
  
  .player-row.pinned-player-row .player-score {
    color: #1a1a1a;
    font-weight: 600;
  }
  
  .player-row.pinned-player-row .kills,
  .player-row.pinned-player-row .deaths {
    color: #1a1a1a;
    font-weight: 600;
  }
}

/* CSS variable based dark mode detection */
html[data-theme="dark"] .player-row.pinned-player-row,
.dark-mode .player-row.pinned-player-row {
  color: #1a1a1a;
}

html[data-theme="dark"] .player-row.pinned-player-row .player-link,
.dark-mode .player-row.pinned-player-row .player-link {
  color: #1a1a1a;
  font-weight: 600;
}

html[data-theme="dark"] .player-row.pinned-player-row .player-score,
.dark-mode .player-row.pinned-player-row .player-score {
  color: #1a1a1a;
  font-weight: 600;
}

html[data-theme="dark"] .player-row.pinned-player-row .kills,
html[data-theme="dark"] .player-row.pinned-player-row .deaths,
.dark-mode .player-row.pinned-player-row .kills,
.dark-mode .player-row.pinned-player-row .deaths {
  color: #1a1a1a;
  font-weight: 600;
}

/* Ensure ping badges maintain proper contrast inside pinned rows */
.player-row.pinned-player-row .ping-good,
.player-row.pinned-player-row .ping-ok,
.player-row.pinned-player-row .ping-bad {
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  border: 1px solid rgba(0, 0, 0, 0.2);
  font-weight: 700;
}

/* Dark mode ping badges in pinned rows */
@media (prefers-color-scheme: dark) {
  .player-row.pinned-player-row .ping-good,
  .player-row.pinned-player-row .ping-ok,
  .player-row.pinned-player-row .ping-bad {
    background: rgba(255, 255, 255, 0.9);
    color: #1a1a1a;
    border: 1px solid rgba(0, 0, 0, 0.2);
    font-weight: 700;
  }
}

html[data-theme="dark"] .player-row.pinned-player-row .ping-good,
html[data-theme="dark"] .player-row.pinned-player-row .ping-ok,
html[data-theme="dark"] .player-row.pinned-player-row .ping-bad,
.dark-mode .player-row.pinned-player-row .ping-good,
.dark-mode .player-row.pinned-player-row .ping-ok,
.dark-mode .player-row.pinned-player-row .ping-bad {
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a1a;
  border: 1px solid rgba(0, 0, 0, 0.2);
  font-weight: 700;
}
.pinned-badge {
  background: #ffd600;
  color: #000;
  border-radius: 6px;
  padding: 2px 6px;
  margin-left: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Dark mode pinned badge styling */
@media (prefers-color-scheme: dark) {
  .pinned-badge {
    background: #ffd700;
    color: #1a1a1a;
  }
}

html[data-theme="dark"] .pinned-badge,
.dark-mode .pinned-badge {
  background: #ffd700;
  color: #1a1a1a;
}
.pin-player-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 6px;
  font-size: 1rem;
  color: #ffd600;
  transition: color 0.2s;
}
.pin-player-btn:hover {
  color: #ffab00;
}

.performance-chart-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.pinned-players-info {
  margin-bottom: 12px;
}

.pinned-players-info h3 {
  margin: 0 0 8px 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.pinned-players-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pinned-player-badge {
  background: #ffd600;
  color: #000;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.clear-all-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--color-text);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-button:hover {
  background: var(--color-background-mute);
}

.performance-chart-container {
  background: var(--color-background);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
}

/* Ensure chart container has proper contrast in both modes */
@media (prefers-color-scheme: dark) {
  .performance-chart-container {
    background: rgba(255, 255, 255, 0.05);
  }
}

html[data-theme="dark"] .performance-chart-container,
.dark-mode .performance-chart-container {
  background: rgba(255, 255, 255, 0.05);
}

.chart-wrapper {
  height: 200px;
  position: relative;
}

/* Clean chart styling without overall glow effects */
.chart-wrapper canvas {
  /* No special effects - let the data points do the talking */
}

</style>
