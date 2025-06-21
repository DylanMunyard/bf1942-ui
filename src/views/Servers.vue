<template>
  <div class="servers-container">
    <ServerTable :initialMode="props.initialMode" @show-players="showPlayersModal" />
    
    <!-- Players Modal -->
    <PlayersModal 
      :show="showModal" 
      :server="selectedServer" 
      @close="closeModal" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ServerTable from '../components/ServerTable.vue';
import PlayersModal from '../components/PlayersModal.vue';
import { ServerInfo } from '../types/server';

// Props from router
interface Props {
  initialMode?: 'FH2' | '42';
}

const props = defineProps<Props>();

const showModal = ref(false);
const selectedServer = ref<ServerInfo | null>(null);

// Show players modal when ServerTable emits the event
const showPlayersModal = (server: ServerInfo) => {
  selectedServer.value = server;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedServer.value = null;
};
</script>

<style scoped>
.servers-container {
  background-color: var(--color-background);
  border-radius: 0;
  box-shadow: none;
  padding: 12px;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .servers-container {
    padding: 8px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .servers-container {
    padding: 4px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .servers-container {
    padding: 4px;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .servers-container {
    padding: 4px;
  }
}
</style> 