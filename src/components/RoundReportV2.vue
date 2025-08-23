<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchRoundReport, RoundReport } from '../services/serverDetailsService';
import PlayerName from './PlayerName.vue';

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
const playbackSpeed = ref(800); // milliseconds between events
const battleEvents = ref<Array<{
  timestamp: string;
  type: 'kill' | 'death' | 'objective' | 'spawn';
  player: string;
  target?: string;
  message: string;
  color: string;
}>>([]);
const visibleEventIndex = ref(0);
const autoScrollEnabled = ref(true);
const showLiveLadder = ref(false);
const expandedConsole = ref(false);
const trackedPlayer = ref('');
const newEventIds = ref(new Set<number>());
const batchUpdateEvents = ref<Array<{timestamp: string, events: typeof battleEvents.value}>>([]);
const isScrollFrozen = ref(false);
const lastScrollTop = ref(0);
const consoleElement = ref<HTMLElement | null>(null);
const timeNavigationTrigger = ref<HTMLElement | null>(null);
const timeCheckpoints = ref<Array<{
  index: number;
  timestamp: string;
  offset: string;
  minutes: number;
}>>([]);

// Generate battle narrative from leaderboard snapshots
const generateBattleEvents = () => {
  if (!roundReport.value) return;
  
  const events: typeof battleEvents.value = [];
  const snapshots = roundReport.value.leaderboardSnapshots;
  
  // Add round start event
  events.push({
    timestamp: roundReport.value.round.startTime,
    type: 'spawn',
    player: 'SYSTEM',
    message: `🚁 Battle begins on ${roundReport.value.round.mapName}`,
    color: 'text-cyan-400'
  });
  
  // Compare snapshots to generate events
  for (let i = 1; i < snapshots.length; i++) {
    const prevSnapshot = snapshots[i - 1];
    const currentSnapshot = snapshots[i];
    const timestamp = currentSnapshot.timestamp;
    
    // Track score and kill changes
    currentSnapshot.entries.forEach(currentPlayer => {
      const prevPlayer = prevSnapshot.entries.find(p => p.playerName === currentPlayer.playerName);
      
      if (prevPlayer) {
        const killsDiff = currentPlayer.kills - prevPlayer.kills;
        const deathsDiff = currentPlayer.deaths - prevPlayer.deaths;
        const scoreDiff = currentPlayer.score - prevPlayer.score;
        
        // Generate kill events
        if (killsDiff > 0) {
          for (let k = 0; k < killsDiff; k++) {
            events.push({
              timestamp,
              type: 'kill',
              player: currentPlayer.playerName,
              message: `💀 ${currentPlayer.playerName} eliminated an enemy (+${Math.floor(scoreDiff / (killsDiff + deathsDiff) || 10)} pts)`,
              color: 'text-emerald-400'
            });
          }
        }
        
        // Generate death events
        if (deathsDiff > 0) {
          for (let d = 0; d < deathsDiff; d++) {
            events.push({
              timestamp,
              type: 'death',
              player: currentPlayer.playerName,
              message: `⚰️ ${currentPlayer.playerName} was eliminated`,
              color: 'text-red-400'
            });
          }
        }
        
        // Generate major score events (objectives, assists, etc.)
        if (scoreDiff > 50 && killsDiff === 0) {
          events.push({
            timestamp,
            type: 'objective',
            player: currentPlayer.playerName,
            message: `🎯 ${currentPlayer.playerName} completed an objective (+${scoreDiff} pts)`,
            color: 'text-purple-400'
          });
        }
      } else {
        // New player joined
        events.push({
          timestamp,
          type: 'spawn',
          player: currentPlayer.playerName,
          message: `🪂 ${currentPlayer.playerName} joined the battle`,
          color: 'text-blue-400'
        });
      }
    });
    
    // Add periodic battle updates
    if (i % 3 === 0) {
      const topPlayer = currentSnapshot.entries[0];
      events.push({
        timestamp,
        type: 'objective',
        player: 'SYSTEM',
        message: `📊 ${topPlayer.playerName} leads with ${topPlayer.score} points (${topPlayer.kills}/${topPlayer.deaths})`,
        color: 'text-yellow-400'
      });
    }
  }
  
  // Add round end event
  const finalSnapshot = snapshots[snapshots.length - 1];
  const winner = finalSnapshot.entries[0];
  events.push({
    timestamp: finalSnapshot.timestamp,
    type: 'objective',
    player: 'SYSTEM',
    message: `🏆 Battle concluded! ${winner.playerName} achieved victory with ${winner.score} points!`,
    color: 'text-yellow-400'
  });
  
  battleEvents.value = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Group events by timestamp for batch updates
  const eventGroups = events.reduce((acc, event) => {
    if (!acc[event.timestamp]) acc[event.timestamp] = [];
    acc[event.timestamp].push(event);
    return acc;
  }, {} as Record<string, typeof events>);
  
  batchUpdateEvents.value = Object.entries(eventGroups).map(([timestamp, events]) => ({
    timestamp,
    events
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Generate time-based checkpoints
  generateTimeCheckpoints();
};

// Generate time-based checkpoints (every minute)
const generateTimeCheckpoints = () => {
  if (!batchUpdateEvents.value.length || !roundReport.value) return;
  
  const checkpoints: typeof timeCheckpoints.value = [];
  const startTime = new Date(roundReport.value.round.startTime).getTime();
  const endTime = new Date(batchUpdateEvents.value[batchUpdateEvents.value.length - 1].timestamp).getTime();
  const totalDuration = endTime - startTime;
  const totalMinutes = Math.ceil(totalDuration / (1000 * 60));
  
  console.log('Generating checkpoints:', { totalMinutes, startTime, endTime, totalDuration });
  
  // Create checkpoints every minute
  for (let minute = 0; minute <= totalMinutes; minute++) {
    const targetTime = startTime + (minute * 60 * 1000);
    
    // Find closest batch event to this time
    let closestIndex = 0;
    let closestDiff = Math.abs(new Date(batchUpdateEvents.value[0].timestamp).getTime() - targetTime);
    
    for (let i = 1; i < batchUpdateEvents.value.length; i++) {
      const eventTime = new Date(batchUpdateEvents.value[i].timestamp).getTime();
      const diff = Math.abs(eventTime - targetTime);
      
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    // Format the time display
    let timeDisplay;
    if (minute === 0) {
      timeDisplay = 'Start';
    } else if (minute < 60) {
      timeDisplay = `+${minute}m`;
    } else {
      const hours = Math.floor(minute / 60);
      const mins = minute % 60;
      timeDisplay = `+${hours}h${mins > 0 ? mins + 'm' : ''}`;
    }
    
    checkpoints.push({
      index: closestIndex,
      timestamp: batchUpdateEvents.value[closestIndex].timestamp,
      offset: timeDisplay,
      minutes: minute
    });
  }
  
  console.log('Generated checkpoints:', checkpoints);
  
  // If no checkpoints were generated, create some sample ones for testing
  if (checkpoints.length === 0 && batchUpdateEvents.value.length > 0) {
    console.log('No checkpoints generated, creating samples');
    const sampleCount = Math.min(10, batchUpdateEvents.value.length);
    for (let i = 0; i < sampleCount; i++) {
      const batchIndex = Math.floor((i / (sampleCount - 1)) * (batchUpdateEvents.value.length - 1));
      checkpoints.push({
        index: batchIndex,
        timestamp: batchUpdateEvents.value[batchIndex].timestamp,
        offset: i === 0 ? 'Start' : `+${i}m`,
        minutes: i
      });
    }
  }
  
  timeCheckpoints.value = checkpoints;
};

// Fetch round report
const fetchData = async () => {
  if (!props.serverGuid || !props.mapName || !props.startTime) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await fetchRoundReport(props.serverGuid, props.mapName, props.startTime);
    roundReport.value = data;
    generateBattleEvents();
    selectedSnapshotIndex.value = data.leaderboardSnapshots.length - 1;
    visibleEventIndex.value = batchUpdateEvents.value.length - 1;
  } catch (err) {
    console.error('Error fetching round report:', err);
    error.value = 'Failed to fetch round report';
  } finally {
    loading.value = false;
  }
};


// Terminal-style scroll management
const handleScroll = () => {
  if (!consoleElement.value || !isPlaying.value) return;
  
  const element = consoleElement.value;
  const currentScrollTop = element.scrollTop;
  
  // If user scrolled away from the top, freeze auto-scroll
  if (currentScrollTop > 10 && !isScrollFrozen.value) {
    isScrollFrozen.value = true;
    autoScrollEnabled.value = false;
  }
  
  // If user scrolled back to near the top, resume auto-scroll
  if (currentScrollTop <= 10 && isScrollFrozen.value) {
    isScrollFrozen.value = false;
    autoScrollEnabled.value = true;
  }
  
  lastScrollTop.value = currentScrollTop;
};

// Playback controls
const startPlayback = () => {
  if (!batchUpdateEvents.value.length) return;
  
  visibleEventIndex.value = 0;
  isPlaying.value = true;
  newEventIds.value.clear();
  isScrollFrozen.value = false;
  autoScrollEnabled.value = true;
  
  playbackInterval.value = setInterval(() => {
    if (visibleEventIndex.value < batchUpdateEvents.value.length - 1) {
      visibleEventIndex.value++;
      
      // Add new event IDs for animation
      const currentBatch = batchUpdateEvents.value[visibleEventIndex.value];
      const startIndex = battleEvents.value.findIndex(e => e.timestamp === currentBatch.timestamp);
      if (startIndex >= 0) {
        for (let i = 0; i < currentBatch.events.length; i++) {
          newEventIds.value.add(startIndex + i);
        }
        // Remove animation class after a delay
        setTimeout(() => {
          for (let i = 0; i < currentBatch.events.length; i++) {
            newEventIds.value.delete(startIndex + i);
          }
        }, 1000);
      }
      
      // Only auto-scroll if not frozen
      if (autoScrollEnabled.value && !isScrollFrozen.value) {
        scrollToTop();
      }
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
  visibleEventIndex.value = 0;
  newEventIds.value.clear();
  isScrollFrozen.value = false;
  autoScrollEnabled.value = true;
};

const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
};

const jumpToEnd = () => {
  stopPlayback();
  visibleEventIndex.value = batchUpdateEvents.value.length - 1;
  newEventIds.value.clear();
  isScrollFrozen.value = false;
  autoScrollEnabled.value = true;
  scrollToTop();
};

const scrollToTop = () => {
  if (consoleElement.value) {
    consoleElement.value.scrollTop = 0;
  }
};

// Time navigation state
const selectedTimeIndex = ref(0);

// Jump to time checkpoint
const jumpToTimeCheckpoint = (checkpointIndex: number) => {
  const checkpoint = timeCheckpoints.value[checkpointIndex];
  if (!checkpoint) return;
  
  // Stop current playback
  stopPlayback();
  
  // Jump to the checkpoint batch index
  visibleEventIndex.value = checkpoint.index;
  selectedTimeIndex.value = checkpointIndex;
  newEventIds.value.clear();
  isScrollFrozen.value = false;
  autoScrollEnabled.value = true;
  
  // Scroll to top to show the checkpoint
  scrollToTop();
};

// Update selected index based on current position
const updateSelectedTimeIndex = () => {
  if (timeCheckpoints.value.length > 0) {
    let closestIndex = 0;
    let closestDiff = Math.abs(timeCheckpoints.value[0].index - visibleEventIndex.value);
    
    for (let i = 1; i < timeCheckpoints.value.length; i++) {
      const diff = Math.abs(timeCheckpoints.value[i].index - visibleEventIndex.value);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    selectedTimeIndex.value = closestIndex;
  }
};

// Navigate time checkpoints (in reversed display order)
const navigateTime = (direction: 'up' | 'down') => {
  const currentReversedIndex = reversedSelectedIndex.value;
  let newReversedIndex = currentReversedIndex;
  
  if (direction === 'up' && currentReversedIndex > 0) {
    newReversedIndex = currentReversedIndex - 1;
  } else if (direction === 'down' && currentReversedIndex < timeCheckpoints.value.length - 1) {
    newReversedIndex = currentReversedIndex + 1;
  }
  
  if (newReversedIndex !== currentReversedIndex) {
    jumpToReversedCheckpoint(newReversedIndex);
  }
};

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  // Only handle arrow keys when the console area has focus or when no input is focused
  const activeElement = document.activeElement;
  const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');
  
  if (isInputFocused) return;
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      navigateTime('up');
      break;
    case 'ArrowDown':
      event.preventDefault();
      navigateTime('down');
      break;
    case 'Home':
      event.preventDefault();
      jumpToReversedCheckpoint(0); // Jump to latest (first in reversed list)
      break;
    case 'End':
      event.preventDefault();
      jumpToReversedCheckpoint(timeCheckpoints.value.length - 1); // Jump to earliest (last in reversed list)
      break;
  }
};

// Get current time offset for display
const getCurrentTimeOffset = () => {
  if (timeCheckpoints.value.length === 0) return 'Loading...';
  return timeCheckpoints.value[selectedTimeIndex.value]?.offset || timeCheckpoints.value[0].offset;
};

// Visible events for display
const visibleEvents = computed(() => {
  if (visibleEventIndex.value >= batchUpdateEvents.value.length) {
    return battleEvents.value;
  }
  
  const currentBatch = batchUpdateEvents.value[visibleEventIndex.value];
  if (!currentBatch) return [];
  
  // Find the index of the last event in the current batch
  const lastEventInBatch = currentBatch.events[currentBatch.events.length - 1];
  const lastEventIndex = battleEvents.value.findIndex(e => 
    e.timestamp === lastEventInBatch.timestamp && 
    e.message === lastEventInBatch.message
  );
  
  return battleEvents.value.slice(0, lastEventIndex + 1);
});

// Reversed visible events (newest first)
const visibleEventsReversed = computed(() => {
  return [...visibleEvents.value].reverse();
});

// Current leaderboard (live or final)
const currentLeaderboard = computed(() => {
  if (!roundReport.value || !roundReport.value.leaderboardSnapshots.length) return [];
  
  if (showLiveLadder.value && isPlaying.value) {
    // Find the snapshot that corresponds to current playback position
    const currentTime = visibleEventIndex.value > 0 ? battleEvents.value[visibleEventIndex.value - 1]?.timestamp : roundReport.value.round.startTime;
    const snapshotIndex = roundReport.value.leaderboardSnapshots.findIndex(snapshot => snapshot.timestamp >= currentTime);
    const targetSnapshot = snapshotIndex >= 0 ? roundReport.value.leaderboardSnapshots[snapshotIndex] : roundReport.value.leaderboardSnapshots[roundReport.value.leaderboardSnapshots.length - 1];
    return targetSnapshot.entries;
  } else {
    // Show final standings
    const finalSnapshot = roundReport.value.leaderboardSnapshots[roundReport.value.leaderboardSnapshots.length - 1];
    return finalSnapshot.entries;
  }
});

// Format date
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  
  const timeFormat = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - dateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${timeFormat}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeFormat}`;
  } else if (diffDays < 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${dayNames[date.getDay()]} at ${timeFormat}`;
  } else {
    const formattedDate = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${formattedDate} at ${timeFormat}`;
  }
};

// Update selected index when playback changes
watch(visibleEventIndex, () => {
  updateSelectedTimeIndex();
});

// Reversed time checkpoints (latest first to match console ordering)
const reversedTimeCheckpoints = computed(() => {
  return [...timeCheckpoints.value].reverse();
});

// Get reversed index for navigation
const getReverseIndex = (index: number) => {
  return timeCheckpoints.value.length - 1 - index;
};

// Jump to checkpoint using reversed index
const jumpToReversedCheckpoint = (reversedIndex: number) => {
  const originalIndex = getReverseIndex(reversedIndex);
  jumpToTimeCheckpoint(originalIndex);
  selectedTimeIndex.value = originalIndex;
};

// Get current selected index in reversed array
const reversedSelectedIndex = computed(() => {
  return getReverseIndex(selectedTimeIndex.value);
});

// Cleanup
onUnmounted(() => {
  stopPlayback();
  document.removeEventListener('keydown', handleKeydown);
});

onMounted(() => {
  fetchData();
  document.addEventListener('keydown', handleKeydown);
});

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    router.push('/servers');
  }
};

// Team groups for current leaderboard
const teamGroups = computed(() => {
  if (!currentLeaderboard.value.length) return [];
  
  const groups = currentLeaderboard.value.reduce((acc, entry) => {
    if (!acc[entry.teamLabel]) acc[entry.teamLabel] = [];
    acc[entry.teamLabel].push(entry);
    return acc;
  }, {} as Record<string, typeof currentLeaderboard.value>);
  
  return Object.entries(groups).map(([teamName, players]) => ({
    teamName,
    players: players.sort((a, b) => a.rank - b.rank),
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    totalKills: players.reduce((sum, player) => sum + player.kills, 0),
    totalDeaths: players.reduce((sum, player) => sum + player.deaths, 0)
  })).sort((a, b) => b.totalScore - a.totalScore);
});

// Format time offset from round start
const formatTimeOffset = (eventTimestamp: string) => {
  if (!roundReport.value) return '+0:00';
  
  const roundStartTime = new Date(roundReport.value.round.startTime).getTime();
  const eventTime = new Date(eventTimestamp).getTime();
  const offsetMs = eventTime - roundStartTime;
  
  // Handle negative offsets (shouldn't happen, but just in case)
  if (offsetMs < 0) return '+0:00';
  
  const totalSeconds = Math.floor(offsetMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `+${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Check if event involves tracked player
const isTrackedPlayerEvent = (event: typeof battleEvents.value[0]) => {
  if (!trackedPlayer.value.trim()) return false;
  return event.player.toLowerCase().includes(trackedPlayer.value.toLowerCase()) ||
         event.message.toLowerCase().includes(trackedPlayer.value.toLowerCase());
};

// Get event styling based on tracking
const getEventStyling = (event: typeof battleEvents.value[0], eventIndex: number) => {
  const isNew = newEventIds.value.has(eventIndex);
  const isTracked = isTrackedPlayerEvent(event);
  const isCurrentEvent = eventIndex === 0 && isPlaying.value;
  
  let classes = 'py-1 px-2 rounded-sm transition-all duration-500 ';
  
  if (isNew) {
    classes += 'animate-pulse bg-cyan-500/20 border-l-2 border-cyan-400 ';
  } else if (isCurrentEvent) {
    classes += 'bg-cyan-500/10 border-l-2 border-cyan-400 ';
  }
  
  if (trackedPlayer.value.trim()) {
    if (isTracked) {
      classes += 'bg-yellow-500/10 border-l-2 border-yellow-400 ';
    } else {
      classes += 'opacity-40 ';
    }
  }
  
  return classes;
};

// Get player count styling (from LandingPageV2)
const getPlayerCountClass = (kills: number, deaths: number) => {
  const kd = deaths > 0 ? kills / deaths : kills;
  if (kd >= 2) return 'text-emerald-400';
  if (kd >= 1.5) return 'text-green-400';
  if (kd >= 1) return 'text-yellow-400';
  if (kd >= 0.5) return 'text-orange-400';
  return 'text-red-400';
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank.toString();
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

    <div class="relative z-10 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <button
            @click="goBack"
            class="group inline-flex items-center gap-3 px-6 py-3 text-sm font-medium text-cyan-400 bg-slate-800/50 hover:bg-slate-700/70 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 rounded-lg transition-all duration-300 cursor-pointer flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:-translate-x-1 transition-transform duration-300"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Server
          </button>

          <div v-if="roundReport" class="flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
              🗺️ {{ roundReport.round.mapName }}
            </h1>
            <div class="flex flex-wrap items-center gap-4 text-slate-400">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span class="text-sm">{{ formatDate(roundReport.round.startTime) }}</span>
              </div>
              <div class="text-slate-600">•</div>
              <router-link 
                :to="'/servers/' + encodeURIComponent(roundReport.session.serverName)" 
                class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium truncate"
              >
                {{ roundReport.session.serverName }}
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
        <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p class="text-lg">Loading battle report...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-2xl p-8 text-center">
        <div class="text-6xl mb-4">⚠️</div>
        <p class="text-red-400 text-lg font-semibold">{{ error }}</p>
      </div>

      <!-- Main Content -->
      <div v-else-if="roundReport" class="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        <!-- Battle Console (2/3 width) -->
        <div class="xl:col-span-2 flex flex-col gap-6 h-full relative">
          <!-- Time Navigator - Left Side -->
          <div 
            v-if="timeCheckpoints.length > 0"
            class="absolute left-0 w-16 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 rounded-bl-2xl z-20 flex flex-col time-navigator"
            style="top: 60px; bottom: 0;"
          >
            <!-- Current Time Indicator -->
            <div class="p-2 text-center border-b border-slate-700/50">
              <div class="text-xs text-slate-400 font-mono font-bold bg-cyan-500/20 border border-cyan-500/40 rounded px-1 py-0.5">
                {{ getCurrentTimeOffset() }}
              </div>
            </div>
            
            <!-- Checkpoint List (Latest First) -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-1 custom-scrollbar">
              <button
                v-for="(checkpoint, reversedIndex) in reversedTimeCheckpoints"
                :key="reversedIndex"
                @click="jumpToReversedCheckpoint(reversedIndex)"
                class="w-full px-2 py-2 text-xs font-mono font-bold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                :class="[
                  reversedIndex === reversedSelectedIndex 
                    ? 'text-cyan-300 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 shadow-lg shadow-cyan-500/25' 
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                ]"
                :title="`Jump to ${checkpoint.offset}`"
              >
                {{ checkpoint.offset }}
              </button>
            </div>
          </div>
          <!-- Battle Events Console -->
          <div 
            class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col flex-1"
          >
            <div class="p-4 border-b border-slate-700/50 bg-slate-900/60 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <h4 class="font-mono text-green-400 text-sm flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    BATTLE_CONSOLE.EXE
                  </h4>
                  
                  <!-- Playback Controls in Header -->
                  <div class="flex items-center gap-1">
                    <button
                      @click="resetPlayback"
                      class="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-all duration-300 text-sm"
                      title="Reset"
                    >
                      ⏮️
                    </button>
                    <button
                      @click="togglePlayback"
                      class="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded transition-all duration-300 font-semibold text-sm"
                      :title="isPlaying ? 'Pause' : 'Play'"
                    >
                      {{ isPlaying ? '⏸️' : '▶️' }}
                    </button>
                    <button
                      @click="jumpToEnd"
                      class="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-all duration-300 text-sm"
                      title="Jump to End"
                    >
                      ⏭️
                    </button>
                    
                    <!-- Speed Control -->
                    <select
                      v-model="playbackSpeed"
                      class="ml-2 px-2 py-1 bg-slate-800/60 border border-slate-600 rounded text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                      title="Playback Speed"
                    >
                      <option :value="1600">0.5x</option>
                      <option :value="800">1x</option>
                      <option :value="400">2x</option>
                      <option :value="200">4x</option>
                      <option :value="100">8x</option>
                    </select>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <!-- Player Tracking Input -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400">Track:</span>
                    <input
                      v-model="trackedPlayer"
                      type="text"
                      placeholder="Player name..."
                      class="px-2 py-1 bg-slate-800/60 border border-slate-600 rounded text-slate-300 text-xs focus:outline-none focus:border-cyan-500 w-24"
                      title="Enter player name to highlight their events"
                    />
                  </div>
                  
                  <div class="flex items-center gap-2 text-sm text-slate-400">
                    <div class="w-2 h-2 rounded-full" :class="
                      isPlaying ? 
                        (isScrollFrozen ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse') : 
                        'bg-slate-500'
                    "></div>
                    <span>
                      {{ isPlaying ? 
                        (isScrollFrozen ? 'FROZEN (scroll to top to resume)' : 'LIVE') : 
                        'PAUSED' 
                      }}
                    </span>
                  </div>
                  <button
                    @click="expandedConsole = !expandedConsole"
                    class="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-all duration-200"
                    :title="expandedConsole ? 'Fixed height' : 'Expand infinitely'"
                  >
                    {{ expandedConsole ? '📌' : '📈' }}
                  </button>
                </div>
              </div>
            </div>
            
            
            <div 
              ref="consoleElement"
              @scroll="handleScroll"
              class="battle-console p-4 pl-20 bg-black/20 font-mono text-sm space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
              style="height: calc(100vh - 280px); max-height: calc(100vh - 280px);"
            >
              <div v-if="visibleEvents.length === 0" class="text-slate-500 text-center py-8">
                <div class="text-2xl mb-2">⚔️</div>
                <p>Press Play to witness the battle unfold...</p>
              </div>
              
              <div
                v-for="(event, index) in visibleEventsReversed"
                :key="visibleEvents.length - index - 1"
                :class="getEventStyling(event, index)"
              >
                <div class="flex items-start gap-3">
                  <div class="text-xs font-mono min-w-16 mt-0.5 transition-colors duration-300"
                       :class="trackedPlayer.trim() && !isTrackedPlayerEvent(event) ? 'text-slate-600' : 'text-slate-500'">
                    {{ formatTimeOffset(event.timestamp) }}
                  </div>
                  <div :class="[event.color, 'flex-1 transition-colors duration-300']" 
                       :style="trackedPlayer.trim() && !isTrackedPlayerEvent(event) ? 'opacity: 0.6' : ''">
                    {{ event.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Leaderboard (1/3 width) -->
        <div class="flex flex-col gap-6 h-full">
          <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden flex-1 flex flex-col">
            <div class="p-4 border-b border-slate-700/50 flex-shrink-0">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center gap-2">
                  🏆 {{ showLiveLadder && isPlaying ? 'Live' : 'Final' }} Standings
                </h3>
              </div>
              
              <!-- Live Ladder Toggle -->
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="showLiveLadder"
                    type="checkbox"
                    class="sr-only peer"
                  >
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  <span class="ml-3 text-sm font-medium text-slate-300">Live Ladder</span>
                </label>
              </div>
            </div>
            
            <!-- Data Table -->
            <div class="flex-1 overflow-hidden">
              <div
                v-for="(team, teamIndex) in teamGroups"
                :key="team.teamName"
                class="border-b border-slate-700/30 last:border-b-0"
              >
                <!-- Team Header -->
                <div class="sticky top-0 bg-slate-800/90 backdrop-blur-sm px-4 py-2 border-b border-slate-700/50">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-slate-200 text-sm">{{ team.teamName }}</h4>
                    <div class="text-xs text-slate-400 flex items-center gap-2">
                      <span>{{ team.totalKills }}K</span>
                      <span>{{ team.totalScore }}P</span>
                    </div>
                  </div>
                </div>
                
                <!-- Players Data Table -->
                <div class="overflow-y-auto max-h-80">
                  <table class="w-full text-xs">
                    <thead class="sticky top-0 bg-slate-900/95">
                      <tr class="border-b border-slate-700/30">
                        <th class="text-left p-1 font-mono text-slate-400 w-6">#</th>
                        <th class="text-left p-1 font-mono text-slate-400">PLAYER</th>
                        <th class="text-center p-1 font-mono text-slate-400 w-12">PTS</th>
                        <th class="text-center p-1 font-mono text-slate-400 w-8">K</th>
                        <th class="text-center p-1 font-mono text-slate-400 w-8">D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="player in team.players"
                        :key="player.playerName"
                        class="group hover:bg-slate-800/30 border-b border-slate-700/20 transition-colors"
                      >
                        <!-- Rank -->
                        <td class="p-1">
                          <div class="w-4 h-4 flex items-center justify-center">
                            <span v-if="player.rank <= 3" class="text-xs">{{ getRankIcon(player.rank) }}</span>
                            <span v-else class="text-xs text-slate-400 font-mono">{{ player.rank }}</span>
                          </div>
                        </td>
                        
                        <!-- Player Name -->
                        <td class="p-1 min-w-0">
                          <PlayerName
                            :name="player.playerName"
                            source="round-report-v2-table"
                            :server-guid="props.serverGuid"
                            class="text-slate-200 group-hover:text-cyan-400 transition-colors truncate text-xs font-medium"
                          />
                        </td>
                        
                        <!-- Score -->
                        <td class="p-1 text-center">
                          <span class="font-mono font-bold text-yellow-400">{{ player.score }}</span>
                        </td>
                        
                        <!-- Kills -->
                        <td class="p-1 text-center">
                          <span class="font-mono font-bold" :class="getPlayerCountClass(player.kills, player.deaths)">{{ player.kills }}</span>
                        </td>
                        
                        <!-- Deaths -->
                        <td class="p-1 text-center">
                          <span class="font-mono text-red-400 font-bold">{{ player.deaths }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for theme consistency */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, rgba(6, 182, 212, 0.6), rgba(59, 130, 246, 0.6));
  border-radius: 4px;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.8));
  border-color: rgba(6, 182, 212, 0.4);
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: linear-gradient(to bottom, rgba(6, 182, 212, 1), rgba(59, 130, 246, 1));
}

/* Time navigator specific styling */
.time-navigator .custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.time-navigator .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.2);
}

.time-navigator .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border: none;
}

.time-navigator .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}
</style>