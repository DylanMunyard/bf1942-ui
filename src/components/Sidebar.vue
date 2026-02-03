<template>
  <!-- Desktop Sidebar -->
  <div class="fixed right-0 top-0 w-20 h-full bg-gradient-to-b from-neutral-900/95 to-neutral-950 backdrop-blur-xl border-l border-neutral-700/50 z-50 hidden md:flex flex-col shadow-2xl">
    <!-- Animated background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 opacity-60" />
    <div class="absolute bottom-1/4 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    
    <div class="relative z-10 flex flex-col h-full">
      <!-- Auth Section -->
      <div class="flex-shrink-0 p-4 border-b border-neutral-700/30">
        <LoginButton />
      </div>
      
      <!-- Navigation Menu -->
      <nav class="flex-1 py-6 space-y-3 overflow-visible">
        <!-- Dashboard Link -->
        <router-link
          v-if="isAuthenticated"
          to="/dashboard"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${dashboardIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-neutral-900/95 to-neutral-950 backdrop-blur-lg rounded-xl border border-neutral-700/50 p-4 shadow-2xl min-w-80">
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
              <p class="text-neutral-300 text-sm leading-relaxed">
                Your personal battlefield command center. View player profiles, favorite servers, and squad status.
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-neutral-900 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Servers Link -->
        <router-link
          to="/servers"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${serversIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-neutral-900/95 to-neutral-950 backdrop-blur-lg rounded-xl border border-neutral-700/50 p-4 shadow-2xl min-w-80">
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
              <p class="text-neutral-300 text-sm leading-relaxed">
                Find BF1942, FH2, and BF Vietnam servers. Thanks to <a
                  href="https://github.com/cetteup"
                  target="_blank"
                  rel="noopener"
                  class="text-cyan-400 hover:text-cyan-300 underline"
                >@cetteup</a> for providing these APIs
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-neutral-900 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Players Link -->
        <router-link
          to="/players"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-8 h-8 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${playersIcon})` }"
          />
          
          <!-- Enhanced Tooltip -->
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-neutral-900/95 to-neutral-950 backdrop-blur-lg rounded-xl border border-neutral-700/50 p-4 shadow-2xl min-w-80">
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
              <p class="text-neutral-300 text-sm leading-relaxed">
                Search for players and view player statistics
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-neutral-900 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Data Explorer Link - Featured -->
        <router-link
          to="/explore"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl data-explorer-glow overflow-visible"
          active-class="!shadow-xl"
        >
          <!-- Animated rainbow border -->
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 to-pink-500 opacity-75 animate-gradient-rotate pointer-events-none" style="padding: 2px; background-size: 200% 200%;">
            <div class="w-full h-full rounded-[10px] bg-gradient-to-br from-neutral-700/90 to-neutral-800/90" />
          </div>
          
          <!-- Icon container -->
          <div class="relative z-10 pointer-events-none">
            <div
              class="w-8 h-8 rounded-lg bg-cover bg-center bg-no-repeat opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"
              :style="{ backgroundImage: `url(${explorerIcon})` }"
            />
          </div>
          
          <!-- Enhanced Promotional Tooltip -->
          <div class="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[60]">
            <div class="bg-gradient-to-r from-neutral-900/95 to-neutral-950 backdrop-blur-lg rounded-xl border border-neutral-700/50 p-4 shadow-2xl min-w-72 max-w-xs">
              <div class="flex items-center gap-4 mb-3">
                <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center animate-pulse">
                  <div
                    class="w-10 h-10 rounded-lg bg-cover bg-center bg-no-repeat"
                    :style="{ backgroundImage: `url(${explorerIcon})` }"
                  />
                </div>
                <div>
                  <div class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
                    Data Explorer
                  </div>
                  <div class="text-xs text-purple-400 font-medium uppercase tracking-wider">
                    ✨ New Feature
                  </div>
                </div>
              </div>
              <p class="text-neutral-300 text-sm leading-relaxed">
                Explore the battlefield like never before. Dive deep into server activity and map statistics.
              </p>
            </div>
            <!-- Arrow -->
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-neutral-900 border-y-8 border-y-transparent" />
          </div>
        </router-link>

        <!-- Admin Data Management (Support and Admin) -->
        <router-link
          v-if="isSupport"
          to="/admin/data"
          class="group relative flex flex-col items-center justify-center w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-amber-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-amber-500 !bg-gradient-to-br !from-amber-500/20 !to-orange-500/20"
        >
          <div class="w-8 h-8 flex items-center justify-center opacity-80 group-hover:opacity-100">
            <i class="pi pi-database text-2xl text-amber-400/90" />
          </div>
          <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div class="bg-gradient-to-r from-neutral-900/95 to-neutral-950 backdrop-blur-lg rounded-xl border border-neutral-700/50 p-4 shadow-2xl min-w-52">
              <div class="text-sm font-bold text-amber-400">Admin Data</div>
              <p class="text-neutral-300 text-xs mt-1">Manage suspicious sessions</p>
            </div>
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-l-8 border-l-neutral-900 border-y-8 border-y-transparent" />
          </div>
        </router-link>
      </nav>
    </div>
  </div>

  <!-- Mobile Top Navigation -->
  <div class="fixed top-0 left-0 right-0 h-16 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-700/50 z-[100] flex md:hidden overflow-visible">
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
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
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
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
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
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-cyan-500 !bg-gradient-to-br !from-cyan-500/20 !to-blue-500/20 !shadow-lg !shadow-cyan-500/30"
        >
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cover bg-center bg-no-repeat opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ backgroundImage: `url(${playersIcon})` }"
          />
        </router-link>

        <!-- Data Explorer Link - Featured -->
        <router-link
          to="/explore"
          class="group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 data-explorer-glow-mobile"
          active-class="!shadow-lg"
        >
          <!-- Animated rainbow border -->
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 to-pink-500 opacity-75 animate-gradient-rotate" style="padding: 2px; background-size: 200% 200%;">
            <div class="w-full h-full rounded-[10px] bg-gradient-to-br from-neutral-700/90 to-neutral-800/90" />
          </div>
          <div
            class="relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded bg-cover bg-center bg-no-repeat opacity-90 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300"
            :style="{ backgroundImage: `url(${explorerIcon})` }"
          />
        </router-link>

        <!-- Admin Data (Support and Admin) -->
        <router-link
          v-if="isSupport"
          to="/admin/data"
          class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 backdrop-blur-sm border border-neutral-600/50 hover:border-amber-500/50 transition-all duration-300 hover:scale-105"
          active-class="!border-amber-500 !from-amber-500/20 !to-orange-500/20"
        >
          <i class="pi pi-database text-lg text-amber-400/90" />
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import LoginButton from './LoginButton.vue';
import { useAuth } from '@/composables/useAuth';

import dashboardIcon from '@/assets/achievements/dashboard-sidemenu.webp';
import serversIcon from '@/assets/servers.webp';
import playersIcon from '@/assets/players.webp';
import explorerIcon from '@/assets/menu-item-data-explorer.webp';

const route = useRoute();
const { isAuthenticated, isSupport } = useAuth();
</script>

 