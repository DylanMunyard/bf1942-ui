<template>
  <div class="min-h-screen bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <DataExplorerHeader
        v-model:mode="currentMode"
        v-model:search="searchQuery"
      />

      <!-- Content Area -->
      <div class="flex flex-col lg:flex-row gap-6 mt-6">
        <!-- Master List (Left Panel) -->
        <div class="w-full lg:w-2/5 xl:w-1/3">
          <MasterList
            :mode="currentMode"
            :search-query="debouncedSearchQuery"
            :selected-item="selectedItem"
            @select="handleSelect"
          />
        </div>

        <!-- Detail Panel (Right Panel) -->
        <div class="flex-1">
          <DetailPanel :is-open="!!selectedItem">
            <template v-if="currentMode === 'servers' && selectedServerGuid">
              <ServerDetailPanel
                :server-guid="selectedServerGuid"
                @navigate-to-map="handleNavigateToMap"
              />
            </template>
            <template v-else-if="currentMode === 'maps' && selectedMapName">
              <MapDetailPanel
                :map-name="selectedMapName"
                @navigate-to-server="handleNavigateToServer"
              />
            </template>
            <template v-else>
              <div class="flex flex-col items-center justify-center h-64 text-slate-400">
                <div class="text-4xl mb-4">
                  {{ currentMode === 'servers' ? '🖥️' : '🗺️' }}
                </div>
                <p class="text-lg">
                  Select a {{ currentMode === 'servers' ? 'server' : 'map' }} to view details
                </p>
              </div>
            </template>
          </DetailPanel>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataExplorerHeader from '../components/data-explorer/DataExplorerHeader.vue';
import MasterList from '../components/data-explorer/MasterList.vue';
import DetailPanel from '../components/data-explorer/DetailPanel.vue';
import ServerDetailPanel from '../components/data-explorer/ServerDetailPanel.vue';
import MapDetailPanel from '../components/data-explorer/MapDetailPanel.vue';

const route = useRoute();
const router = useRouter();

// Mode state
const currentMode = ref<'servers' | 'maps'>('servers');

// Search state
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
let searchTimeout: number | null = null;

// Selection state
const selectedItem = ref<string | null>(null);

// Flag to prevent mode watcher from resetting selection during cross-navigation
let isCrossNavigating = false;

// Computed selection based on mode
const selectedServerGuid = computed(() =>
  currentMode.value === 'servers' ? selectedItem.value : null
);

const selectedMapName = computed(() =>
  currentMode.value === 'maps' ? selectedItem.value : null
);

// Debounce search
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue;
  }, 300) as unknown as number;
});

// Handle route changes
const updateFromRoute = () => {
  const path = route.path;

  if (path.startsWith('/explore/maps/')) {
    currentMode.value = 'maps';
    selectedItem.value = decodeURIComponent(route.params.mapName as string);
  } else if (path.startsWith('/explore/servers/')) {
    currentMode.value = 'servers';
    selectedItem.value = route.params.serverGuid as string;
  } else if (path === '/explore/maps') {
    currentMode.value = 'maps';
    selectedItem.value = null;
  } else {
    currentMode.value = 'servers';
    selectedItem.value = null;
  }
};

// Watch route changes
watch(() => route.fullPath, updateFromRoute);

// Initialize from route
onMounted(updateFromRoute);

// Handle selection
const handleSelect = (item: string | null) => {
  selectedItem.value = item;

  if (item) {
    if (currentMode.value === 'servers') {
      router.push({ name: 'explore-server-detail', params: { serverGuid: item } });
    } else {
      router.push({ name: 'explore-map-detail', params: { mapName: encodeURIComponent(item) } });
    }
  } else {
    if (currentMode.value === 'servers') {
      router.push({ name: 'explore-servers' });
    } else {
      router.push({ name: 'explore-maps' });
    }
  }
};

// Handle cross-navigation
const handleNavigateToMap = (mapName: string) => {
  isCrossNavigating = true;
  currentMode.value = 'maps';
  selectedItem.value = mapName;
  router.push({ name: 'explore-map-detail', params: { mapName: encodeURIComponent(mapName) } });
  // Reset flag after next tick to ensure mode watcher completes
  nextTick(() => {
    isCrossNavigating = false;
  });
};

const handleNavigateToServer = (serverGuid: string) => {
  isCrossNavigating = true;
  currentMode.value = 'servers';
  selectedItem.value = serverGuid;
  router.push({ name: 'explore-server-detail', params: { serverGuid } });
  // Reset flag after next tick to ensure mode watcher completes
  nextTick(() => {
    isCrossNavigating = false;
  });
};

// Watch mode changes and update route
watch(currentMode, (newMode, oldMode) => {
  if (newMode !== oldMode && !isCrossNavigating) {
    selectedItem.value = null;
    if (newMode === 'servers') {
      router.push({ name: 'explore-servers' });
    } else {
      router.push({ name: 'explore-maps' });
    }
  }
});
</script>
