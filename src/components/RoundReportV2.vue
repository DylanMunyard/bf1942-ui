<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchRoundReport, RoundReport } from '../services/serverDetailsService';
import {
  generateBattleReport,
  filterBattleEvents,
  type BattleEvent,
  type BattleHighlight,
  type RoundSummary,
} from '../utils/battleEventGenerator';
import BattleSummary from './round-report/BattleSummary.vue';
import BattleHighlightComponent from './round-report/BattleHighlight.vue';

// Router
const router = useRouter();

interface Props {
  roundId: string;
  players?: string; // Optional parameter for pinning specific players
}

const props = defineProps<Props>();

const roundReport = ref<RoundReport | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedSnapshotIndex = ref(0);
const isPlaying = ref(false);
const playbackInterval = ref<NodeJS.Timeout | null>(null);
const playbackSpeed = ref(800); // milliseconds between events
const battleEvents = ref<BattleEvent[]>([]);
const battleHighlights = ref<BattleHighlight[]>([]);
const roundSummary = ref<RoundSummary | null>(null);
const visibleEventIndex = ref(0);
const autoScrollEnabled = ref(true);
const showLiveLadder = ref(false);
const trackedPlayer = ref('');
const newEventIds = ref(new Set<number>());
const batchUpdateEvents = ref<Array<{timestamp: string, events: BattleEvent[]}>>([]);
const consoleElement = ref<HTMLElement | null>(null);
const timeCheckpoints = ref<Array<{
  index: number;
  timestamp: string;
  offset: string;
  minutes: number;
}>>([]);

// Display filter options
const showJoinEvents = ref(false);
const showDeathEvents = ref(true);
const highlightsOnly = ref(false);

// Generate battle narrative from leaderboard snapshots using the new utility
const processBattleReport = () => {
  if (!roundReport.value) return;

  const report = generateBattleReport(roundReport.value);

  battleEvents.value = report.events;
  battleHighlights.value = report.highlights;
  roundSummary.value = report.summary;

  // Group events by timestamp for batch updates
  const eventGroups = report.events.reduce((acc, event) => {
    if (!acc[event.timestamp]) acc[event.timestamp] = [];
    acc[event.timestamp].push(event);
    return acc;
  }, {} as Record<string, BattleEvent[]>);

  batchUpdateEvents.value = Object.entries(eventGroups).map(([timestamp, events]) => ({
    timestamp,
    events
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Generate time-based checkpoints
  generateTimeCheckpoints();
};

// Filtered events based on display preferences
const filteredBattleEvents = computed(() => {
  return filterBattleEvents(battleEvents.value, {
    showJoinEvents: showJoinEvents.value,
    showDeathEvents: showDeathEvents.value,
    highlightsOnly: highlightsOnly.value,
  });
});

// Generate time-based checkpoints (every minute)
const generateTimeCheckpoints = () => {
  if (!batchUpdateEvents.value.length || !roundReport.value) return;
  
  const checkpoints: typeof timeCheckpoints.value = [];
  const startTime = new Date(roundReport.value.round.startTime).getTime();
  const endTime = new Date(batchUpdateEvents.value[batchUpdateEvents.value.length - 1].timestamp).getTime();
  const totalDuration = endTime - startTime;
  const totalMinutes = Math.ceil(totalDuration / (1000 * 60));
  
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

  // If no checkpoints were generated, create some sample ones for testing
  if (checkpoints.length === 0 && batchUpdateEvents.value.length > 0) {
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
  if (!props.roundId) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await fetchRoundReport(props.roundId);
    roundReport.value = data;

    // Check if round is empty (no participants)
    if (!data.leaderboardSnapshots || data.leaderboardSnapshots.length === 0 ||
        (data.leaderboardSnapshots.length === 1 && data.leaderboardSnapshots[0].entries.length === 0)) {
      error.value = 'This round was empty - no players participated';
      return;
    }

    processBattleReport();
    selectedSnapshotIndex.value = data.leaderboardSnapshots.length - 1;
    visibleEventIndex.value = batchUpdateEvents.value.length - 1;

    // Update page title with round data
    updatePageTitle();

    // Handle player pinning from query parameter
    if (props.players) {
      trackedPlayer.value = props.players;
    }
  } catch (err) {
    console.error('Error fetching round report:', err);
    error.value = 'Failed to fetch round report';
  } finally {
    loading.value = false;
  }
};



// Playback controls
const startPlayback = () => {
  if (!batchUpdateEvents.value.length) return;
  
  // If we're at the end, start from the beginning, otherwise start from current position
  if (visibleEventIndex.value >= batchUpdateEvents.value.length - 1) {
    visibleEventIndex.value = 0;
  }
  
  isPlaying.value = true;
  newEventIds.value.clear();
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
      
      // Auto-scroll to top
      if (autoScrollEnabled.value) {
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

// Visible events for display (using filtered events)
const visibleEvents = computed(() => {
  const filtered = filteredBattleEvents.value;
  if (visibleEventIndex.value >= batchUpdateEvents.value.length) {
    return filtered;
  }

  const currentBatch = batchUpdateEvents.value[visibleEventIndex.value];
  if (!currentBatch) return [];

  // Find the index of the last event in the current batch based on timestamp
  const cutoffTime = new Date(currentBatch.timestamp).getTime();

  return filtered.filter(e => new Date(e.timestamp).getTime() <= cutoffTime);
});

// Reversed visible events (newest first)
const visibleEventsReversed = computed(() => {
  return [...visibleEvents.value].reverse();
});

// Group events by time periods (every minute) for mobile display
interface EventGroup {
  timeDisplay: string;
  offsetMinutes: number;
  events: Array<BattleEvent & { originalIndex: number }>;
}

const groupedEvents = computed((): EventGroup[] => {
  if (!visibleEvents.value.length || !roundReport.value) return [];

  const groups: EventGroup[] = [];
  const startTime = new Date(roundReport.value.round.startTime).getTime();
  let currentGroup: EventGroup | null = null;

  // Reverse the events so newest are first
  const reversedEvents = [...visibleEvents.value].reverse();

  reversedEvents.forEach((event, index) => {
    const eventTime = new Date(event.timestamp).getTime();
    const offsetMs = eventTime - startTime;
    const offsetMinutes = Math.floor(offsetMs / (1000 * 60));

    // Create time display
    let timeDisplay: string;
    if (offsetMinutes === 0) {
      timeDisplay = 'Start';
    } else if (offsetMinutes < 60) {
      timeDisplay = `+${offsetMinutes}m`;
    } else {
      const hours = Math.floor(offsetMinutes / 60);
      const mins = offsetMinutes % 60;
      timeDisplay = `+${hours}h${mins > 0 ? mins + 'm' : ''}`;
    }

    // Check if we need to create a new group
    if (!currentGroup || currentGroup.timeDisplay !== timeDisplay) {
      currentGroup = {
        timeDisplay,
        offsetMinutes,
        events: []
      };
      groups.push(currentGroup);
    }

    currentGroup.events.push({
      ...event,
      originalIndex: visibleEvents.value.length - index - 1
    });
  });

  return groups;
});

// Current leaderboard (live or final)
const currentLeaderboard = computed(() => {
  if (!roundReport.value || !roundReport.value.leaderboardSnapshots.length) return [];
  
  if (showLiveLadder.value) {
    // Find the snapshot that corresponds to current time position (whether playing or manually navigated)
    let currentTime;
    
    if (visibleEventIndex.value > 0 && visibleEventIndex.value < batchUpdateEvents.value.length) {
      // Use the timestamp from the current batch event
      currentTime = batchUpdateEvents.value[visibleEventIndex.value].timestamp;
    } else if (visibleEventIndex.value === 0) {
      // At the beginning
      currentTime = roundReport.value.round.startTime;
    } else {
      // At or past the end, use final timestamp
      currentTime = batchUpdateEvents.value[batchUpdateEvents.value.length - 1]?.timestamp || roundReport.value.round.startTime;
    }
    
    // Find the leaderboard snapshot that matches or is closest to the current time
    let targetSnapshot = roundReport.value.leaderboardSnapshots[0]; // Default to first
    
    for (const snapshot of roundReport.value.leaderboardSnapshots) {
      if (new Date(snapshot.timestamp).getTime() <= new Date(currentTime).getTime()) {
        targetSnapshot = snapshot;
      } else {
        break;
      }
    }
    
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

// Watch for roundId changes to fetch new data
watch(() => props.roundId, (newRoundId) => {
  if (newRoundId) {
    fetchData();
  }
}, { immediate: true });

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
  document.addEventListener('keydown', handleKeydown);
});

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    router.push('/servers');
  }
};

const navigateToPlayerProfile = (playerName: string) => {
  router.push(`/players/${encodeURIComponent(playerName)}`);
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

// Check if tickets should be displayed
const shouldShowTickets = computed(() => {
  if (!roundReport.value?.round) return false;
  const { tickets1, tickets2 } = roundReport.value.round;
  return tickets1 !== null && tickets1 !== undefined && tickets1 >= 0 &&
         tickets2 !== null && tickets2 !== undefined && tickets2 >= 0;
});

// Format date for SEO (absolute, not relative)
const formatDateForSEO = (dateString: string | null): string => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');

  // Format as "Friday 17th September 2025"
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const year = date.getFullYear();

  // Add ordinal suffix to day (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (n: number) => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${dayName} ${day}${getOrdinalSuffix(day)} ${monthName} ${year}`;
};

// Dynamic title update function
const updatePageTitle = () => {
  if (!roundReport.value?.round) return;

  const { round } = roundReport.value;
  const date = formatDateForSEO(round.startTime);

  // Build title with available data
  let title = `${round.mapName} on ${round.serverName} on ${date}`;

  // Add team scores if available
  if (shouldShowTickets.value) {
    const team1 = round.team1Label || 'Team 1';
    const team2 = round.team2Label || 'Team 2';
    title += ` | ${team1} (${round.tickets1}) vs ${team2} (${round.tickets2})`;
  }

  // Update document title and meta description
  const fullTitle = `${title} - BF Stats`;
  document.title = fullTitle;

  // Update meta description
  const playerCount = currentLeaderboard.value.length;
  let description = `Battle report for ${round.mapName} on ${round.serverName}`;
  if (playerCount > 0) {
    description += ` with ${playerCount} players`;
  }
  if (shouldShowTickets.value) {
    const team1 = round.team1Label || 'Team 1';
    const team2 = round.team2Label || 'Team 2';
    description += `. Final score: ${team1} ${round.tickets1} - ${round.tickets2} ${team2}`;
  }
  description += '. View detailed player performance, timeline, and battlefield events.';

  // Update meta description tag
  const descriptionTag = document.querySelector('meta[name="description"]');
  if (descriptionTag) {
    descriptionTag.setAttribute('content', description);
  }

  // Update Open Graph tags
  const ogTitleTag = document.querySelector('meta[property="og:title"]');
  if (ogTitleTag) {
    ogTitleTag.setAttribute('content', fullTitle);
  }

  const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
  if (ogDescriptionTag) {
    ogDescriptionTag.setAttribute('content', description);
  }

  // Prevent search engine indexing of round report pages
  let robotsTag = document.querySelector('meta[name="robots"]');
  if (!robotsTag) {
    robotsTag = document.createElement('meta');
    robotsTag.setAttribute('name', 'robots');
    document.head.appendChild(robotsTag);
  }
  robotsTag.setAttribute('content', 'noindex, nofollow');

  // Update notification service's original title
  import('../services/notificationService').then(({ notificationService }) => {
    notificationService.updateOriginalTitle();
  });
};
</script>

<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Subtle animated background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <div class="relative z-10 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div
          v-if="roundReport"
          class="max-w-6xl mx-auto flex items-start gap-6"
        >
          <!-- Back Button -->
          <button
            class="group flex-shrink-0 w-10 h-10 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-400/50 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center hover:scale-110 mt-2"
            @click="goBack"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-300 group-hover:text-cyan-400 group-hover:-translate-x-0.5 transition-all duration-300"
            >
              <line
                x1="19"
                y1="12"
                x2="5"
                y2="12"
              />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          
          <!-- Main Content -->
          <div class="flex-1 min-w-0 text-center">
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-cyan-400 mb-6">
              {{ roundReport.round.mapName }}
            </h1>
            
            <!-- Unified Round Info Section -->
            <div class="w-full">
              <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <!-- Basic Info Row -->
                <div class="flex flex-wrap items-center justify-center gap-6 mb-4 text-slate-300">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span class="text-sm font-medium">{{ formatDate(roundReport.round.startTime) }}</span>
                  </div>
                  <div class="text-slate-600">
                    •
                  </div>
                  <router-link 
                    :to="'/servers/' + encodeURIComponent(roundReport.round.serverName)" 
                    class="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                  >
                    {{ roundReport.round.serverName }}
                  </router-link>
                </div>
                
                <!-- Team Tickets Display (when available) -->
                <div
                  v-if="shouldShowTickets"
                  class="flex items-center justify-center gap-8 pt-4 border-t border-slate-700/50"
                >
                  <div class="text-center">
                    <h3 class="text-lg font-bold text-blue-400 mb-1">
                      {{ roundReport.round.team1Label || 'Team 1' }}
                    </h3>
                    <div class="text-2xl font-bold text-white">
                      {{ roundReport.round.tickets1 }}
                    </div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">
                      Tickets
                    </div>
                  </div>
                  
                  <div class="flex flex-col items-center">
                    <div class="text-xl font-bold text-slate-300 mb-1">
                      VS
                    </div>
                    <div class="w-8 h-px bg-slate-600" />
                  </div>
                  
                  <div class="text-center">
                    <h3 class="text-lg font-bold text-red-400 mb-1">
                      {{ roundReport.round.team2Label || 'Team 2' }}
                    </h3>
                    <div class="text-2xl font-bold text-white">
                      {{ roundReport.round.tickets2 }}
                    </div>
                    <div class="text-xs text-slate-400 uppercase tracking-wide">
                      Tickets
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20 text-slate-400"
      >
        <div class="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p class="text-lg">
          Loading battle report...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        :class="error.includes('empty') ? 'bg-slate-800/20 border-slate-700/50' : 'bg-red-900/20 border-red-700/50'"
        class="backdrop-blur-sm border rounded-2xl p-8 text-center max-w-2xl mx-auto"
      >
        <div class="text-6xl mb-4">
          {{ error.includes('empty') ? '🏜️' : '⚠️' }}
        </div>
        <p :class="error.includes('empty') ? 'text-slate-300' : 'text-red-400'" class="text-lg font-semibold mb-2">
          {{ error }}
        </p>
        <p v-if="error.includes('empty')" class="text-slate-400 text-sm">
          This match was recorded but no players were present during the round.
        </p>
      </div>

      <!-- Battle Summary Stats -->
      <div v-if="roundReport && roundSummary" class="max-w-6xl mx-auto mb-6">
        <BattleSummary :summary="roundSummary" />
      </div>

      <!-- Battle Highlights -->
      <div v-if="roundReport && battleHighlights.length > 0" class="max-w-6xl mx-auto mb-6">
        <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-xl border border-slate-700/50 overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-700/50 bg-slate-900/40">
            <h3 class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 uppercase tracking-wider flex items-center gap-2">
              <span class="text-base">🎬</span>
              Battle Highlights
            </h3>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <BattleHighlightComponent
              v-for="(highlight, index) in battleHighlights.slice(0, 6)"
              :key="index"
              :highlight="highlight"
              :format-time-offset="formatTimeOffset"
            />
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div
        v-if="roundReport && !loading && !error"
        class="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:h-[calc(100vh-200px)]"
      >
        <!-- Battle Console (2/3 width) -->
        <div class="xl:col-span-2 flex flex-col gap-6 xl:h-full relative">
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
                class="w-full px-2 py-2 text-xs font-mono font-bold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                :class="[
                  reversedIndex === reversedSelectedIndex 
                    ? 'text-cyan-300 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 shadow-lg shadow-cyan-500/25' 
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                ]"
                :title="`Jump to ${checkpoint.offset}`"
                @click="jumpToReversedCheckpoint(reversedIndex)"
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
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    BATTLE_CONSOLE.EXE
                  </h4>
                  
                  <!-- Playback Controls in Header -->
                  <div class="flex items-center gap-1">
                    <button
                      class="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-all duration-300 text-sm"
                      title="Reset"
                      @click="resetPlayback"
                    >
                      ⏮️
                    </button>
                    <button
                      class="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded transition-all duration-300 font-semibold text-sm"
                      :title="isPlaying ? 'Pause' : 'Play'"
                      @click="togglePlayback"
                    >
                      {{ isPlaying ? '⏸️' : '▶️' }}
                    </button>
                    <button
                      class="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-all duration-300 text-sm"
                      title="Jump to End"
                      @click="jumpToEnd"
                    >
                      ⏭️
                    </button>
                    
                    <!-- Speed Control -->
                    <select
                      v-model="playbackSpeed"
                      class="ml-2 px-2 py-1 bg-slate-800/60 border border-slate-600 rounded text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                      title="Playback Speed"
                    >
                      <option :value="1600">
                        0.5x
                      </option>
                      <option :value="800">
                        1x
                      </option>
                      <option :value="400">
                        2x
                      </option>
                      <option :value="200">
                        4x
                      </option>
                      <option :value="100">
                        8x
                      </option>
                    </select>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <!-- Event Filter Toggles -->
                  <div class="hidden md:flex items-center gap-2 border-l border-slate-600/50 pl-3">
                    <label class="flex items-center gap-1 cursor-pointer group">
                      <input
                        v-model="showJoinEvents"
                        type="checkbox"
                        class="w-3 h-3 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                      >
                      <span class="text-xs text-slate-400 group-hover:text-slate-300">Joins</span>
                    </label>
                    <label class="flex items-center gap-1 cursor-pointer group">
                      <input
                        v-model="showDeathEvents"
                        type="checkbox"
                        class="w-3 h-3 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                      >
                      <span class="text-xs text-slate-400 group-hover:text-slate-300">Deaths</span>
                    </label>
                    <label class="flex items-center gap-1 cursor-pointer group">
                      <input
                        v-model="highlightsOnly"
                        type="checkbox"
                        class="w-3 h-3 rounded border-slate-500 bg-slate-700 text-orange-500 focus:ring-orange-500/30"
                      >
                      <span class="text-xs text-orange-400 group-hover:text-orange-300">Highlights Only</span>
                    </label>
                  </div>

                  <!-- Player Tracking Input -->
                  <div class="flex items-center gap-2 border-l border-slate-600/50 pl-3">
                    <span class="text-xs text-slate-400">Track:</span>
                    <input
                      v-model="trackedPlayer"
                      type="text"
                      placeholder="Player name..."
                      class="px-2 py-1 bg-slate-800/60 border border-slate-600 rounded text-slate-300 text-xs focus:outline-none focus:border-cyan-500 w-24"
                      title="Enter player name to highlight their events"
                    >
                  </div>
                </div>
              </div>
            </div>
            
            
            <div
              ref="consoleElement"
              class="battle-console p-4 pl-20 bg-black/20 font-mono text-sm space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar h-96 md:h-[50vh] xl:h-[calc(100vh-280px)]"
            >
              <div
                v-if="visibleEvents.length === 0"
                class="text-slate-500 text-center py-8"
              >
                <div class="text-2xl mb-2">
                  ⚔️
                </div>
                <p>Press Play to witness the battle unfold...</p>
              </div>
              
              <!-- Desktop: Traditional layout with time gutters -->
              <div class="hidden md:block">
                <div
                  v-for="(event, index) in visibleEventsReversed"
                  :key="visibleEvents.length - index - 1"
                  :class="[
                    getEventStyling(event, index),
                    event.isHighlight ? 'border-l-2 border-orange-400/50 bg-orange-500/5' : ''
                  ]"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="text-xs font-mono min-w-16 mt-0.5 transition-colors duration-300"
                      :class="trackedPlayer.trim() && !isTrackedPlayerEvent(event) ? 'text-slate-600' : 'text-slate-500'"
                    >
                      {{ formatTimeOffset(event.timestamp) }}
                    </div>
                    <div class="flex items-center gap-2 flex-1">
                      <span class="flex-shrink-0">{{ event.icon }}</span>
                      <span
                        :class="[event.color, 'transition-colors duration-300']"
                        :style="trackedPlayer.trim() && !isTrackedPlayerEvent(event) ? 'opacity: 0.6' : ''"
                      >
                        {{ event.message }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Mobile: Grouped by time periods -->
              <div class="block md:hidden">
                <div
                  v-for="group in groupedEvents"
                  :key="group.timeDisplay"
                  class="mb-4"
                >
                  <!-- Time Header -->
                  <div class="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/30 px-2 py-1 mb-2 -mx-2">
                    <div class="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
                      <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      {{ group.timeDisplay }}
                    </div>
                  </div>
                  
                  <!-- Events in this time period -->
                  <div class="space-y-1 pl-4">
                    <div
                      v-for="event in group.events"
                      :key="event.originalIndex"
                      :class="[
                        getEventStyling(event, event.originalIndex),
                        event.isHighlight ? 'border-l-2 border-orange-400/50 bg-orange-500/5' : ''
                      ]"
                    >
                      <div class="flex items-center gap-2">
                        <span class="flex-shrink-0">{{ event.icon }}</span>
                        <span
                          :class="[event.color, 'transition-colors duration-300']"
                          :style="trackedPlayer.trim() && !isTrackedPlayerEvent(event) ? 'opacity: 0.6' : ''"
                        >
                          {{ event.message }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Leaderboard (1/3 width) -->
        <div class="flex flex-col gap-6 xl:h-full">
          <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden xl:flex-1 flex flex-col">
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
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600" />
                  <span class="ml-3 text-sm font-medium text-slate-300">Live Ladder</span>
                </label>
              </div>
            </div>
            
            <!-- Data Table -->
            <div class="flex-1 overflow-hidden">
              <div
                v-for="team in teamGroups"
                :key="team.teamName"
                class="border-b border-slate-700/30 last:border-b-0"
              >
                <!-- Team Header -->
                <div class="sticky top-0 bg-slate-800/90 backdrop-blur-sm px-4 py-2 border-b border-slate-700/50">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-slate-200 text-sm">
                      {{ team.teamName }}
                    </h4>
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
                        <th class="text-left p-1 font-mono text-slate-400 w-6">
                          #
                        </th>
                        <th class="text-left p-1 font-mono text-slate-400">
                          PLAYER
                        </th>
                        <th class="text-center p-1 font-mono text-slate-400 w-12">
                          PTS
                        </th>
                        <th class="text-center p-1 font-mono text-slate-400 w-8">
                          K
                        </th>
                        <th class="text-center p-1 font-mono text-slate-400 w-8">
                          D
                        </th>
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
                            <span
                              v-if="player.rank <= 3"
                              class="text-xs"
                            >{{ getRankIcon(player.rank) }}</span>
                            <span
                              v-else
                              class="text-xs text-slate-400 font-mono"
                            >{{ player.rank }}</span>
                          </div>
                        </td>
                        
                        <!-- Player Name -->
                        <td
                          class="p-1 min-w-0 cursor-pointer"
                          @click="navigateToPlayerProfile(player.playerName)"
                        >
                          <div class="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate text-xs font-medium">
                            {{ player.playerName }}
                          </div>
                        </td>
                        
                        <!-- Score -->
                        <td class="p-1 text-center">
                          <span class="font-mono font-bold text-yellow-400">{{ player.score }}</span>
                        </td>
                        
                        <!-- Kills -->
                        <td class="p-1 text-center">
                          <span
                            class="font-mono font-bold"
                            :class="getPlayerCountClass(player.kills, player.deaths)"
                          >{{ player.kills }}</span>
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

<style scoped src="./RoundReportV2.vue.css"></style>