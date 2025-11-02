<template>
  <div class="min-h-screen pb-12" :style="themeStyles">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-6 max-w-4xl mx-auto mt-20">
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          @click="router.push('/servers/bf1942')"
        >
          Back to Servers
        </button>
      </div>
    </div>

    <!-- Tournament Content -->
    <div v-else-if="tournament">
      <!-- Hero Banner Section -->
      <div class="relative overflow-hidden" :style="{
        background: getValidColors().primary
          ? `linear-gradient(135deg, ${getValidColors().primary} 0%, ${getValidColors().primary}dd 50%, ${getValidColors().primary}99 100%)`
          : 'linear-gradient(to bottom right, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 50%, rgb(15, 23, 42) 100%)'
      }">
        <!-- Background Hero Image -->
        <div
          v-if="heroImageUrl"
          class="absolute inset-0"
        >
          <img
            :src="heroImageUrl"
            :alt="tournament.name"
            class="w-full h-full object-cover opacity-30"
          >
          <div :style="{
            background: getValidColors().primary
              ? `linear-gradient(to bottom, ${getValidColors().primary}33, ${getValidColors().primary}55)`
              : 'linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.4))'
          }" class="absolute inset-0" />
        </div>

        <!-- Decorative Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 px-4 sm:px-6 py-8 sm:py-10">
          <div class="max-w-6xl mx-auto">
            <!-- Community Logo Display -->
            <div v-if="logoImageUrl" class="mb-6 flex justify-center">
              <img
                :src="logoImageUrl"
                alt="Community logo"
                class="max-h-20 object-contain"
              >
            </div>

            <!-- Tournament Name -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-6 leading-tight">
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 drop-shadow-2xl">
                {{ tournament.name }}
              </span>
            </h1>

            <!-- Game Icon & Info -->
            <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-300 mb-8">
              <!-- Game Icon Badge -->
              <div
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cover bg-center border-4 border-amber-500/30 shadow-2xl flex-shrink-0"
                :style="{ backgroundImage: getGameIcon() }"
              />
              <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-amber-400">👤</span>
                <router-link
                  :to="`/players/${tournament.organizer}`"
                  class="font-medium text-amber-300 hover:text-amber-200 transition-colors"
                >
                  {{ tournament.organizer }}
                </router-link>
              </div>
              <div v-if="tournament.serverName" class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-cyan-400">🖥️</span>
                <span class="font-medium">{{ tournament.serverName }}</span>
              </div>
              <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-emerald-400">⚔️</span>
                <span class="font-medium">{{ tournament.matchesByWeek?.reduce((sum, w) => sum + w.matches.length, 0) ?? 0 }} Matches</span>
              </div>
              <a
                v-if="tournament.discordUrl"
                :href="tournament.discordUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 backdrop-blur-sm rounded-full border border-indigo-500/50 hover:border-indigo-400/70 transition-all"
              >
                <span class="text-indigo-400">💬</span>
                <span class="font-medium text-indigo-300">Discord</span>
              </a>
              <a
                v-if="tournament.forumUrl"
                :href="tournament.forumUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-sm rounded-full border border-orange-500/50 hover:border-orange-400/70 transition-all"
              >
                <span class="text-orange-400">📋</span>
                <span class="font-medium text-orange-300">Forum</span>
              </a>
              <button
                v-if="tournament.rules && tournament.rules.trim()"
                @click="openRulesModal"
                class="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm rounded-full border border-amber-500/50 hover:border-amber-400/70 transition-all"
              >
                <span class="text-amber-400">📜</span>
                <span class="font-medium text-amber-300">Rules</span>
              </button>
            </div>

            <!-- Decorative Divider -->
            <div class="flex items-center justify-center gap-4 mb-8">
              <div class="h-px w-20 bg-gradient-to-r from-transparent to-amber-500/50" />
              <div class="w-2 h-2 rotate-45 bg-amber-500" />
              <div class="h-px w-20 bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8">
        <!-- Tournament Matches Table -->
        <div v-if="allMatchesByWeek.length > 0" class="bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-slate-700/50">
            <h3 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
              🎯 Matches
            </h3>
          </div>

          <!-- Matches Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <!-- Table Header -->
              <thead class="sticky top-0 z-10">
                <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm">
                  <th class="p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                    <div class="flex items-center gap-2">
                      <span class="text-purple-400 text-xs">📅</span>
                      <span class="font-mono">Date</span>
                    </div>
                  </th>
                  <th class="p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 cursor-pointer hover:bg-slate-700/50 transition-all duration-300 border-b border-slate-700/30 hover:border-emerald-500/50">
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-400 text-xs">⚔️</span>
                      <span class="font-mono">Matchup</span>
                    </div>
                  </th>
                  <th class="p-3 text-left font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                    <div class="flex items-center gap-2">
                      <span class="text-orange-400 text-xs">🗺️</span>
                      <span class="font-mono">Maps</span>
                    </div>
                  </th>
                  <th class="p-3 text-center font-bold text-xs uppercase tracking-wide text-slate-300 border-b border-slate-700/30">
                    <div class="flex items-center justify-center gap-2">
                      <span class="text-blue-400 text-xs">🔗</span>
                      <span class="font-mono">Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody>
                <!-- Week groups with matches -->
                <template v-for="weekGroup in allMatchesByWeek" :key="weekGroup.week || 'no-week'">
                  <!-- Week Header Row (colspan for all columns) -->
                  <tr v-if="!weekGroup.hideWeekHeader" class="bg-slate-700/30 border-b border-slate-700/50">
                    <td colspan="4" class="p-4">
                      <span class="text-sm font-bold uppercase tracking-wide" :style="{ color: getThemedAccentColor() }">
                        {{ weekGroup.week }} - {{ getWeekDateRange(weekGroup.matches) }}
                      </span>
                    </td>
                  </tr>

                  <!-- Match rows -->
                  <tr
                    v-for="matchItem in weekGroup.matches"
                    :key="matchItem.match.id"
                    class="group transition-all duration-300 hover:bg-slate-800/20 border-b border-slate-700/30"
                  >
                    <!-- Date -->
                    <td class="p-3">
                      <div class="text-xs font-mono text-slate-400">
                        {{ formatMatchDate(matchItem.match.scheduledDate) }}
                      </div>
                    </td>

                    <!-- Team Matchup -->
                    <td class="p-3">
                      <div class="flex items-center gap-2 flex-wrap">
                        <button
                          class="text-left px-2 py-1 rounded transition-all hover:bg-slate-700/30"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          <div class="text-sm font-bold text-emerald-400 hover:text-emerald-300">
                            {{ matchItem.match.team1Name }}
                          </div>
                        </button>
                        <div class="text-xs text-slate-500 font-medium">VS</div>
                        <button
                          class="text-left px-2 py-1 rounded transition-all hover:bg-slate-700/30"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          <div class="text-sm font-bold text-emerald-400 hover:text-emerald-300">
                            {{ matchItem.match.team2Name }}
                          </div>
                        </button>
                      </div>
                    </td>

                    <!-- Maps Summary -->
                    <td class="p-3">
                      <div class="text-xs space-y-0.5">
                        <div v-for="map in matchItem.match.maps" :key="map.id" class="flex items-center gap-2">
                          <span class="text-slate-500 font-mono">{{ map.mapOrder + 1 }}.</span>
                          <span class="text-amber-400 font-medium truncate">{{ map.mapName }}</span>
                          <span v-if="map.round?.winningTeamName" class="text-emerald-400 flex-shrink-0">
                            🏆 {{ map.round.winningTeamName }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="p-3 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          class="px-3 py-1.5 text-xs font-bold uppercase transition-all rounded border"
                          :class="matchItem.match.maps.some(m => m.roundId)
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50'
                            : 'bg-slate-600/20 text-slate-500 border-slate-600/30 cursor-not-allowed opacity-50'"
                          @click="matchItem.match.maps.filter(m => m.roundId)[0] && viewRoundReport(matchItem.match.maps.filter(m => m.roundId)[0]!.roundId!)"
                        >
                          Report
                        </button>
                        <button
                          class="px-3 py-1.5 text-xs font-bold transition-all rounded border bg-slate-700/30 hover:bg-slate-600/30 text-slate-300 border-slate-600/30"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="allMatchesByWeek.length === 0" class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">📅</div>
          <h3 class="text-2xl font-bold text-slate-300 mb-3">No Matches Scheduled Yet</h3>
          <p class="text-slate-400 text-lg">
            Check back soon for match announcements!
          </p>
        </div>

      </div>
    </div>

    <!-- Tournament Rules Modal -->
    <div
      v-if="showRulesModal && tournament && tournament.rules && tournament.rules.trim()"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeRulesModal"
    >
      <div
        class="rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[85vh] overflow-y-auto border-2"
        :style="{
          background: getValidColors().primary
            ? `linear-gradient(to bottom right, ${getValidColors().primary}15, ${getValidColors().secondary}10)`
            : 'linear-gradient(to bottom right, rgba(34, 211, 238, 0.1), rgba(96, 165, 250, 0.08))',
          backdropFilter: 'blur(10px)',
          borderColor: getValidColors().primary || 'rgba(34, 211, 238, 0.5)',
          backgroundColor: 'rgba(30, 41, 59, 0.95)'
        }"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <h3 class="text-3xl font-bold text-center mb-3" :style="{
              color: getValidColors().primary || 'rgb(34, 211, 238)'
            }">
              Tournament Rules
            </h3>
          </div>
          <button
            class="p-2 rounded-lg transition-colors flex-shrink-0"
            :style="{
              color: getThemedAccentColor(),
              backgroundColor: `${getThemedAccentColor()}20`,
            }"
            @click="closeRulesModal"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${getThemedAccentColor()}35`;
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${getThemedAccentColor()}20`;
              }
            }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Rules Content -->
        <div
          class="prose prose-invert prose-sm max-w-none"
          :style="{
            '--rule-primary': getValidColors().primary || 'rgb(139, 92, 246)',
            '--rule-secondary': getValidColors().secondary || 'rgb(147, 51, 234)',
          } as Record<string, string>"
        >
          <div
            v-html="renderedRules"
            class="text-slate-300 markdown-rules"
          />
        </div>
      </div>
    </div>

    <!-- Team Matchup Modal -->
    <div
      v-if="selectedMatch"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeMatchupModal"
    >
      <div
        class="rounded-2xl p-6 max-w-5xl w-full shadow-2xl max-h-[85vh] overflow-y-auto border-2"
        :style="{
          background: getValidColors().primary
            ? `linear-gradient(to bottom right, ${getValidColors().primary}15, ${getValidColors().secondary}10)`
            : 'linear-gradient(to bottom right, rgba(34, 211, 238, 0.1), rgba(96, 165, 250, 0.08))',
          backdropFilter: 'blur(10px)',
          borderColor: getValidColors().primary || 'rgba(34, 211, 238, 0.5)',
          backgroundColor: 'rgba(30, 41, 59, 0.95)'
        }"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <h3 class="text-3xl font-bold text-center mb-3" :style="{
              color: getValidColors().primary || 'rgb(34, 211, 238)'
            }">
              Team Matchup
            </h3>
            <div class="flex items-center justify-center gap-4 text-sm" :style="{ color: getThemedAccentColor() }">
              <span>📅 {{ formatMatchDate(selectedMatch.scheduledDate) }}</span>
            </div>
          </div>
          <button
            class="p-2 rounded-lg transition-colors flex-shrink-0"
            :style="{
              color: getThemedAccentColor(),
              backgroundColor: `${getThemedAccentColor()}20`,
            }"
            @click="closeMatchupModal"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${getThemedAccentColor()}35`;
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${getThemedAccentColor()}20`;
              }
            }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Gamification Banner -->
        <div
          class="mb-6 p-4 rounded-xl border"
          :style="{
            backgroundColor: getValidColors().primary ? `${getValidColors().primary}15` : 'rgba(139, 92, 246, 0.1)',
            borderColor: getThemedAccentColor()
          }"
        >
          <div class="flex items-start gap-3">
            <span class="text-3xl flex-shrink-0">⚔️</span>
            <div>
              <h4 class="text-lg font-bold mb-1" :style="{ color: getThemedAccentColor() }">Preview the Battle</h4>
              <p class="text-slate-300 text-sm">
                Click any two players (one from each team) to compare their stats and predict who will dominate the matchup!
              </p>
            </div>
          </div>
        </div>

        <!-- Rosters Table -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95">
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b border-slate-700/30 bg-cyan-500/10 border-4 border-cyan-400/60">
                  <div class="flex flex-col items-center gap-2">
                    <span class="text-cyan-400">{{ selectedMatch.team1Name }}</span>
                    <span class="text-slate-400 text-xs font-normal">
                      {{ getTeamRoster(selectedMatch, selectedMatch.team1Name).length }} players
                    </span>
                  </div>
                </th>
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b border-slate-700/30 bg-orange-500/10 border-4 border-orange-400/60">
                  <div class="flex flex-col items-center gap-2">
                    <span class="text-orange-400">{{ selectedMatch.team2Name }}</span>
                    <span class="text-slate-400 text-xs font-normal">
                      {{ getTeamRoster(selectedMatch, selectedMatch.team2Name).length }} players
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(_, idx) in Math.max(
                  getTeamRoster(selectedMatch, selectedMatch.team1Name).length,
                  getTeamRoster(selectedMatch, selectedMatch.team2Name).length
                )"
                :key="idx"
                class="border-b border-slate-700/20 hover:bg-slate-800/30 transition-all"
              >
                <!-- Team 1 Player -->
                <td class="p-3 bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                  <button
                    v-if="getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName)
                      ? 'bg-purple-500/20 border-2 border-purple-500/50 text-purple-300 font-bold'
                      : 'hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300'"
                    @click="selectPlayerForComparison(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName, selectedMatch.team1Name)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName)" class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
                <!-- Team 2 Player -->
                <td class="p-3 bg-orange-500/5 border-l-2 border-l-orange-400/40">
                  <button
                    v-if="getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName)
                      ? 'bg-purple-500/20 border-2 border-purple-500/50 text-purple-300 font-bold'
                      : 'hover:bg-orange-500/10 text-orange-400 hover:text-orange-300'"
                    @click="selectPlayerForComparison(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName, selectedMatch.team2Name)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName)" class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Compare Button -->
        <div v-if="selectedPlayers.length === 2" class="mt-6 text-center">
          <button
            class="px-8 py-4 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
            :style="{
              backgroundImage: getValidColors().primary
                ? `linear-gradient(to right, ${getValidColors().primary}, ${getValidColors().secondary})`
                : 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))'
            }"
            @click="comparePlayers"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '0.8';
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }
            }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Compare {{ selectedPlayers[0] }} vs {{ selectedPlayers[1] }}</span>
            <span>⚡</span>
          </button>
        </div>
        <div v-else-if="selectedPlayers.length === 1" class="mt-6 text-center text-slate-400 text-sm">
          Select one more player from the other team to compare
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import {
  publicTournamentService,
  type PublicTournamentDetail,
  type PublicTournamentMatch
} from '@/services/publicTournamentService';
import { notificationService } from '@/services/notificationService';
import { generateComplementaryColor, isValidHex, normalizeHex } from '@/utils/colorUtils';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

const tournament = ref<PublicTournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const logoImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedMatch = ref<PublicTournamentMatch | null>(null);
const selectedPlayers = ref<string[]>([]);
const showRulesModal = ref(false);

const tournamentId = parseInt(route.params.id as string);

const renderedRules = computed(() => {
  if (!tournament.value?.rules || !tournament.value.rules.trim()) {
    return '';
  }
  try {
    return marked(tournament.value.rules, { breaks: true });
  } catch {
    return '<p class="text-red-400">Invalid markdown in rules</p>';
  }
});

// Helper function to get themed accent color
const getThemedAccentColor = (): string => {
  const colors = getValidColors();
  return colors.primary || 'rgb(34, 211, 238)';
};

// Helper function to check and return valid colors
const getValidColors = () => {
  if (!tournament.value) return { primary: null, secondary: null };

  // Normalize and validate primary color
  const normalizedPrimary = tournament.value.primaryColour ? normalizeHex(tournament.value.primaryColour) : null;
  const primaryColour = normalizedPrimary && isValidHex(normalizedPrimary)
    ? normalizedPrimary
    : null;

  if (!primaryColour) {
    return { primary: null, secondary: null };
  }

  // Normalize and validate secondary color
  const normalizedSecondary = tournament.value.secondaryColour ? normalizeHex(tournament.value.secondaryColour) : null;
  const secondaryColour = normalizedSecondary && isValidHex(normalizedSecondary)
    ? normalizedSecondary
    : generateComplementaryColor(primaryColour);

  return { primary: primaryColour, secondary: secondaryColour };
};

const themeStyles = computed(() => {
  // Use standard dark background with subtle gradient
  return {
    background: 'linear-gradient(to bottom, rgb(15, 23, 42), rgb(25, 35, 55))',
  } as Record<string, string>;
});

// Helper functions
const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getWeekDateRange = (matches: MatchWithStatus[]): string => {
  if (!matches || matches.length === 0) return '';

  // Get all scheduled dates from all matches
  const dates = matches.flatMap(m => m.match.maps.map(map => new Date(m.match.scheduledDate)));

  if (dates.length === 0) return '';

  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return `${formatDate(earliestDate)} - ${formatDate(latestDate)}`;
};

const viewRoundReport = (roundId: string) => {
  router.push(`/rounds/${roundId}/report`);
};

// Consolidated matches by week for condensed table view
interface MatchWithStatus {
  match: PublicTournamentMatch;
  status: 'upcoming' | 'completed';
  isCompleted: boolean;
}

const allMatchesByWeek = computed(() => {
  if (!tournament.value?.matchesByWeek) return [];

  // Check if there's only one week group with null week value
  const hasOnlyOneNullWeek = tournament.value.matchesByWeek.length === 1 && tournament.value.matchesByWeek[0].week === null;

  const filtered = tournament.value.matchesByWeek
    .map(group => ({
      week: group.week,
      hideWeekHeader: hasOnlyOneNullWeek,
      matches: group.matches.map(match => {
        const completedMaps = match.maps.filter(map => map.round);
        const isCompleted = completedMaps.length === match.maps.length && match.maps.length > 0;
        return {
          match,
          status: isCompleted ? 'completed' : 'upcoming',
          isCompleted
        } as MatchWithStatus;
      })
    }))
    .filter(group => group.matches.length > 0);

  return filtered;
});


const loadTournament = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }

    const data = await publicTournamentService.getTournamentDetail(tournamentId);
    tournament.value = data;

    // Debug logging for theme colors
    console.log('Tournament loaded:', {
      name: data.name,
      primaryColour: data.primaryColour,
      secondaryColour: data.secondaryColour,
      isValidHex_primary: data.primaryColour ? isValidHex(data.primaryColour) : 'N/A',
      isValidHex_secondary: data.secondaryColour ? isValidHex(data.secondaryColour) : 'N/A'
    });

    // Create description
    const matchCount = data.matchesByWeek
      ? data.matchesByWeek.reduce((sum, week) => sum + week.matches.length, 0)
      : 0;
    let description = `View tournament schedule, matches, and results for ${data.name}. `;
    description += `${matchCount} match${matchCount !== 1 ? 'es' : ''} scheduled`;
    if (data.organizer) {
      description += ` organized by ${data.organizer}`;
    }
    description += '. Track live tournament progress and player statistics.';

    // Update meta description tag
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', description);
    }

    // Create title
    const fullTitle = `${data.name} - BF Stats`;

    // Update Open Graph tags
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', fullTitle);
    }

    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) {
      ogDescriptionTag.setAttribute('content', description);
    }

    // Set loading to false BEFORE loading images - images load asynchronously in background
    loading.value = false;

    // Load hero image if available (async, doesn't block rendering)
    if (data.hasHeroImage) {
      loadHeroImage().catch(err => console.debug('Failed to load hero image:', err));
    }

    // Load logo image if available (async, doesn't block rendering)
    if (data.hasCommunityLogo) {
      loadLogoImage().catch(err => console.debug('Failed to load logo image:', err));
    }
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
    loading.value = false;
  }
};

const loadHeroImage = async () => {
  try {
    const response = await fetch(publicTournamentService.getTournamentImageUrl(tournamentId));

    if (response.ok) {
      const blob = await response.blob();
      heroImageUrl.value = URL.createObjectURL(blob);
    }
  } catch {
    // Silently fail - hero image is optional
    console.debug('No hero image available');
  }
};

const loadLogoImage = async () => {
  try {
    const response = await fetch(publicTournamentService.getTournamentLogoUrl(tournamentId));

    if (response.ok) {
      const blob = await response.blob();
      logoImageUrl.value = URL.createObjectURL(blob);
    }
  } catch {
    // Silently fail - logo image is optional
    console.debug('No logo image available');
  }
};

const getGameIcon = (): string => {
  if (!tournament.value) return `url('${bf1942Icon}')`;

  const iconMap: Record<string, string> = {
    'bf1942': `url('${bf1942Icon}')`,
    'fh2': `url('${fh2Icon}')`,
    'bfvietnam': `url('${bfvIcon}')`
  };
  return iconMap[tournament.value.game] || `url('${bf1942Icon}')`;
};

const openMatchupModal = (match: PublicTournamentMatch) => {
  selectedMatch.value = match;
  selectedPlayers.value = [];
};

const closeMatchupModal = () => {
  selectedMatch.value = null;
  selectedPlayers.value = [];
};

const getTeamRoster = (_match: PublicTournamentMatch, teamName: string) => {
  if (!tournament.value) return [];
  const team = tournament.value.teams.find(t => t.name === teamName);
  return team?.players || [];
};

const selectPlayerForComparison = (playerName: string, teamName: string) => {
  const currentIndex = selectedPlayers.value.indexOf(playerName);

  // If player already selected, deselect them
  if (currentIndex !== -1) {
    selectedPlayers.value.splice(currentIndex, 1);
    return;
  }

  // If we have 2 players selected, we need to replace one
  if (selectedPlayers.value.length === 2) {
    // Find which team the currently selected players are from
    const player1Team = selectedMatch.value?.team1Name;

    const player1InTeam1 = getTeamRoster(selectedMatch.value!, player1Team!).some(p => p.playerName === selectedPlayers.value[0]);
    const newPlayerInTeam1 = teamName === player1Team;

    // Replace the player from the same team
    if (player1InTeam1 === newPlayerInTeam1) {
      selectedPlayers.value[0] = playerName;
    } else {
      selectedPlayers.value[1] = playerName;
    }
  } else {
    // Add the player
    selectedPlayers.value.push(playerName);
  }
};

const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayers.value.includes(playerName);
};

const comparePlayers = () => {
  if (selectedPlayers.value.length === 2) {
    router.push({
      path: '/players/compare',
      query: {
        player1: selectedPlayers.value[0],
        player2: selectedPlayers.value[1]
      }
    });
  }
};

const openRulesModal = () => {
  showRulesModal.value = true;
};

const closeRulesModal = () => {
  showRulesModal.value = false;
};

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `${newTournament.name} - BF Stats`;
    document.title = fullTitle;
    notificationService.updateOriginalTitle();
  }
});

onMounted(() => {
  loadTournament();
});
</script>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Modal scrollbar styling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}

/* Markdown rules styling */
.markdown-rules :deep(h1),
.markdown-rules :deep(h2),
.markdown-rules :deep(h3),
.markdown-rules :deep(h4),
.markdown-rules :deep(h5),
.markdown-rules :deep(h6) {
  color: var(--rule-primary);
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-rules :deep(p) {
  margin-bottom: 0.75rem;
  color: #cbd5e1;
  line-height: 1.6;
}

.markdown-rules :deep(strong) {
  font-weight: 700;
  color: var(--rule-primary);
}

.markdown-rules :deep(em) {
  color: var(--rule-secondary);
  font-style: italic;
}

.markdown-rules :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.markdown-rules :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.markdown-rules :deep(li) {
  margin-bottom: 0.5rem;
  color: #cbd5e1;
  margin-left: 1rem;
}

.markdown-rules :deep(code) {
  background: linear-gradient(135deg, var(--rule-primary)15, var(--rule-secondary)10);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--rule-primary);
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  border: 1px solid rgba(var(--rule-primary), 0.2);
}

.markdown-rules :deep(blockquote) {
  border-left: 4px solid var(--rule-primary);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: #cbd5e1;
  background: linear-gradient(to right, var(--rule-primary)08, transparent);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}

.markdown-rules :deep(a) {
  color: var(--rule-primary);
  text-decoration: underline;
  font-weight: 600;
  transition: all 0.2s ease;
}

.markdown-rules :deep(a:hover) {
  color: var(--rule-secondary);
  text-decoration: none;
}

.markdown-rules :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5rem 0;
  border: 2px solid var(--rule-primary);
  border-radius: 0.5rem;
  overflow: hidden;
}

.markdown-rules :deep(thead) {
  background: linear-gradient(to right, var(--rule-primary)30, var(--rule-secondary)20);
  backdrop-filter: blur(0.5rem);
}

.markdown-rules :deep(th) {
  padding: 1rem;
  text-align: left;
  font-weight: 700;
  color: var(--rule-primary);
  border-bottom: 2px solid var(--rule-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.markdown-rules :deep(td) {
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  border-bottom: 1px solid var(--rule-primary)20;
}

.markdown-rules :deep(tbody tr) {
  background-color: transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.markdown-rules :deep(tbody tr:nth-child(even)) {
  background-color: var(--rule-primary)08;
}

.markdown-rules :deep(tbody tr:hover) {
  background-color: var(--rule-primary)15;
  box-shadow: inset 0 0 16px var(--rule-primary)15;
}
</style>
