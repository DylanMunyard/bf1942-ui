<template>
  <div class="portal-page">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
      <div class="data-explorer">
        <div class="explorer-inner">
          <!-- Header -->
          <DataExplorerHeader
        v-model:mode="currentMode"
        v-model:search="searchQuery"
      />

      <!-- Content Area -->
      <div class="explorer-layout">
        <!-- Master List (Left Panel) -->
        <div class="explorer-sidebar">
          <MasterList
            :mode="currentMode"
            :search-query="debouncedSearchQuery"
            :selected-item="selectedItem"
            @select="handleSelect"
            @game-change="handleGameChange"
          />
        </div>

        <!-- Detail Panel (Right Panel) -->
        <div class="explorer-main">
          <!-- Side-by-side layout for server-map view on large screens -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="isServerMapView && serverMapGuid && serverMapMapName"
              class="flex flex-col xl:flex-row gap-6"
            >
              <!-- Server Detail (left side on xl+, hidden on smaller screens) -->
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-x-8"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 -translate-x-4"
              >
                <div
                  v-if="isServerMapView && serverMapGuid && serverMapMapName"
                  class="hidden xl:block xl:w-1/2 xl:max-h-[calc(100vh-8rem)]"
                >
                  <DetailPanel :is-open="true">
                    <div class="max-h-[calc(100vh-8rem)] overflow-y-auto">
                      <ServerDetailPanel
                        :server-guid="serverMapGuid"
                        @navigate-to-map="handleNavigateToMap"
                      />
                    </div>
                  </DetailPanel>
                </div>
              </Transition>
              <!-- Map Detail (right side on xl+, full width on smaller screens) -->
              <div class="xl:w-1/2 xl:max-h-[calc(100vh-8rem)]">
                <DetailPanel :is-open="true">
                  <Transition
                    enter-active-class="transition-all duration-300 ease-out"
                    enter-from-class="opacity-0 translate-x-4"
                    enter-to-class="opacity-100 translate-x-0"
                    leave-active-class="transition-all duration-200 ease-in"
                    leave-from-class="opacity-100 translate-x-0"
                    leave-to-class="opacity-0 translate-x-4"
                  >
                    <div class="max-h-[calc(100vh-8rem)] overflow-y-auto">
                      <ServerMapDetailPanel
                        :server-guid="serverMapGuid"
                        :map-name="serverMapMapName"
                        @navigate-to-server="handleNavigateBackToServer"
                        @navigate-to-map="handleNavigateBackToMap"
                        @close="handleCloseServerMapView"
                      />
                    </div>
                  </Transition>
                </DetailPanel>
              </div>
            </div>
          </Transition>
          <!-- Single panel layout for other views -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-x-4"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 -translate-x-8"
          >
            <DetailPanel v-if="!isServerMapView || !serverMapGuid || !serverMapMapName" :is-open="!!selectedItem || isServerMapView">
              <!-- Container for layered panels -->
              <div class="relative">
                <!-- Server Detail (base layer, stays mounted when viewing server-map) -->
                <Transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 translate-x-4"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition-all duration-300 ease-in"
                  leave-from-class="opacity-100 translate-x-0"
                  leave-to-class="opacity-100 -translate-x-8"
                >
                  <div v-if="currentMode === 'servers' && selectedServerGuid && !isServerMapView">
                    <ServerDetailPanel
                      :server-guid="selectedServerGuid"
                      @navigate-to-map="handleNavigateToMap"
                    />
                  </div>
                </Transition>
              <!-- Map Detail -->
              <template v-if="currentMode === 'maps' && selectedMapName && !isServerMapView">
                <MapDetailPanel
                  :map-name="selectedMapName"
                  @navigate-to-server="handleNavigateToServer"
                />
              </template>
              <!-- Player Detail -->
              <template v-if="currentMode === 'players' && selectedPlayerName && !isServerMapView">
                <PlayerDetailPanel
                  :player-name="selectedPlayerName"
                  :game="selectedGame"
                  @navigate-to-server="handleNavigateToServerFromPlayer"
                  @navigate-to-map="handleNavigateToMapFromPlayer"
                />
              </template>
              <!-- Empty State -->
              <template v-if="!selectedItem && !isServerMapView">
                <div class="explorer-empty">
                  <div class="explorer-empty-icon">
                    {{ modeIcon }}
                  </div>
                  <p class="explorer-empty-title">
                    {{ emptyStateText }}
                  </p>
                </div>
              </template>
            </div>
          </DetailPanel>
          </Transition>
        </div>
      </div>
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
import PlayerDetailPanel from '../components/data-explorer/PlayerDetailPanel.vue';
import type { GameType } from '../services/dataExplorerService';

const route = useRoute();
const router = useRouter();

// Mode state
const currentMode = ref<'servers' | 'maps' | 'players'>('servers');

// Game state (for player detail)
const selectedGame = ref<GameType>('bf1942');

// Search state - separate queries per mode
const searchQueries = ref({
  servers: '',
  maps: '',
  players: ''
});
const debouncedSearchQueries = ref({
  servers: '',
  maps: '',
  players: ''
});
let searchTimeout: number | null = null;

// Computed search query for current mode
const searchQuery = computed({
  get: () => searchQueries.value[currentMode.value],
  set: (value: string) => {
    searchQueries.value[currentMode.value] = value;
  }
});

// Computed debounced search query for current mode
const debouncedSearchQuery = computed(() => debouncedSearchQueries.value[currentMode.value]);

// Selection state
const selectedItem = ref<string | null>(null);

// Server-Map view state
const isServerMapView = ref(false);
const serverMapGuid = ref<string | null>(null);
const serverMapMapName = ref<string | null>(null);

// Flag to prevent mode watcher from resetting selection during cross-navigation
let isCrossNavigating = false;

// Flag to prevent mode watcher from firing during initial route load
let isInitialLoad = true;

// Computed selection based on mode
const selectedServerGuid = computed(() =>
  currentMode.value === 'servers' ? selectedItem.value : null
);

const selectedMapName = computed(() =>
  currentMode.value === 'maps' ? selectedItem.value : null
);

const selectedPlayerName = computed(() =>
  currentMode.value === 'players' ? selectedItem.value : null
);

// Mode icon and text
const modeIcon = computed(() => {
  switch (currentMode.value) {
    case 'servers': return '[ ]';
    case 'maps': return '{ }';
    case 'players': return '< >';
    default: return '[ ]';
  }
});

const emptyStateText = computed(() => {
  switch (currentMode.value) {
    case 'servers': return 'Select a server to view details';
    case 'maps': return 'Select a map to view details';
    case 'players': return 'Search for a player to view their rankings';
    default: return 'Select an item to view details';
  }
});

// Handle game change from MasterList
const handleGameChange = (game: GameType) => {
  selectedGame.value = game;
};

// Debounce search - watches the current mode's search query
watch(
  () => searchQueries.value[currentMode.value],
  (newValue) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const mode = currentMode.value; // Capture current mode
    searchTimeout = setTimeout(() => {
      debouncedSearchQueries.value[mode] = newValue;
    }, 300) as unknown as number;
  }
);

// Handle route changes
const updateFromRoute = () => {
  const path = route.path;

  // Check for server-map detail route: /explore/servers/:guid/maps/:mapName
  const serverMapMatch = path.match(/^\/explore\/servers\/([^/]+)\/maps\/(.+)$/);
  if (serverMapMatch) {
    isServerMapView.value = true;
    serverMapGuid.value = serverMapMatch[1];
    // Vue Router decodes params automatically, use route.params for consistency
    serverMapMapName.value = route.params.mapName as string;
    // Keep server selected in the master list for context
    currentMode.value = 'servers';
    selectedItem.value = serverMapMatch[1];
    return;
  }

  // Reset server-map view state
  isServerMapView.value = false;
  serverMapGuid.value = null;
  serverMapMapName.value = null;

  if (path.startsWith('/explore/players/')) {
    currentMode.value = 'players';
    selectedItem.value = route.params.playerName as string;
  } else if (path.startsWith('/explore/maps/')) {
    currentMode.value = 'maps';
    selectedItem.value = route.params.mapName as string;
  } else if (path.startsWith('/explore/servers/')) {
    currentMode.value = 'servers';
    selectedItem.value = route.params.serverGuid as string;
  } else if (path === '/explore/players') {
    currentMode.value = 'players';
    selectedItem.value = null;
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
onMounted(() => {
  updateFromRoute();
  // Allow mode watcher to fire after initial load is complete
  nextTick(() => {
    isInitialLoad = false;
  });
});

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
    } else if (currentMode.value === 'maps') {
      router.push({ name: 'explore-map-detail', params: { mapName: item } });
    } else if (currentMode.value === 'players') {
      router.push({ name: 'explore-player-detail', params: { playerName: item } });
    }
  } else {
    if (currentMode.value === 'servers') {
      router.push({ name: 'explore-servers' });
    } else if (currentMode.value === 'maps') {
      router.push({ name: 'explore-maps' });
    } else if (currentMode.value === 'players') {
      router.push({ name: 'explore-players' });
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

// Handle navigation to server from player detail panel
const handleNavigateToServerFromPlayer = (serverGuid: string) => {
  isCrossNavigating = true;
  currentMode.value = 'servers';
  selectedItem.value = serverGuid;
  router.push({ name: 'explore-server-detail', params: { serverGuid } });
  nextTick(() => {
    isCrossNavigating = false;
  });
};

// Handle navigation to map from player detail panel
const handleNavigateToMapFromPlayer = (mapName: string) => {
  isCrossNavigating = true;
  currentMode.value = 'maps';
  selectedItem.value = mapName;
  router.push({ name: 'explore-map-detail', params: { mapName } });
  nextTick(() => {
    isCrossNavigating = false;
  });
};

// Watch mode changes and update route
watch(currentMode, (newMode, oldMode) => {
  if (newMode !== oldMode && !isCrossNavigating && !isServerMapView.value && !isInitialLoad) {
    // Only navigate to list view if we're not already viewing a specific item
    // This prevents the mode change from overriding navigation to detail pages
    if (!selectedItem.value) {
      if (newMode === 'servers') {
        router.push({ name: 'explore-servers' });
      } else if (newMode === 'maps') {
        router.push({ name: 'explore-maps' });
      } else if (newMode === 'players') {
        router.push({ name: 'explore-players' });
      }
    }
  }
});
</script>

<style src="./portal-layout.css"></style>
<style scoped src="./DataExplorer.vue.css"></style>
