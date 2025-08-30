<script setup lang="ts">
import { useRoute } from 'vue-router';
import SessionsPage from './SessionsPage.vue';

const route = useRoute();

// Extract props from route parameters
const playerName = route.params.playerName as string;
</script>

<template>
  <SessionsPage :player-name="playerName" />
</template>