<template>
  <div class="hacker-card">
    <!-- Hero Image -->
    <div v-if="tournament.hasHeroImage" class="hero-section">
      <div v-if="imageLoading && !heroImageUrl" class="hero-loading">
        <div class="loading-spinner" />
      </div>
      <img
        v-else-if="heroImageUrl"
        :src="heroImageUrl"
        :alt="tournament.name"
        class="hero-image"
      >
      <div class="hero-overlay" />
      <div class="hero-scanlines" />
    </div>

    <!-- Content -->
    <div class="card-content">
      <!-- Tournament Header -->
      <div class="tournament-header">
        <div class="game-badge">
          <div
            class="game-icon"
            :style="{ backgroundImage: getGameIcon() }"
          />
        </div>
        <h3 class="tournament-name">
          {{ tournament.name }}
        </h3>
      </div>

      <!-- Meta Info -->
      <div class="tournament-meta">
        <span class="meta-item">
          <span class="meta-label">&gt; ORG:</span>
          <span class="meta-value">{{ tournament.organizer }}</span>
        </span>
        <span class="meta-divider">//</span>
        <span class="meta-item">
          <span class="meta-label">DATE:</span>
          <span class="meta-value">{{ formatDate(tournament.createdAt) }}</span>
        </span>
        <template v-if="tournament.serverName">
          <span class="meta-divider">//</span>
          <span class="meta-item server-meta" :title="tournament.serverName">
            <span class="meta-label">SRV:</span>
            <span class="meta-value truncate">{{ tournament.serverName }}</span>
          </span>
        </template>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-block">
          <span class="stat-value">{{ tournament.matchCount }}</span>
          <span class="stat-label">MATCHES</span>
        </div>
        <div v-if="tournament.anticipatedRoundCount" class="stat-block">
          <span class="stat-value">{{ tournament.anticipatedRoundCount }}</span>
          <span class="stat-label">ROUNDS</span>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="status-row">
        <span v-if="isInProgress" class="status-badge status-active">
          <span class="status-dot" />
          <span>IN_PROGRESS</span>
        </span>
        <span v-else class="status-badge status-pending">
          <span class="status-icon">&gt;</span>
          <span>SCHEDULED</span>
        </span>
      </div>

      <!-- Actions -->
      <div class="actions-row">
        <button class="btn-action btn-primary" @click="$emit('view-details')">
          [MANAGE]
        </button>
        <button class="btn-action btn-danger" @click="$emit('remove')">
          [DEL]
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
  remove: [];
}>();

const heroImageUrl = ref<string | null>(null);
const imageLoading = ref(false);

const isInProgress = computed(() => {
  return props.tournament.matchCount > 0;
});

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

    // Create an AbortController with a 10-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(adminTournamentService.getTournamentImageUrl(props.tournament.id), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        heroImageUrl.value = URL.createObjectURL(blob);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.debug('Error loading tournament hero image:', error);
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
    return 'TODAY';
  } else if (diffDays === 1) {
    return 'YESTERDAY';
  } else if (diffDays < 7) {
    return `${diffDays}D_AGO`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}W_AGO`;
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
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

<style scoped>
.hacker-card {
  --card-accent: #ffd700;
  position: relative;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.hacker-card:hover {
  border-color: var(--card-accent);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.15);
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 100px;
  background: linear-gradient(135deg, #1a1f26 0%, #0d1117 100%);
  overflow: hidden;
}

.hero-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 215, 0, 0.2);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.hacker-card:hover .hero-image {
  opacity: 0.7;
  transform: scale(1.05);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, #0d1117 100%);
}

.hero-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
}

/* Card Content */
.card-content {
  padding: 1rem;
}

/* Tournament Header */
.tournament-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.game-badge {
  flex-shrink: 0;
}

.game-icon {
  width: 20px;
  height: 20px;
  background-size: cover;
  background-position: center;
  border-radius: 2px;
}

.tournament-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e6edf3;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.hacker-card:hover .tournament-name {
  color: #ffd700;
}

/* Meta Info */
.tournament-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.65rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-label {
  color: #6e7681;
}

.meta-value {
  color: #8b949e;
}

.meta-divider {
  color: #30363d;
}

.server-meta {
  max-width: 150px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Stats Row */
.stats-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.stat-block {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.stat-label {
  font-size: 0.6rem;
  color: #6e7681;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Status Row */
.status-row {
  margin-bottom: 0.75rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-active {
  background: rgba(0, 255, 242, 0.15);
  border: 1px solid rgba(0, 255, 242, 0.3);
  color: #00fff2;
}

.status-pending {
  background: rgba(139, 148, 158, 0.1);
  border: 1px solid rgba(139, 148, 158, 0.2);
  color: #8b949e;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00fff2;
  box-shadow: 0 0 8px #00fff2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-icon {
  font-weight: bold;
}

/* Actions Row */
.actions-row {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  color: #ffd700;
  border-color: rgba(255, 215, 0, 0.3);
}

.btn-primary:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.btn-secondary {
  color: #8b949e;
}

.btn-secondary:hover {
  background: rgba(139, 148, 158, 0.1);
  border-color: #8b949e;
}

.btn-danger {
  color: #ff3131;
  border-color: rgba(255, 49, 49, 0.3);
}

.btn-danger:hover {
  background: rgba(255, 49, 49, 0.15);
  border-color: #ff3131;
}

/* Mobile */
@media (max-width: 480px) {
  .hero-section {
    height: 80px;
  }

  .card-content {
    padding: 0.75rem;
  }

  .tournament-name {
    font-size: 0.8rem;
  }

  .tournament-meta {
    font-size: 0.6rem;
  }

  .actions-row {
    gap: 0.375rem;
  }

  .btn-action {
    padding: 0.375rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>
