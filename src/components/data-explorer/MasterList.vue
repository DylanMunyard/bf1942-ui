<template>
  <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
    <!-- List Header -->
    <div class="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
      <span class="text-slate-300 font-medium">
        {{ mode === 'servers' ? 'Servers' : 'Maps' }}
        <span class="text-slate-500 text-sm ml-2">
          ({{ filteredItems.length }})
        </span>
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-4">
      <div v-for="i in 8" :key="i" class="animate-pulse mb-3">
        <div class="h-14 bg-slate-700/50 rounded-lg"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6 text-center">
      <div class="text-red-400 mb-2">Failed to load data</div>
      <button
        @click="loadData"
        class="text-cyan-400 hover:text-cyan-300 text-sm"
      >
        Try again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredItems.length === 0" class="p-6 text-center text-slate-400">
      <div class="text-3xl mb-2">{{ mode === 'servers' ? '🖥️' : '🗺️' }}</div>
      <p>No {{ mode }} found</p>
    </div>

    <!-- List -->
    <div v-else class="max-h-[calc(100vh-280px)] overflow-y-auto">
      <template v-if="mode === 'servers'">
        <ServerListItem
          v-for="server in filteredServers"
          :key="server.guid"
          :server="server"
          :is-selected="selectedItem === server.guid"
          @click="emit('select', server.guid)"
        />
      </template>
      <template v-else>
        <MapListItem
          v-for="map in filteredMaps"
          :key="map.mapName"
          :map="map"
          :is-selected="selectedItem === map.mapName"
          @click="emit('select', map.mapName)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { fetchServers, fetchMaps, type ServerSummary, type MapSummary } from '../../services/dataExplorerService';
import ServerListItem from './ServerListItem.vue';
import MapListItem from './MapListItem.vue';

const props = defineProps<{
  mode: 'servers' | 'maps';
  searchQuery: string;
  selectedItem: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', item: string | null): void;
}>();

// Data state
const servers = ref<ServerSummary[]>([]);
const maps = ref<MapSummary[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed filtered items
const filteredServers = computed(() => {
  if (!props.searchQuery) return servers.value;
  const query = props.searchQuery.toLowerCase();
  return servers.value.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.game.toLowerCase().includes(query) ||
    (s.country && s.country.toLowerCase().includes(query))
  );
});

const filteredMaps = computed(() => {
  if (!props.searchQuery) return maps.value;
  const query = props.searchQuery.toLowerCase();
  return maps.value.filter(m =>
    m.mapName.toLowerCase().includes(query)
  );
});

const filteredItems = computed(() => {
  return props.mode === 'servers' ? filteredServers.value : filteredMaps.value;
});

// Load data
const loadData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    if (props.mode === 'servers') {
      const response = await fetchServers();
      servers.value = response.servers;
    } else {
      const response = await fetchMaps();
      maps.value = response.maps;
    }
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load data';
  } finally {
    isLoading.value = false;
  }
};

// Load data on mount and mode change
onMounted(loadData);
watch(() => props.mode, () => {
  // Only reload if we don't have data for this mode
  if (props.mode === 'servers' && servers.value.length === 0) {
    loadData();
  } else if (props.mode === 'maps' && maps.value.length === 0) {
    loadData();
  }
});
</script>
