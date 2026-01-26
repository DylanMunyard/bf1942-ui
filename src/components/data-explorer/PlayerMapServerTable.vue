<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-slate-400 text-left border-b border-slate-700/50">
          <th class="pb-2 font-medium">#</th>
          <th class="pb-2 font-medium">Server</th>
          <th class="pb-2 font-medium text-right">Score</th>
          <th class="pb-2 font-medium text-right">Kills</th>
          <th class="pb-2 font-medium text-right">K/D</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="server in serverStats"
          :key="server.serverGuid"
          class="border-b border-slate-700/30"
        >
          <td class="py-1.5">
            <span :class="getRankClass(server.rank)">{{ server.rank }}</span>
          </td>
          <td class="py-1.5 max-w-[200px] truncate" :title="server.serverName">
            <button
              @click="handleServerClick(server.serverGuid)"
              class="text-slate-300 hover:text-cyan-400 transition-colors text-left"
            >
              {{ server.serverName }}
            </button>
          </td>
          <td class="py-1.5 text-right text-slate-300">{{ server.totalScore.toLocaleString() }}</td>
          <td class="py-1.5 text-right text-slate-400">{{ server.totalKills.toLocaleString() }}</td>
          <td class="py-1.5 text-right text-slate-400">{{ server.kdRatio.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="serverStats.length === 0" class="text-center text-slate-500 py-4">
      No server data available
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerServerStats } from '../../services/dataExplorerService';
import { getRankClass } from '@/utils/statsUtils';

defineProps<{
  serverStats: PlayerServerStats[];
}>();

const emit = defineEmits<{
  'navigate-to-server': [serverGuid: string];
}>();

const handleServerClick = (serverGuid: string) => {
  emit('navigate-to-server', serverGuid);
};
</script>
