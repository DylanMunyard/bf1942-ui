<template>
  <div class="player-card">
    <div
      class="player-rank-small"
      :class="{
        'rank-first': rank === 1,
        'rank-second': rank === 2,
        'rank-third': rank === 3
      }"
    >
      {{ rank }}
    </div>
    <div class="player-card-content">
      <router-link
        :to="`/players/${encodeURIComponent(playerName)}`"
        class="player-card-name"
      >
        {{ playerName }}
      </router-link>
      <div class="player-card-stats">
        <slot name="stats" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rank: number;
  playerName: string;
}

defineProps<Props>();
</script>

<style scoped>
.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  @apply bg-slate-900/60 border border-slate-700/50;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-height: 72px;
}

.player-card:hover {
  @apply bg-slate-800/60;
  border-color: var(--color-primary);
  transform: translateX(4px);
}

.player-rank-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--color-background-mute);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
}

.player-rank-small.rank-first {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.player-rank-small.rank-second {
  background: linear-gradient(135deg, #c0c0c0 0%, #e6e6e6 100%);
  color: #333;
  border-color: #c0c0c0;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
}

.player-rank-small.rank-third {
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
  color: #333;
  border-color: #cd7f32;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.3);
}

.player-card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.player-card-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  display: block;
  line-height: 1.3;
  margin: 0;
}

.player-card-name:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.player-card-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.83rem;
  color: var(--color-text-muted);
  flex-wrap: wrap;
  line-height: 1.2;
  max-height: 2.4rem;
  overflow: hidden;
}

/* Mobile styles */
@media (max-width: 480px) {
  .player-card {
    padding: 8px;
    min-height: 64px;
  }
  
  .player-rank-small {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}
</style>