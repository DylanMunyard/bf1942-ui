<template>
  <div class="min-h-screen bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Main Player Search and Results -->
      <div class="w-full">
        <!-- Header with Search -->
        <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-3">
          <!-- Title -->
          <div class="text-center mb-4">
            <h1 class="text-2xl font-bold text-slate-200 mb-2">
              Find Players
            </h1>
            <p class="text-slate-400 text-sm">
              Search for players and view their stats, activity, and current server status
            </p>
          </div>
          
          <!-- Player Search -->
          <div class="flex justify-center">
            <div class="relative group w-full max-w-2xl">
              <!-- Search Icon with Glow -->
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                  <span class="text-slate-900 text-xs font-bold">🔍</span>
                </div>
              </div>
              
              <!-- Enhanced Search Input -->
              <input
                v-model="playerSearchQuery"
                type="text"
                placeholder="Filter players..."
                class="w-full pl-14 pr-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/20 focus:shadow-cyan-500/30"
                @input="updateSearchQuery($event.target.value)"
              >
              
              <!-- Search Glow Effect -->
              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </div>
        </div>

        <!-- Players Results Section -->
        <PlayersPage
          :search-query="debouncedSearchQuery"
          @update-search="updateSearchQuery"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PlayersPage from '../components/PlayersPage.vue'

// Player search state - simplified to just filter functionality
const playerSearchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: number | null = null

const updateSearchQuery = (query: string) => {
  playerSearchQuery.value = query
  
  // Debounce the search
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = query
  }, 300) as unknown as number
}
</script> 