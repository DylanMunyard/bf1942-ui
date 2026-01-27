<script setup lang="ts">
interface ServerDetails {
  guid: string;
  name: string;
  country?: string;
}

interface Props {
  commonServers: ServerDetails[];
  selectedServerGuid?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'select': [serverGuid: string];
  'clear': [];
}>();
</script>

<template>
  <div
    v-if="commonServers && commonServers.length > 0"
    class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden"
  >
    <div class="p-6">
      <div class="mb-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h3 class="text-lg font-bold text-slate-200 flex items-center gap-2">
              🎮 Compare performance on specific servers
              <span
                v-if="selectedServerGuid"
                class="text-sm font-normal text-slate-400"
              >(🎯 Currently: {{ commonServers.find(s => s.guid === selectedServerGuid)?.name }})</span>
            </h3>
            <p class="text-sm text-slate-400 mt-1">
              Select a server to focus the comparison
            </p>
          </div>
          <button 
            v-if="selectedServerGuid"
            class="self-start sm:self-auto px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-600/50 hover:border-slate-500/50 rounded-lg text-slate-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
            title="View comparison across all common servers"
            @click="$emit('clear')"
          >
            <span>🌍</span>
            All Servers
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button 
          v-for="server in commonServers" 
          :key="server.guid"
          class="group relative p-3 rounded-lg transition-all duration-300 text-left transform hover:scale-105"
          :class="{ 
            'bg-gradient-to-r from-blue-600/80 to-purple-600/80 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20': selectedServerGuid === server.guid,
            'bg-slate-800/40 border-2 border-slate-700/50 hover:bg-slate-700/60 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10': selectedServerGuid !== server.guid
          }"
          :title="`Compare performance on ${server.name}`"
          @click="$emit('select', server.guid)"
        >
          <!-- Selected indicator -->
          <div
            v-if="selectedServerGuid === server.guid"
            class="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold"
          >
            ✓
          </div>
          
          <div class="flex items-center justify-between">
            <div
              class="font-bold text-base truncate pr-2"
              :class="{ 
                'text-white': selectedServerGuid === server.guid,
                'text-slate-200 group-hover:text-blue-400': selectedServerGuid !== server.guid
              }"
            >
              {{ server.name }}
            </div>
            
            <span
              v-if="server.country"
              class="text-sm font-medium flex items-center gap-1 flex-shrink-0"
              :class="{ 
                'text-blue-100': selectedServerGuid === server.guid,
                'text-slate-400 group-hover:text-blue-300': selectedServerGuid !== server.guid
              }"
            >
              🌍 {{ server.country }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
