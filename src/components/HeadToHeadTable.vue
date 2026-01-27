<script setup lang="ts">
import { computed } from 'vue';

interface HeadToHeadEncounter {
  timestamp: string;
  serverGuid: string;
  mapName: string;
  player1Score: number;
  player1Kills: number;
  player1Deaths: number;
  player2Score: number;
  player2Kills: number;
  player2Deaths: number;
  roundId?: string;
}

interface Props {
  headToHead: HeadToHeadEncounter[];
  player1Name: string;
  player2Name: string;
  player1Input: string;
  player2Input: string;
}

const props = defineProps<Props>();

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sortedHeadToHead = computed(() => {
  if (!props.headToHead) return [];
  
  return [...props.headToHead].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
});
</script>

<template>
  <div
    v-if="headToHead && headToHead.length > 0"
    class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
  >
    <div class="p-6 border-b border-slate-700/50">
      <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 flex items-center gap-3">
        ⚔️ Head-to-Head Encounters
      </h3>
    </div>
    <div class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <!-- Table Header -->
          <thead class="sticky top-0 z-10">
            <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
              <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 min-w-[120px]">
                <div class="flex items-center gap-2">
                  <span class="text-slate-400 text-xs">📅</span>
                  <span class="font-mono font-bold">DATE</span>
                </div>
              </th>
              <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 min-w-[140px]">
                <div class="flex items-center gap-2">
                  <span class="text-blue-400 text-xs">🗺️</span>
                  <span class="font-mono font-bold">MAP</span>
                </div>
              </th>
              
              <!-- Player 1 Headers -->
              <th
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-cyan-400 border-b border-slate-700/30 bg-cyan-500/10 border-l-4 border-l-cyan-400/60"
                colspan="3"
              >
                <div class="flex items-center justify-center gap-2">
                  <span class="font-mono font-bold text-sm">{{ player1Name }}</span>
                </div>
              </th>
              
              <!-- Player 2 Headers -->
              <th
                class="p-2 text-center font-bold text-xs uppercase tracking-wide text-orange-400 border-b border-slate-700/30 bg-orange-500/10 border-l-4 border-l-orange-400/60"
                colspan="3"
              >
                <div class="flex items-center justify-center gap-2">
                  <span class="font-mono font-bold text-sm">{{ player2Name }}</span>
                </div>
              </th>
            </tr>
            <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
              <th class="p-2 border-b border-slate-700/30" />
              <th class="p-2 border-b border-slate-700/30" />
              
              <!-- Player 1 Sub Headers -->
              <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-l-4 border-l-cyan-400/60">
                <div class="flex items-center justify-center gap-1">
                  <span>🎖️</span>
                  <span class="font-mono">SCORE</span>
                </div>
              </th>
              <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                <div class="flex items-center justify-center gap-1">
                  <span>⚔️</span>
                  <span class="font-mono">KILLS</span>
                </div>
              </th>
              <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-r-4 border-r-cyan-400/60">
                <div class="flex items-center justify-center gap-1">
                  <span>☠️</span>
                  <span class="font-mono">DEATHS</span>
                </div>
              </th>
              
              <!-- Player 2 Sub Headers -->
              <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5 border-l-4 border-l-orange-400/60">
                <div class="flex items-center justify-center gap-1">
                  <span>🎖️</span>
                  <span class="font-mono">SCORE</span>
                </div>
              </th>
              <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                <div class="flex items-center justify-center gap-1">
                  <span>⚔️</span>
                  <span class="font-mono">KILLS</span>
                </div>
              </th>
              <th class="p-2 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                <div class="flex items-center justify-center gap-1">
                  <span>☠️</span>
                  <span class="font-mono">DEATHS</span>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody>
            <tr
              v-for="(encounter, index) in sortedHeadToHead"
              :key="index"
              class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/20"
            >
              <!-- Date -->
              <td class="p-2">
                <router-link 
                  v-if="encounter.roundId"
                  :to="{
                    name: 'round-report',
                    params: {
                      roundId: encounter.roundId
                    },
                    query: {
                      players: `${player1Input},${player2Input}`
                    }
                  }"
                  class="group/link flex flex-col gap-1 hover:bg-blue-600/20 hover:border-blue-500/50 border border-transparent rounded-lg p-2 transition-all duration-300 transform hover:scale-105"
                  :title="`View round report for ${encounter.mapName} on ${formatDate(encounter.timestamp)} with ${player1Input} and ${player2Input} highlighted`"
                >
                  <div class="text-slate-200 font-bold text-xs group-hover/link:text-blue-400">
                    {{ formatDate(encounter.timestamp) }}
                  </div>
                  <div class="text-slate-400 text-xs font-mono group-hover/link:text-blue-300">
                    {{ formatTime(encounter.timestamp) }}
                  </div>
                </router-link>
                <div v-else class="flex flex-col gap-1 p-2">
                  <div class="text-slate-200 font-bold text-xs">
                    {{ formatDate(encounter.timestamp) }}
                  </div>
                  <div class="text-slate-400 text-xs font-mono">
                    {{ formatTime(encounter.timestamp) }}
                  </div>
                </div>
              </td>
              
              <!-- Map -->
              <td class="p-2">
                <div class="font-bold text-blue-400 text-xs truncate font-mono uppercase">
                  {{ encounter.mapName }}
                </div>
              </td>

              <!-- Player 1 Stats -->
              <td class="p-2 text-center bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ encounter.player1Score?.toLocaleString() }}
                </div>
              </td>
              <td class="p-2 text-center bg-cyan-500/5">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ encounter.player1Kills }}
                </div>
              </td>
              <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ encounter.player1Deaths }}
                </div>
              </td>

              <!-- Player 2 Stats -->
              <td class="p-2 text-center bg-orange-500/5 border-l-2 border-l-orange-400/40">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ encounter.player2Score?.toLocaleString() }}
                </div>
              </td>
              <td class="p-2 text-center bg-orange-500/5">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ encounter.player2Kills }}
                </div>
              </td>
              <td class="p-2 text-center bg-orange-500/5">
                <div class="text-slate-200 font-bold text-xs font-mono">
                  {{ encounter.player2Deaths }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
