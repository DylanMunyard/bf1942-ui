<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SessionDetailsModal from './SessionDetailsModal.vue';

interface Props {
  playerName: string;
  sessionId: number;
}

const props = defineProps<Props>();
const router = useRouter();

// The modal is always open when this page loads
const showModal = ref(true);

// Close handler that goes back in history
const handleClose = () => {
  router.back();
};

// If user navigates directly to this page, ensure modal shows
onMounted(() => {
  showModal.value = true;
});
</script>

<template>
  <div class="session-details-page">
    <SessionDetailsModal
      :player-name="playerName"
      :session-id="sessionId"
      :is-open="showModal"
      @close="handleClose"
    />
  </div>
</template>

<style scoped>
.session-details-page {
  /* No specific styling needed - the modal handles its own overlay */
}
</style> 