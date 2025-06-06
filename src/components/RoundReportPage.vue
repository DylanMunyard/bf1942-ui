<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import RoundReport from './RoundReport.vue';

interface Props {
  serverGuid: string;
  mapName: string;
  startTime: string;
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
  <div class="round-report-page">
    <RoundReport
      :server-guid="serverGuid"
      :map-name="mapName"
      :start-time="startTime"
      :is-open="showModal"
      @close="handleClose"
    />
  </div>
</template>

<style scoped>
.round-report-page {
  /* No specific styling needed - the modal handles its own overlay */
}
</style> 