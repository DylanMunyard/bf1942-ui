<template>
  <!-- Full-width Hero Section -->
  <div class="w-full bg-slate-800 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center">
        <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4">Find Players</h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">Search for players and view their stats, activity, and current server status</p>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="min-h-screen bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PlayersPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import PlayersPage from '../components/PlayersPage.vue';
</script> 