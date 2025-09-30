<template>
  <!-- Desktop Sidebar -->
  <div class="fixed right-0 top-0 w-20 h-full bg-gradient-to-b from-slate-800/80 to-slate-900/90 backdrop-blur-xl border-l border-slate-700/50 z-50 hidden md:flex flex-col shadow-2xl">
    <!-- Animated background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 opacity-60" />
    <div class="absolute top-1/4 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
    <div class="absolute bottom-1/4 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    
    <div class="relative z-10 flex flex-col h-full">
      <!-- Auth Section -->
      <div class="flex-shrink-0 p-4 border-b border-slate-700/30">
        <LoginButton />
      </div>
      
      <!-- Navigation Menu -->
      <nav class="flex-1 py-6 space-y-3 overflow-y-auto">
        <!-- Dashboard Link -->
        <router-link
          v-if="isAuthenticated"
          to="/dashboard"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${dashboardIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4 shadow-2xl min-w-80">
              <div class="flex items-center gap-4 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <div
                    class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat"
                    :style="{ backgroundImage: `url(${dashboardIcon})` }"
                  />
                </div>
                <div class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Dashboard
                </div>
              </div>
              <p class="text-slate-300 text-sm leading-relaxed">
                Your personal battlefield command center. View player profiles, favorite servers, and squad status.
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-slate-800 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Servers Link -->
        <router-link
          to="/servers"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${serversIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4 shadow-2xl min-w-80">
              <div class="flex items-center gap-4 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <div
                    class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat"
                    :style="{ backgroundImage: `url(${serversIcon})` }"
                  />
                </div>
                <div class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                  Servers
                </div>
              </div>
              <p class="text-slate-300 text-sm leading-relaxed">
                Find BF1942, FH2, and BF Vietnam servers. Thanks to <a
                  href="https://github.com/cetteup"
                  target="_blank"
                  rel="noopener"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >@cetteup</a> for providing these APIs
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-slate-800 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Players Link -->
        <router-link
          to="/players"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${playersIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4 shadow-2xl min-w-80">
              <div class="flex items-center gap-4 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <div
                    class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat"
                    :style="{ backgroundImage: `url(${playersIcon})` }"
                  />
                </div>
                <div class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Players
                </div>
              </div>
              <p class="text-slate-300 text-sm leading-relaxed">
                Search for players and view player statistics
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-slate-800 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Player Comparison Link -->
        <router-link
          to="/players/compare"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${compareIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4 shadow-2xl min-w-80">
              <div class="flex items-center gap-4 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <div
                    class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat"
                    :style="{ backgroundImage: `url(${compareIcon})` }"
                  />
                </div>
                <div class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  Compare
                </div>
              </div>
              <p class="text-slate-300 text-sm leading-relaxed">
                Compare two players' performance statistics side-by-side
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-slate-800 border-y-8 border-y-transparent" />
          </div>
        </router-link>
      </nav>
    </div>
  </div>

  <!-- Mobile Top Navigation -->
  <div class="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 z-[100] flex md:hidden overflow-visible">
    <!-- Animated background gradient -->
    <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 opacity-60" />
    
    <div class="relative z-auto flex items-center w-full px-2 sm:px-4 max-w-full">
      <!-- Auth Section -->
      <div class="flex-shrink-0">
        <LoginButton />
      </div>
      
      <!-- Navigation Menu -->
      <nav class="flex-1 flex items-center justify-center gap-2 sm:gap-4 ml-2 sm:ml-4 min-w-0 overflow-hidden">
        <!-- Dashboard Link -->
        <router-link
          v-if="isAuthenticated"
          to="/dashboard"
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${dashboardIcon})` }"
          />
        </router-link>

        <!-- Servers Link -->
        <router-link
          to="/servers"
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${serversIcon})` }"
          />
        </router-link>

        <!-- Players Link -->
        <router-link
          to="/players"
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${playersIcon})` }"
          />
        </router-link>

        <!-- Player Comparison Link -->
        <router-link
          to="/players/compare"
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${compareIcon})` }"
          />
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import LoginButton from './LoginButton.vue';
import { useAuth } from '@/composables/useAuth';

import dashboardIcon from '@/assets/achievements/dashboard-sidemenu.png';
import serversIcon from '@/assets/servers.jpg';
import playersIcon from '@/assets/players.jpg';
import compareIcon from '@/assets/player_vs_player.png';

const route = useRoute();
const { isAuthenticated } = useAuth();
</script>

 