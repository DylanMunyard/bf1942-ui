<script setup lang="ts">
import RoundReport from './RoundReport.vue';

interface Props {
  serverGuid: string;
  mapName: string;
  startTime: string;
}

const _props = defineProps<Props>();
</script>

<template>
  <div class="round-report-page">
    <RoundReport
      :server-guid="serverGuid"
      :map-name="mapName"
      :start-time="startTime"
    />
  </div>
</template>

<style scoped>
.round-report-page {
  padding: 20px;
  background-color: var(--color-background);
  min-height: 100vh;
}
</style> 