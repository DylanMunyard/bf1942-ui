<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm table-fixed">
      <thead>
        <tr class="text-slate-400 text-left border-b border-slate-700/50 whitespace-nowrap">
          <th class="pb-2 pr-2 font-medium">Server</th>
          <th class="pb-2 px-2 font-medium text-center w-14">Status</th>
          <th class="pb-2 px-2 font-medium text-right w-16">Rounds</th>
          <th class="pb-2 pl-3 font-medium w-24 hidden sm:table-cell">Win Stats</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="server in servers"
          :key="server.serverGuid"
          class="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
          @click="emit('navigate', server.serverGuid)"
        >
          <td class="py-2 pr-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-slate-200 truncate">{{ server.serverName }}</span>
              <span class="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 flex-shrink-0">
                {{ getGameLabel(server.game) }}
              </span>
              <span class="text-cyan-400 text-xs flex-shrink-0">→</span>
            </div>
          </td>
          <td class="py-2 px-2 text-center">
            <div
              :class="[
                'inline-flex w-2.5 h-2.5 rounded-full',
                server.isOnline ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'
              ]"
              :title="server.isOnline ? 'Online' : 'Offline'"
            />
          </td>
          <td class="py-2 px-2 text-right text-slate-400 tabular-nums">{{ server.totalRoundsOnMap }}</td>
          <td class="py-2 pl-3 hidden sm:table-cell">
            <div class="h-2 rounded-full overflow-hidden bg-slate-700/50 flex">
              <div
                class="bg-red-500"
                :style="{ width: `${server.winStats.team1WinPercentage}%` }"
                :title="`${server.winStats.team1Label}: ${server.winStats.team1WinPercentage}%`"
              />
              <div
                class="bg-blue-500"
                :style="{ width: `${server.winStats.team2WinPercentage}%` }"
                :title="`${server.winStats.team2Label}: ${server.winStats.team2WinPercentage}%`"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ServerOnMap } from '../../services/dataExplorerService';

defineProps<{
  servers: ServerOnMap[];
}>();

const emit = defineEmits<{
  (e: 'navigate', serverGuid: string): void;
}>();

const getGameLabel = (game: string): string => {
  switch (game.toLowerCase()) {
    case 'bf1942': return 'BF42';
    case 'fh2': return 'FH2';
    case 'bfvietnam': return 'BFV';
    default: return game.toUpperCase();
  }
};
</script>
