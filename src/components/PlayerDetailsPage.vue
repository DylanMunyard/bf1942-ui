<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PlayerStatsModal from './PlayerStatsModal.vue';
import { fetchPlayerStats, PlayerTimeStatistics } from '../services/playerStatsService';

interface Props {
  playerName: string;
}

const props = defineProps<Props>();
const router = useRouter();

// Modal and data state
const showModal = ref(true);
const playerStats = ref<PlayerTimeStatistics | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch player data
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const stats = await fetchPlayerStats(props.playerName);
    playerStats.value = stats;
  } catch (err) {
    console.error('Error fetching player stats:', err);
    error.value = 'Failed to fetch player statistics';
  } finally {
    isLoading.value = false;
  }
};

// Close handler that goes back in history
const handleClose = () => {
  router.back();
};

// Fetch data when component mounts
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="player-details-page">
    <PlayerStatsModal
      :player-name="playerName"
      :player-stats="playerStats"
      :is-open="showModal"
      :is-loading="isLoading"
      :error="error"
      @close="handleClose"
    />
  </div>
</template>

<style scoped>
.player-details-page {
  /* No specific styling needed - the modal handles its own overlay */
}
</style> 