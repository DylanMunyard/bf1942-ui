<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchRoundReport, RoundReport, LeaderboardSnapshot } from '../services/playerStatsService';

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

// Fetch round report when component is mounted or when props change
const fetchData = async () => {
  if (!props.sessionId) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await fetchRoundReport(props.sessionId);
    roundReport.value = data;
    selectedSnapshotIndex.value = data.leaderboardSnapshots.length - 1; // Default to final snapshot
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
    const date = new Date(snapshot.timestamp);
    const timeString = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    
    let label = timeString;
    if (index === 0) label = `Start (${timeString})`;
    else if (index === roundReport.value!.leaderboardSnapshots.length - 1) label = `End (${timeString})`;
    
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
  })).sort((a, b) => b.totalScore - a.totalScore); // Sort teams by total score
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

// Clean up event listeners when component is unmounted
onMounted(() => {
  if (props.isOpen) {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    fetchData();
  }
});
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
                     <!-- Session & Round Info Section -->
           <div class="round-info">
             <div class="round-info-header">
               <h3>{{ roundReport.session.playerName }}</h3>
               <span v-if="roundReport.round.isActive" class="status-badge active">Active</span>
             </div>
             <div class="round-info-grid">
               <div class="info-item">
                 <div class="info-label">Server</div>
                 <div class="info-value">{{ roundReport.session.serverName }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Map</div>
                 <div class="info-value">{{ roundReport.round.mapName }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Game Type</div>
                 <div class="info-value">{{ roundReport.round.gameType }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Start Time</div>
                 <div class="info-value">{{ formatDate(roundReport.round.startTime) }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">End Time</div>
                 <div class="info-value">{{ roundReport.round.isActive ? 'Round Active' : formatDate(roundReport.round.endTime) }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Duration</div>
                 <div class="info-value">{{ roundReport.round.isActive ? 'In Progress' : formatDuration(roundReport.round.startTime, roundReport.round.endTime) }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Total Participants</div>
                 <div class="info-value">{{ roundReport.round.totalParticipants }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Final Score</div>
                 <div class="info-value">{{ roundReport.session.score }}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Final K/D</div>
                 <div class="info-value">{{ calculateKDR(roundReport.session.kills, roundReport.session.deaths) }} ({{ roundReport.session.kills }}/{{ roundReport.session.deaths }})</div>
               </div>
            </div>
          </div>

          <!-- Timeline Selector -->
          <div v-if="snapshotTimeline.length > 1" class="timeline-section">
            <h3>Leaderboard Timeline</h3>
            <div class="timeline-selector">
              <button
                v-for="snapshot in snapshotTimeline"
                :key="snapshot.index"
                :class="{ active: selectedSnapshotIndex === snapshot.index }"
                @click="selectedSnapshotIndex = snapshot.index"
                class="timeline-button"
              >
                {{ snapshot.label }}
              </button>
            </div>
          </div>

                     <!-- Team-Based Leaderboard Section -->
           <div v-if="currentSnapshot && teamGroups.length" class="leaderboard-section">
             <div class="leaderboard-header">
               <h3>🏆 Team Leaderboard</h3>
               <div class="timestamp">{{ formatDate(currentSnapshot.timestamp) }}</div>
             </div>
             
             <div class="teams-container">
               <div 
                 v-for="(team, index) in teamGroups" 
                 :key="team.teamName"
                 class="team-column"
                 :class="[`team-${team.teamName.toLowerCase()}`, { 'winning-team': index === 0 }]"
               >
                 <!-- Team Header -->
                 <div class="team-header">
                   <div class="team-name">
                     <span class="team-icon">🛡️</span>
                     {{ team.teamName }}
                     <span v-if="index === 0" class="crown">👑</span>
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
  gap: 25px;
}

.round-info {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 20px;
}

.round-info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.round-info-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--color-heading);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.status-badge.active {
  background-color: #4CAF50;
}

.round-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  font-weight: bold;
}

.timeline-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 20px;
}

.timeline-section h3 {
  margin: 0 0 15px 0;
  color: var(--color-heading);
  font-size: 1.2rem;
}

.timeline-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-button {
  padding: 8px 16px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.timeline-button:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-primary);
}

.timeline-button.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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
  margin-bottom: 20px;
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

.timestamp {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
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

.team-column.winning-team {
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
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

.crown {
  font-size: 1.3rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
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

  .round-info-grid {
    grid-template-columns: 1fr;
  }

  .timeline-selector {
    flex-direction: column;
  }

  .timeline-button {
    text-align: center;
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
</style>
