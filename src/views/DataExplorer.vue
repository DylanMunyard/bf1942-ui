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
          <DetailPanel :is-open="!!selectedItem || isServerMapView">
            <!-- Container for layered panels -->
            <div class="relative">
              <!-- Server Detail (base layer, stays mounted when viewing server-map) -->
              <div v-if="currentMode === 'servers' && selectedServerGuid && !isServerMapView">
                <ServerDetailPanel
                  :server-guid="selectedServerGuid"
                  @navigate-to-map="handleNavigateToMap"
                />
              </div>
              <!-- Map Detail -->
              <template v-if="currentMode === 'maps' && selectedMapName && !isServerMapView">
                <MapDetailPanel
                  :map-name="selectedMapName"
                  @navigate-to-server="handleNavigateToServer"
                />
              </template>
              <!-- Empty State -->
              <template v-if="!selectedItem && !isServerMapView">
                <div class="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div class="text-4xl mb-4">
                    {{ currentMode === 'servers' ? '🖥️' : '🗺️' }}
                  </div>
                  <p class="text-lg">
                    Select a {{ currentMode === 'servers' ? 'server' : 'map' }} to view details
                  </p>
                </div>
              </template>

              <!-- Server-Map Detail View (replaces content instead of overlaying) -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 translate-x-4"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-4"
              >
                <div
                  v-if="isServerMapView && serverMapGuid && serverMapMapName"
                  class="overflow-y-auto"
                >
                  <ServerMapDetailPanel
                    :server-guid="serverMapGuid"
                    :map-name="serverMapMapName"
                    @navigate-to-server="handleNavigateBackToServer"
                    @navigate-to-map="handleNavigateBackToMap"
                    @close="handleCloseServerMapView"
                  />
                </div>
              </Transition>
            </div>
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
import ServerMapDetailPanel from '../components/data-explorer/ServerMapDetailPanel.vue';

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

// Server-Map view state
const isServerMapView = ref(false);
const serverMapGuid = ref<string | null>(null);
const serverMapMapName = ref<string | null>(null);

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

  // Check for server-map detail route: /explore/servers/:guid/maps/:mapName
  const serverMapMatch = path.match(/^\/explore\/servers\/([^/]+)\/maps\/(.+)$/);
  if (serverMapMatch) {
    isServerMapView.value = true;
    serverMapGuid.value = serverMapMatch[1];
    serverMapMapName.value = decodeURIComponent(serverMapMatch[2]);
    // Keep server selected in the master list for context
    currentMode.value = 'servers';
    selectedItem.value = serverMapMatch[1];
    return;
  }

  // Reset server-map view state
  isServerMapView.value = false;
  serverMapGuid.value = null;
  serverMapMapName.value = null;

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
  // Reset server-map view when selecting from master list
  isServerMapView.value = false;
  serverMapGuid.value = null;
  serverMapMapName.value = null;

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

// Handle cross-navigation - now goes to server-map detail page
const handleNavigateToMap = (mapName: string) => {
  // Navigate to server-map detail page (from server detail view)
  if (selectedServerGuid.value) {
    router.push({
      name: 'explore-server-map-detail',
      params: {
        serverGuid: selectedServerGuid.value,
        mapName: mapName
      }
    });
  }
};

const handleNavigateToServer = (serverGuid: string) => {
  // Navigate to server-map detail page (from map detail view)
  if (selectedMapName.value) {
    router.push({
      name: 'explore-server-map-detail',
      params: {
        serverGuid,
        mapName: selectedMapName.value
      }
    });
  }
};

// Handle close button on server-map detail (go back to server detail without reload)
const handleCloseServerMapView = () => {
  if (serverMapGuid.value) {
    // Navigate back to server detail - ServerDetailPanel is already mounted so no reload
    router.push({ name: 'explore-server-detail', params: { serverGuid: serverMapGuid.value } });
  }
};

// Handle breadcrumb navigation back from server-map detail
const handleNavigateBackToServer = (serverGuid: string) => {
  isCrossNavigating = true;
  currentMode.value = 'servers';
  selectedItem.value = serverGuid;
  router.push({ name: 'explore-server-detail', params: { serverGuid } });
  nextTick(() => {
    isCrossNavigating = false;
  });
};

const handleNavigateBackToMap = (mapName: string) => {
  isCrossNavigating = true;
  currentMode.value = 'maps';
  selectedItem.value = mapName;
  router.push({ name: 'explore-map-detail', params: { mapName: mapName } });
  nextTick(() => {
    isCrossNavigating = false;
  });
};

// Watch mode changes and update route
watch(currentMode, (newMode, oldMode) => {
  if (newMode !== oldMode && !isCrossNavigating && !isServerMapView.value) {
    selectedItem.value = null;
    if (newMode === 'servers') {
      router.push({ name: 'explore-servers' });
    } else {
      router.push({ name: 'explore-maps' });
    }
  }
});
</script>
