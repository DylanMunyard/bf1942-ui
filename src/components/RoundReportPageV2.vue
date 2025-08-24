<script setup lang="ts">
import RoundReportV2 from './RoundReportV2.vue';

interface Props {
  serverGuid: string;
  mapName: string;
  startTime: string;
}

const _props = defineProps<Props>();
</script>

<template>
  <div class="round-report-page-v2">
    <RoundReportV2
      :server-guid="serverGuid"
      :map-name="mapName"
      :start-time="startTime"
    />
  </div>
</template>

<style scoped>
.round-report-page-v2 {
  min-height: 100vh;
}
</style>