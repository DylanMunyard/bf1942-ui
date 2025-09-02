<script setup lang="ts">
import { useRoute } from 'vue-router';
import SessionsPage from './SessionsPage.vue';

const route = useRoute();

// Extract props from route parameters and query
const serverName = route.params.serverName as string;
const mapName = route.query.mapName as string;
const playerNames = (() => {
  const pn = route.query.playerNames;
  if (Array.isArray(pn)) {
    return pn.filter(name => typeof name === 'string').join(',');
  } else if (typeof pn === 'string') {
    return pn;
  }
  return undefined;
})();
</script>

<template>
  <SessionsPage 
    :server-name="serverName" 
    :map-name="mapName"
    :player-name="playerNames"
  />
</template>