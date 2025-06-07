<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchRoundReport, fetchLiveServerData, RoundReport, LeaderboardSnapshot } from '../services/serverDetailsService';

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
    if (!acc[entry.teamLabel]) {
      acc[entry.teamLabel] = [];
    }
    acc[entry.teamLabel].push(entry);
    return acc;
  }, {} as Record<string, typeof currentSnapshot.value.entries>);
  
  // Sort each team by rank
  Object.values(groups).forEach(team => {
    team.sort((a, b) => a.rank - b.rank);
  });
  
  return Object.entries(groups).map(([teamName, players]) => ({
    teamName,
    players,
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    totalKills: players.reduce((sum, player) => sum + player.kills, 0),
    totalDeaths: players.reduce((sum, player) => sum + player.deaths, 0)
  })); // No sorting - just display teams as they are
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
  router.back();
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
          <div class="leaderboard-header">
            <div class="match-info">
              <div class="match-meta">
                <span class="game-id">#{{ roundReport.session.gameId }}</span>
                <span class="separator">•</span>
                <span class="match-time">{{ formatDate(roundReport.round.startTime) }}</span>
                <span class="separator">•</span>
                <span v-if="roundReport.round.isActive" class="status-badge active" :class="{ 'live-updating': isLiveUpdating }">
                  Live
                  <span v-if="isLiveUpdating" class="live-dot"></span>
                </span>
                <span v-else class="status-badge completed">Match Complete</span>
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
                    <span class="stat-label">K/D</span>
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
                  <div class="header-kd">K/D</div>
                  <div class="header-ping">Ping</div>
                </div>
                
                <div class="players-list">
                  <div
                    v-for="player in team.players"
                    :key="player.playerName"
                    class="player-row"
                    :class="{ 
                      'top-player': player.rank === 1
                    }"
                  >
                    <div class="player-rank">
                      <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                      <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                      <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                      <span v-else class="rank-number">{{ player.rank }}</span>
                    </div>
                    <div class="player-name">
                      <router-link :to="`/player/${encodeURIComponent(player.playerName)}`" class="player-link">
                        {{ player.playerName }}
                      </router-link>
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
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.back-button:hover {
  background-color: #5a6268;
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
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
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

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-column {
  background: #fff;
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

.player-row.current-player-row {
  background: linear-gradient(90deg, rgba(var(--color-primary-rgb, 33, 150, 243), 0.1) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%);
  border-left: 4px solid var(--color-primary);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { background: linear-gradient(90deg, rgba(var(--color-primary-rgb, 33, 150, 243), 0.1) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%); }
  50% { background: linear-gradient(90deg, rgba(var(--color-primary-rgb, 33, 150, 243), 0.15) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.08) 100%); }
  100% { background: linear-gradient(90deg, rgba(var(--color-primary-rgb, 33, 150, 243), 0.1) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%); }
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
  color: #4caf50;
}

.ping-ok {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.ping-bad {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
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
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-background-soft);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.game-id {
  background: var(--color-accent);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
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
</style>
