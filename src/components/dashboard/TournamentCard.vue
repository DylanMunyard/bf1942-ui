<template>
  <div class="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden hover:border-cyan-500/50 transition-all duration-300">
    <!-- Hero Image -->
    <div
      v-if="tournament.hasHeroImage"
      class="relative h-32 bg-slate-800/60 overflow-hidden"
    >
      <div
        v-if="imageLoading && !heroImageUrl"
        class="w-full h-full flex items-center justify-center"
      >
        <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
      <img
        v-else-if="heroImageUrl"
        :src="heroImageUrl"
        :alt="tournament.name"
        class="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Tournament Name -->
      <div class="mb-3">
        <div class="flex items-center gap-2 mb-1">
          <div
            class="w-5 h-5 rounded bg-cover bg-center flex-shrink-0"
            :style="{ backgroundImage: getGameIcon() }"
          />
          <h3 class="text-lg font-bold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1 flex-1">
            {{ tournament.name }}
          </h3>
        </div>
        <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span class="flex items-center gap-1">
            <span>👤</span>
            <span>{{ tournament.organizer }}</span>
          </span>
          <span>•</span>
          <span>{{ formatDate(tournament.createdAt) }}</span>
          <template v-if="tournament.serverName">
            <span>•</span>
            <span class="flex items-center gap-1" :title="tournament.serverName">
              <span>🖥️</span>
              <span class="truncate max-w-[150px]">{{ tournament.serverName }}</span>
            </span>
          </template>
        </div>
      </div>

      <!-- Round Progress -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Tournament Progress</span>
          <span class="font-mono">
            {{ tournament.roundCount }}/{{ tournament.anticipatedRoundCount || '?' }}
          </span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
            :style="{ width: getProgressPercentage() + '%' }"
          />
        </div>

        <!-- Skeleton Rounds -->
        <div
          v-if="tournament.anticipatedRoundCount && tournament.roundCount < tournament.anticipatedRoundCount"
          class="mt-2 flex gap-1"
        >
          <!-- Completed rounds -->
          <div
            v-for="n in tournament.roundCount"
            :key="'completed-' + n"
            class="flex-1 h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            :title="`Round ${n} completed`"
          />
          <!-- Upcoming rounds -->
          <div
            v-for="n in (tournament.anticipatedRoundCount - tournament.roundCount)"
            :key="'upcoming-' + n"
            class="flex-1 h-1.5 bg-slate-700/50 rounded-full animate-pulse"
            :title="`Round ${tournament.roundCount + n} upcoming`"
          />
        </div>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-2 mb-3">
        <span
          v-if="isComplete"
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-400 bg-green-500/20 border border-green-500/30 rounded-full"
        >
          <span>✓</span>
          <span>Complete</span>
        </span>
        <span
          v-else-if="isInProgress"
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-cyan-400 bg-cyan-500/20 border border-cyan-500/30 rounded-full"
        >
          <span>🎮</span>
          <span>In Progress</span>
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-400 bg-slate-500/20 border border-slate-500/30 rounded-full"
        >
          <span>📅</span>
          <span>Upcoming</span>
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          class="flex-1 px-3 py-2 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all"
          @click="$emit('view-details')"
        >
          View Details
        </button>
        <button
          class="px-3 py-2 text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg transition-all"
          @click="$emit('edit')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          class="px-3 py-2 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all"
          @click="$emit('remove')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { type TournamentListItem } from '@/services/adminTournamentService';
import { adminTournamentService } from '@/services/adminTournamentService';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

interface Props {
  tournament: TournamentListItem;
}

const props = defineProps<Props>();

defineEmits<{
  'view-details': [];
  edit: [];
  remove: [];
}>();

const heroImageUrl = ref<string | null>(null);
const imageLoading = ref(false);

const isComplete = computed(() => {
  if (!props.tournament.anticipatedRoundCount) {
    return false;
  }
  return props.tournament.roundCount >= props.tournament.anticipatedRoundCount;
});

const isInProgress = computed(() => {
  return props.tournament.roundCount > 0 && !isComplete.value;
});

const getProgressPercentage = (): number => {
  if (!props.tournament.anticipatedRoundCount || props.tournament.anticipatedRoundCount === 0) {
    return 0;
  }
  return Math.min(100, (props.tournament.roundCount / props.tournament.anticipatedRoundCount) * 100);
};

const loadHeroImage = async () => {
  if (!props.tournament.hasHeroImage) {
    return;
  }

  imageLoading.value = true;

  try {
    const { authService } = await import('@/services/authService');

    // Ensure we have a valid token
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(adminTournamentService.getTournamentImageUrl(props.tournament.id), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      heroImageUrl.value = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Error loading tournament hero image:', error);
  } finally {
    imageLoading.value = false;
  }
};

const getGameIcon = (): string => {
  const iconMap: Record<string, string> = {
    'bf1942': `url('${bf1942Icon}')`,
    'fh2': `url('${fh2Icon}')`,
    'bfvietnam': `url('${bfvIcon}')`
  };
  return iconMap[props.tournament.game] || `url('${bf1942Icon}')`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

onMounted(() => {
  if (props.tournament.hasHeroImage) {
    loadHeroImage();
  }
});

// Watch for changes to hasHeroImage in case it updates
watch(() => props.tournament.hasHeroImage, (newValue) => {
  if (newValue && !heroImageUrl.value) {
    loadHeroImage();
  }
});
</script>
