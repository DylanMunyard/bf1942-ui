<script setup lang="ts">
import { useRoute } from 'vue-router';
import SessionsPage from './SessionsPage.vue';

const route = useRoute();

// Extract props from route parameters and query
const serverName = route.params.serverName as string;
const mapName = route.query.mapName as string;
</script>

<template>
  <SessionsPage 
    :server-name="serverName" 
    :map-name="mapName" 
  />
</template>