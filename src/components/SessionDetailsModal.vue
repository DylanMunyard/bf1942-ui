<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchSessionDetails, SessionDetails } from '../services/playerStatsService';
import { fetchRoundReport, fetchLiveServerData, RoundReport, LeaderboardSnapshot } from '../services/serverDetailsService';

// Router
const router = useRouter();
const route = useRoute();

interface Props {
  playerName: string;
  sessionId: number;
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const roundReport = ref<RoundReport | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedSnapshotIndex = ref(0);
const isPlaying = ref(false);
const playbackInterval = ref<NodeJS.Timeout | null>(null);
const playbackSpeed = ref(500); // milliseconds between snapshots (slower default for smoother playback)
const isDragging = ref(false);
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null);

// Fetch round report when component is mounted or when props change
const fetchData = async () => {
  if (!props.sessionId || !props.playerName) return;

  loading.value = true;
  error.value = null;

  try {
    // First fetch session details to get server GUID, map name, and start time
    const sessionDetails = await fetchSessionDetails(props.playerName, props.sessionId);
    
    // Then fetch round report using the new API parameters
    const data = await fetchRoundReport(
      sessionDetails.serverDetails.guid,
      sessionDetails.mapName,
      sessionDetails.startTime
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

// Check if a player name matches the current player (case insensitive)
const isCurrentPlayer = (playerName: string): boolean => {
  return playerName.toLowerCase() === props.playerName.toLowerCase();
};

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

// Close the popup when clicking outside or pressing ESC
const handleOutsideClick = (event: MouseEvent) => {
  const popup = document.querySelector('.session-details-modal-content');
  if (popup && !popup.contains(event.target as Node)) {
    emit('close');
    event.stopImmediatePropagation();
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
    event.stopImmediatePropagation();
  }
};

// Add and remove event listeners
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    fetchData();
  } else {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleKeyDown);
  }
});

// Clean up event listeners and intervals when component is unmounted
onMounted(() => {
  if (props.isOpen) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    fetchData();
  }
});

// Cleanup on unmount
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    stopPlayback();
    stopAutoRefresh();
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
  isDragging.value = true;
  stopPlayback();
  updateSnapshotIndex(event);
};

const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  updateSnapshotIndex(event);
};

const stopDrag = () => {
  isDragging.value = false;
};

const updateSnapshotIndex = (event: MouseEvent) => {
  const scrubber = event.currentTarget as HTMLElement;
  const rect = scrubber.getBoundingClientRect();
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
          stopAutoRefresh();
          return;
        }
        
        // Convert BFList API response to LeaderboardSnapshot format
        const liveSnapshot: LeaderboardSnapshot = {
          timestamp: new Date().toISOString(),
          entries: liveServerData.players.map((player, index) => ({
            rank: index + 1,
            playerName: player.name,
            score: player.score,
            kills: player.kills,
            deaths: player.deaths,
            ping: player.ping,
            teamLabel: player.teamLabel
          }))
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
        // Fall back to regular round report fetch if live data fails
        fetchData();
      }
    } else {
      stopAutoRefresh();
    }
  }, 15000); // 15 seconds for live updates
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
};
</script>

<template>
  <div v-if="isOpen" class="session-details-modal-overlay" @click="$emit('close')">
    <div class="session-details-modal-content" @click.stop>
      <div class="session-details-header">
        <h2>Round Report</h2>
        <button class="close-button" @click="$emit('close'); $event.stopPropagation()">&times;</button>
      </div>
      <div class="session-details-body">
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
              <div class="header-left">
                <h3>🗺️ {{ roundReport.round.mapName }}</h3>
                <router-link 
                  :to="'/servers/' + encodeURIComponent(roundReport.session.serverName)" 
                  class="server-name"
                >
                  {{ roundReport.session.serverName }}
                </router-link>
                <div class="match-meta">
                  <span class="game-id">#{{ roundReport.session.gameId }}</span>
                  <span class="separator">•</span>
                  <span class="match-time">{{ formatDate(roundReport.round.startTime) }}</span>
                  <span class="separator">•</span>
                  <span v-if="roundReport.round.isActive" class="status-badge active">Live</span>
                  <span v-else class="status-badge completed">Match Complete</span>
                </div>
              </div>
              <div class="header-controls">
                <div v-if="snapshotTimeline.length > 1" class="compact-playback">
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
            
            <div v-if="snapshotTimeline.length > 1" class="playback-instructions">
              <span class="instructions-text">Click play to watch the match unfold, or drag through the timeline</span>
            </div>
            
            <div v-if="snapshotTimeline.length > 1" class="compact-progress">
              <div 
                class="mini-progress-bar"
                @mousedown="startDrag"
                @mousemove="handleDrag"
                @mouseup="stopDrag"
                @mouseleave="stopDrag"
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
                        'current-player-row': isCurrentPlayer(player.playerName),
                        'top-player': player.rank === 1
                      }"
                    >
                      <div class="player-rank">
                        <span v-if="player.rank === 1" class="rank-medal">🥇</span>
                        <span v-else-if="player.rank === 2" class="rank-medal">🥈</span>
                        <span v-else-if="player.rank === 3" class="rank-medal">🥉</span>
                        <span v-else class="rank-number">{{ player.rank }}</span>
                      </div>
                      <div class="player-name" :class="{ 'highlighted-name': isCurrentPlayer(player.playerName) }">
                        {{ player.playerName }}
                        <span v-if="isCurrentPlayer(player.playerName)" class="you-indicator">YOU</span>
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
  </div>
</template>

<style scoped>
.session-details-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.session-details-modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 85%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: auto;
  padding: 0;
  animation: popup-fade-in 0.3s ease-out;
  color: var(--color-text);
}

@keyframes popup-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.session-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.session-details-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--color-primary);
}

.session-details-body {
  padding: 20px;
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
  background: linear-gradient(135deg, var(--color-background-soft) 0%, rgba(var(--color-primary-rgb, 33, 150, 243), 0.05) 100%);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.2);
}

.leaderboard-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-controls {
  display: flex;
  align-items: center;
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
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
}

.mini-button:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
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

.compact-progress {
  margin-bottom: 10px;
}

.mini-progress-bar {
  width: 100%;
  height: 16px;
  background: var(--color-background-mute);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.mini-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 8px;
  transition: width 0.5s ease;
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
}

.scrubber-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.3);
  opacity: 0.8;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
  z-index: 2;
}

.scrubber-dot:hover {
  opacity: 1;
  transform: scale(1.3);
  border-color: rgba(0, 0, 0, 0.5);
}

.active-dot {
  opacity: 1;
  transform: scale(1.3);
  border-color: rgba(0, 0, 0, 0.5);
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.team-column {
  background: var(--color-background);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.team-column:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.team-column.team-red {
  border-top: 4px solid #f44336;
}

.team-column.team-blue {
  border-top: 4px solid #2196f3;
}

.team-column.team-green {
  border-top: 4px solid #4caf50;
}

.team-column.team-yellow {
  border-top: 4px solid #ff9800;
}

.team-header {
  background: linear-gradient(135deg, var(--color-background-mute) 0%, var(--color-background-soft) 100%);
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.team-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 10px;
}

.team-icon {
  font-size: 1.2rem;
}

.team-stats {
  display: flex;
  gap: 20px;
}

.team-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.players-list {
  max-height: 300px;
  overflow-y: auto;
}

.player-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 60px 60px;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s ease;
  align-items: center;
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
  font-weight: 700;
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
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.highlighted-name {
  font-weight: 700;
  color: var(--color-primary);
}

.you-indicator {
  background: var(--color-primary);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  animation: glow 2s infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 5px rgba(var(--color-primary-rgb, 33, 150, 243), 0.5); }
  to { box-shadow: 0 0 10px rgba(var(--color-primary-rgb, 33, 150, 243), 0.8); }
}

.player-score {
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
}

.player-kd {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 0.85rem;
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
  font-family: monospace;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 6px;
  border-radius: 4px;
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
  .session-details-modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .match-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .map-name {
    font-size: 1.4rem;
  }

  .compact-playback {
    gap: 4px;
    padding: 3px 6px;
  }

  .mini-button {
    min-width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }

  .mini-select {
    min-width: 40px;
    font-size: 0.7rem;
  }

  .teams-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .team-column {
    min-width: 0;
  }

  .players-header,
  .player-row {
    grid-template-columns: 30px 1fr 60px 50px 50px;
    gap: 8px;
    padding: 10px 12px;
    font-size: 0.8rem;
  }

  .team-stats {
    gap: 15px;
  }

  .leaderboard-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .leaderboard-header h3 {
    font-size: 1.2rem;
  }

  .you-indicator {
    font-size: 0.6rem;
    padding: 1px 4px;
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

.playback-instructions {
  text-align: center;
  margin-bottom: 10px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.instructions-text {
  background: var(--color-background-mute);
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.server-name {
  font-size: 0.95rem;
  color: var(--color-primary);
  margin-bottom: 6px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.server-name:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.match-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.separator {
  opacity: 0.5;
  user-select: none;
}
</style>
