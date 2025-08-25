<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click="$emit('close')"
  >
    <div
      class="modal-content players-modal"
      @click.stop
    >
      <div class="modal-header">
        <div class="header-left">
          <h2>🗺️ {{ server?.mapName || 'Unknown Map' }}</h2>
          <div class="server-name-header">
            {{ server?.name || 'Unknown Server' }}
          </div>
          <div
            v-if="server?.ip && server?.port"
            class="server-address-header"
          >
            🌐 {{ server.ip }}:{{ server.port }}
          </div>
        </div>
        <button
          class="close-button"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>
      <div class="modal-body">
        <div
          v-if="server && server.players.length > 0"
          class="leaderboard-section"
        >
          <PlayerLeaderboard 
            :players="server.players.map(player => ({
              name: player.name,
              score: player.score,
              kills: player.kills,
              deaths: player.deaths,
              ping: player.ping,
              team: player.team,
              teamLabel: player.teamLabel
            }))"
            :teams="server.teams"
            source="players-modal"
            :server-guid="server.guid"
          />
        </div>
        <div
          v-else-if="server && server.players.length === 0"
          class="no-players"
        >
          No players currently on this server
        </div>
        <div
          v-else
          class="no-data"
        >
          No server data available
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ServerSummary } from '../types/server';
import PlayerLeaderboard from './PlayerLeaderboard.vue';

interface Props {
  show: boolean;
  server: ServerSummary | null;
}

defineProps<Props>();

// Emits
defineEmits<{
  close: [];
}>();
</script>

<style scoped>
/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  @apply bg-slate-900/95 backdrop-blur-md border border-slate-700/50;
  border-radius: 16px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.players-modal {
  @apply bg-slate-900/60;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-mute);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-left h2 {
  margin: 0;
  color: var(--color-heading);
}

.server-name-header {
  font-size: 0.9rem;
  color: var(--color-primary);
}

.server-address-header {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-family: monospace;
  margin-top: 2px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text);
  padding: 4px;
  border-radius: 4px;
}

.close-button:hover {
  @apply bg-slate-700/50;
}

.modal-body {
  padding: 20px;
}

.leaderboard-section {
  @apply bg-slate-900/40;
}

.no-players, .no-data {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .modal-content {
    width: 98%;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 15px;
  }
}
</style>