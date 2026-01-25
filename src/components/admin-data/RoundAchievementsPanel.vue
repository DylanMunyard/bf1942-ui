<template>
  <div class="round-ach-panel">
    <div class="round-ach-panel-head">
      <h3 class="round-ach-panel-title">[ ACHIEVEMENTS IN ROUND ]</h3>
      <button type="button" class="round-ach-panel-close" @click="$emit('close')">×</button>
    </div>
    <div class="round-ach-panel-body">
      <template v-if="loading">
        <div class="round-ach-empty">
          <span class="round-ach-empty-dash">—</span>
          <span class="round-ach-empty-text">loading...</span>
        </div>
      </template>
      <template v-else-if="!achievements || achievements.length === 0">
        <div class="round-ach-empty">
          <span class="round-ach-empty-dash">∅</span>
          <span class="round-ach-empty-text">no achievements in this round</span>
        </div>
      </template>
      <template v-else>
        <div class="round-ach-table-wrap">
          <table class="round-ach-table">
            <thead>
              <tr>
                <th>player</th>
                <th>achievement</th>
                <th>tier</th>
                <th>time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(a, i) in achievements" :key="`${a.playerName}-${a.achievedAt}-${i}`">
                <td>{{ a.playerName }}</td>
                <td class="round-ach-cell-achievement">
                  <img
                    :src="getAchievementImage(a.achievementId, a.tier)"
                    :alt="a.achievementName"
                    class="round-ach-img"
                    @error="(e) => { (e.target as HTMLImageElement).src = getAchievementImage('kill_streak_10'); }"
                  />
                  {{ a.achievementName }}
                </td>
                <td class="round-ach-mono round-ach-tier">{{ a.tier || '–' }}</td>
                <td class="round-ach-mono">{{ formatTime(a.achievedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAchievementImageFromObject } from '@/utils/achievementImageUtils';
import type { RoundAchievement } from '@/services/adminDataService';

defineProps<{
  roundId: string;
  achievements: RoundAchievement[];
  loading: boolean;
}>();

defineEmits<{
  close: [];
}>();

function getAchievementImage(achievementId: string, tier?: string): string {
  return getAchievementImageFromObject({ achievementId, tier: tier ?? '' });
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.round-ach-panel {
  --rap-bg: #0c0c12;
  --rap-border: #1a1a24;
  --rap-accent: #00e5a0;
  --rap-accent-dim: rgba(0, 229, 160, 0.12);
  --rap-text: #9ca3af;
  --rap-text-bright: #e5e7eb;
  background: var(--rap-bg);
  border: 1px solid var(--rap-border);
  border-radius: 2px;
  overflow: hidden;
}
.round-ach-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--rap-border);
  background: rgba(17, 17, 24, 0.6);
}
.round-ach-panel-title {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--rap-accent);
  margin: 0;
  font-family: ui-monospace, monospace;
}
.round-ach-panel-close {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--rap-text);
  background: transparent;
  border: 1px solid var(--rap-border);
  border-radius: 2px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.round-ach-panel-close:hover {
  color: var(--rap-text-bright);
  border-color: rgba(0, 229, 160, 0.4);
  background: var(--rap-accent-dim);
}
.round-ach-panel-body {
  padding: 1rem 1.25rem;
}
.round-ach-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--rap-text);
  font-size: 0.8rem;
}
.round-ach-empty-dash {
  font-size: 1.5rem;
  color: var(--rap-accent);
  opacity: 0.5;
  font-family: ui-monospace, monospace;
}
.round-ach-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--rap-border);
  border-radius: 2px;
}
.round-ach-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
}
.round-ach-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: rgba(26, 26, 36, 0.8);
  color: var(--rap-accent);
  font-weight: 600;
  letter-spacing: 0.04em;
  font-family: ui-monospace, monospace;
  border-bottom: 1px solid var(--rap-border);
}
.round-ach-table td {
  padding: 0.45rem 0.75rem;
  border-top: 1px solid var(--rap-border);
  color: var(--rap-text-bright);
}
.round-ach-table tbody tr:hover td {
  background: var(--rap-accent-dim);
}
.round-ach-cell-achievement {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.round-ach-img {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  flex-shrink: 0;
}
.round-ach-mono {
  font-family: ui-monospace, monospace;
}
.round-ach-tier {
  text-transform: capitalize;
}
</style>
