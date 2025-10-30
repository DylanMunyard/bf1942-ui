<template>
  <div class="min-h-screen pb-12">
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
      <div class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
          <div class="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900" />
        </div>

        <!-- Decorative Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 px-4 sm:px-6 py-8 sm:py-10">
          <div class="max-w-6xl mx-auto">
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
                <span class="font-medium">{{ tournament.organizer }}</span>
              </div>
              <div v-if="tournament.serverName" class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-cyan-400">🖥️</span>
                <span class="font-medium">{{ tournament.serverName }}</span>
              </div>
              <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-full border border-slate-700/50">
                <span class="text-emerald-400">⚔️</span>
                <span class="font-medium">{{ tournament.matches.length }} Matches</span>
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
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-12">
        <!-- Upcoming Matches Section -->
        <div v-if="upcomingMatches.length > 0">
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            Upcoming Matches
          </h2>

          <div class="space-y-4">
            <div
              v-for="(match, index) in upcomingMatches"
              :key="match.id"
              class="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-violet-500/30 transition-all"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl font-black text-violet-400">{{ index + 1 }}</span>
                    <span class="text-amber-400 text-base font-semibold">📅 {{ formatMatchDate(match.scheduledDate) }}</span>
                  </div>
                  <div class="flex items-center gap-3 mb-2">
                    <div class="text-center">
                      <div class="text-lg font-bold text-emerald-400">{{ match.team1Name }}</div>
                    </div>
                    <div class="text-2xl font-bold text-violet-400">VS</div>
                    <div class="text-center">
                      <div class="text-lg font-bold text-emerald-400">{{ match.team2Name }}</div>
                    </div>
                  </div>
                  <div v-if="match.serverName" class="text-sm text-slate-400">
                    <span>🖥️ {{ match.serverName }}</span>
                  </div>
                </div>
              </div>

              <!-- Maps List -->
              <div class="space-y-2">
                <div
                  v-for="map in match.maps"
                  :key="map.id"
                  class="bg-slate-700/30 rounded-lg border border-slate-600/30 overflow-hidden"
                >
                  <div class="p-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="text-sm font-mono text-slate-500 flex-shrink-0">{{ map.mapOrder + 1 }}</span>
                        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span class="text-amber-400 font-medium truncate">{{ map.mapName }}</span>
                          <span v-if="map.teamName" class="text-xs text-cyan-400 truncate">
                            Selected by {{ map.teamName }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                        <span v-if="map.round?.winningTeamName" class="text-xs text-emerald-400 flex items-center gap-1 flex-shrink-0">
                          <span>🏆</span>
                          <span>{{ map.round.winningTeamName }}</span>
                          <span v-if="getTeamScore(map, 1) !== undefined && getTeamScore(map, 2) !== undefined" class="text-slate-400">
                            ({{ getTeamScore(map, 1) }} - {{ getTeamScore(map, 2) }})
                          </span>
                        </span>
                        <div class="flex items-center gap-2">
                          <button
                            v-if="map.roundId && map.round?.players && map.round.players.length > 0"
                            class="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 hover:border-violet-500/50 rounded-lg transition-all text-xs font-medium flex items-center gap-2 whitespace-nowrap"
                            @click="toggleMapExpansion(map.id)"
                          >
                            <span>{{ isMapExpanded(map.id) ? 'Hide' : 'Show' }} Stats</span>
                            <svg
                              class="w-3.5 h-3.5 transition-transform"
                              :class="{ 'rotate-180': isMapExpanded(map.id) }"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            v-if="map.roundId"
                            class="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all text-xs font-medium flex items-center gap-2 whitespace-nowrap"
                            @click="viewRoundReport(map.roundId)"
                          >
                            <span>Report</span>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div v-if="!map.roundId" class="text-slate-500 text-xs italic px-2 whitespace-nowrap">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Expandable Player Stats Table -->
                  <div
                    v-if="isMapExpanded(map.id) && map.round?.players && map.round.players.length > 0"
                    class="border-t border-slate-600/30 bg-slate-800/40 p-3"
                  >
                    <div class="overflow-x-auto">
                      <table class="w-full border-collapse">
                        <thead>
                          <!-- Team Headers -->
                          <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95">
                            <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-400 border-b border-slate-700/30 w-8">
                              #
                            </th>
                            <!-- Team 1 Header -->
                            <th
                              class="p-2 text-center font-bold text-xs uppercase tracking-wide border-b border-slate-700/30 bg-emerald-500/10 border-l-4"
                              :class="map.round.winningTeamName === getTeamName(map, 1)
                                ? 'text-emerald-400 border-l-emerald-400/60'
                                : 'text-cyan-400 border-l-cyan-400/60'"
                              colspan="4"
                            >
                              <div class="flex items-center justify-center gap-2">
                                <span class="font-mono font-bold text-sm">{{ getTeamName(map, 1) }}</span>
                                <span v-if="getTeamScore(map, 1) !== undefined" class="text-slate-300 font-bold text-sm">
                                  ({{ getTeamScore(map, 1) }})
                                </span>
                                <span v-if="map.round.winningTeamName === getTeamName(map, 1)">🏆</span>
                              </div>
                            </th>
                            <!-- Team 2 Header -->
                            <th
                              class="p-2 text-center font-bold text-xs uppercase tracking-wide border-b border-slate-700/30 bg-orange-500/10 border-l-4"
                              :class="map.round.winningTeamName === getTeamName(map, 2)
                                ? 'text-emerald-400 border-l-emerald-400/60'
                                : 'text-orange-400 border-l-orange-400/60'"
                              colspan="4"
                            >
                              <div class="flex items-center justify-center gap-2">
                                <span class="font-mono font-bold text-sm">{{ getTeamName(map, 2) }}</span>
                                <span v-if="getTeamScore(map, 2) !== undefined" class="text-slate-300 font-bold text-sm">
                                  ({{ getTeamScore(map, 2) }})
                                </span>
                                <span v-if="map.round.winningTeamName === getTeamName(map, 2)">🏆</span>
                              </div>
                            </th>
                          </tr>
                          <!-- Stat Column Headers -->
                          <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90">
                            <th class="p-2 border-b border-slate-700/30" />
                            <!-- Team 1 Stats -->
                            <th class="p-2 text-left font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-l-4 border-l-cyan-400/60 min-w-[120px]">
                              <span class="font-mono">Player</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                              <span class="font-mono">S</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                              <span class="font-mono">K</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-r-4 border-r-cyan-400/60">
                              <span class="font-mono">D</span>
                            </th>
                            <!-- Team 2 Stats -->
                            <th class="p-2 text-left font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5 border-l-4 border-l-orange-400/60 min-w-[120px]">
                              <span class="font-mono">Player</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                              <span class="font-mono">S</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                              <span class="font-mono">K</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                              <span class="font-mono">D</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(_, idx) in Math.max(getTeamPlayers(map, 1).length, getTeamPlayers(map, 2).length)"
                            :key="idx"
                            class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/10"
                          >
                            <!-- Row Number -->
                            <td class="p-2 text-slate-500 text-xs font-mono">
                              {{ idx + 1 }}
                            </td>
                            <!-- Team 1 Player -->
                            <template v-if="getTeamPlayers(map, 1)[idx]">
                              <td class="p-2 bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                                <router-link
                                  :to="`/players/${getTeamPlayers(map, 1)[idx].playerName}`"
                                  class="text-cyan-400 hover:text-cyan-300 font-medium text-xs truncate block"
                                >
                                  {{ getTeamPlayers(map, 1)[idx].playerName }}
                                </router-link>
                              </td>
                              <td class="p-2 text-center bg-cyan-500/5">
                                <span class="text-slate-200 font-bold text-xs font-mono">
                                  {{ getTeamPlayers(map, 1)[idx].totalScore.toLocaleString() }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-cyan-500/5">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 1)[idx].totalKills }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 1)[idx].totalDeaths }}
                                </span>
                              </td>
                            </template>
                            <template v-else>
                              <td class="p-2 bg-cyan-500/5 border-l-2 border-l-cyan-400/40" colspan="4" />
                            </template>
                            <!-- Team 2 Player -->
                            <template v-if="getTeamPlayers(map, 2)[idx]">
                              <td class="p-2 bg-orange-500/5 border-l-2 border-l-orange-400/40">
                                <router-link
                                  :to="`/players/${getTeamPlayers(map, 2)[idx].playerName}`"
                                  class="text-orange-400 hover:text-orange-300 font-medium text-xs truncate block"
                                >
                                  {{ getTeamPlayers(map, 2)[idx].playerName }}
                                </router-link>
                              </td>
                              <td class="p-2 text-center bg-orange-500/5">
                                <span class="text-slate-200 font-bold text-xs font-mono">
                                  {{ getTeamPlayers(map, 2)[idx].totalScore.toLocaleString() }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-orange-500/5">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 2)[idx].totalKills }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-orange-500/5">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 2)[idx].totalDeaths }}
                                </span>
                              </td>
                            </template>
                            <template v-else>
                              <td class="p-2 bg-orange-500/5 border-l-2 border-l-orange-400/40" colspan="4" />
                            </template>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Matches Section -->
        <div v-if="completedMatches.length > 0">
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            Completed Matches
          </h2>

          <div class="space-y-4">
            <div
              v-for="(match, index) in completedMatches"
              :key="match.id"
              class="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition-all"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-2xl font-black text-emerald-400">{{ index + 1 }}</span>
                    <span class="text-amber-400 text-base font-semibold">📅 {{ formatMatchDate(match.scheduledDate) }}</span>
                  </div>
                  <div class="flex items-center gap-3 mb-2">
                    <div class="text-center">
                      <div class="text-lg font-bold text-emerald-400">{{ match.team1Name }}</div>
                      <div v-if="getMatchWinner(match) === match.team1Name" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold mt-1">
                        🏆 Winner
                      </div>
                    </div>
                    <div class="text-2xl font-bold text-violet-400">VS</div>
                    <div class="text-center">
                      <div class="text-lg font-bold text-emerald-400">{{ match.team2Name }}</div>
                      <div v-if="getMatchWinner(match) === match.team2Name" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold mt-1">
                        🏆 Winner
                      </div>
                    </div>
                  </div>
                  <div v-if="match.serverName" class="text-sm text-slate-400">
                    <span>🖥️ {{ match.serverName }}</span>
                  </div>
                </div>
              </div>

              <!-- Maps List with Player Stats -->
              <div class="space-y-2">
                <div
                  v-for="map in match.maps"
                  :key="map.id"
                  class="bg-slate-700/30 rounded-lg border border-slate-600/30 overflow-hidden"
                >
                  <div class="p-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="text-sm font-mono text-slate-500 flex-shrink-0">{{ map.mapOrder + 1 }}</span>
                        <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span class="text-amber-400 font-medium truncate">{{ map.mapName }}</span>
                          <span v-if="map.teamName" class="text-xs text-cyan-400 truncate">
                            Selected by {{ map.teamName }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                        <span v-if="map.round?.winningTeamName" class="text-xs text-emerald-400 flex items-center gap-1 flex-shrink-0">
                          <span>🏆</span>
                          <span>{{ map.round.winningTeamName }}</span>
                          <span v-if="getTeamScore(map, 1) !== undefined && getTeamScore(map, 2) !== undefined" class="text-slate-400">
                            ({{ getTeamScore(map, 1) }} - {{ getTeamScore(map, 2) }})
                          </span>
                        </span>
                        <div class="flex items-center gap-2">
                          <button
                            v-if="map.roundId && map.round?.players && map.round.players.length > 0"
                            class="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 hover:border-violet-500/50 rounded-lg transition-all text-xs font-medium flex items-center gap-2 whitespace-nowrap"
                            @click="toggleMapExpansion(map.id)"
                          >
                            <span>{{ isMapExpanded(map.id) ? 'Hide' : 'Show' }} Stats</span>
                            <svg
                              class="w-3.5 h-3.5 transition-transform"
                              :class="{ 'rotate-180': isMapExpanded(map.id) }"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            v-if="map.roundId"
                            class="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all text-xs font-medium flex items-center gap-2 whitespace-nowrap"
                            @click="viewRoundReport(map.roundId)"
                          >
                            <span>Report</span>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div v-if="!map.roundId" class="text-slate-500 text-xs italic px-2 whitespace-nowrap">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Expandable Player Stats Table -->
                  <div
                    v-if="isMapExpanded(map.id) && map.round?.players && map.round.players.length > 0"
                    class="border-t border-slate-600/30 bg-slate-800/40 p-3"
                  >
                    <div class="overflow-x-auto">
                      <table class="w-full border-collapse">
                        <thead>
                          <!-- Team Headers -->
                          <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95">
                            <th class="p-2 text-left font-bold text-xs uppercase tracking-wide text-slate-400 border-b border-slate-700/30 w-8">
                              #
                            </th>
                            <!-- Team 1 Header -->
                            <th
                              class="p-2 text-center font-bold text-xs uppercase tracking-wide border-b border-slate-700/30 bg-emerald-500/10 border-l-4"
                              :class="map.round.winningTeamName === getTeamName(map, 1)
                                ? 'text-emerald-400 border-l-emerald-400/60'
                                : 'text-cyan-400 border-l-cyan-400/60'"
                              colspan="4"
                            >
                              <div class="flex items-center justify-center gap-2">
                                <span class="font-mono font-bold text-sm">{{ getTeamName(map, 1) }}</span>
                                <span v-if="getTeamScore(map, 1) !== undefined" class="text-slate-300 font-bold text-sm">
                                  ({{ getTeamScore(map, 1) }})
                                </span>
                                <span v-if="map.round.winningTeamName === getTeamName(map, 1)">🏆</span>
                              </div>
                            </th>
                            <!-- Team 2 Header -->
                            <th
                              class="p-2 text-center font-bold text-xs uppercase tracking-wide border-b border-slate-700/30 bg-orange-500/10 border-l-4"
                              :class="map.round.winningTeamName === getTeamName(map, 2)
                                ? 'text-emerald-400 border-l-emerald-400/60'
                                : 'text-orange-400 border-l-orange-400/60'"
                              colspan="4"
                            >
                              <div class="flex items-center justify-center gap-2">
                                <span class="font-mono font-bold text-sm">{{ getTeamName(map, 2) }}</span>
                                <span v-if="getTeamScore(map, 2) !== undefined" class="text-slate-300 font-bold text-sm">
                                  ({{ getTeamScore(map, 2) }})
                                </span>
                                <span v-if="map.round.winningTeamName === getTeamName(map, 2)">🏆</span>
                              </div>
                            </th>
                          </tr>
                          <!-- Stat Column Headers -->
                          <tr class="bg-gradient-to-r from-slate-800/90 to-slate-900/90">
                            <th class="p-2 border-b border-slate-700/30" />
                            <!-- Team 1 Stats -->
                            <th class="p-2 text-left font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-l-4 border-l-cyan-400/60 min-w-[120px]">
                              <span class="font-mono">Player</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                              <span class="font-mono">S</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5">
                              <span class="font-mono">K</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-r-4 border-r-cyan-400/60">
                              <span class="font-mono">D</span>
                            </th>
                            <!-- Team 2 Stats -->
                            <th class="p-2 text-left font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5 border-l-4 border-l-orange-400/60 min-w-[120px]">
                              <span class="font-mono">Player</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                              <span class="font-mono">S</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                              <span class="font-mono">K</span>
                            </th>
                            <th class="p-2 text-center font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-orange-500/5">
                              <span class="font-mono">D</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(_, idx) in Math.max(getTeamPlayers(map, 1).length, getTeamPlayers(map, 2).length)"
                            :key="idx"
                            class="group transition-all duration-300 hover:bg-slate-800/30 border-b border-slate-700/10"
                          >
                            <!-- Row Number -->
                            <td class="p-2 text-slate-500 text-xs font-mono">
                              {{ idx + 1 }}
                            </td>
                            <!-- Team 1 Player -->
                            <template v-if="getTeamPlayers(map, 1)[idx]">
                              <td class="p-2 bg-cyan-500/5 border-l-2 border-l-cyan-400/40">
                                <router-link
                                  :to="`/players/${getTeamPlayers(map, 1)[idx].playerName}`"
                                  class="text-cyan-400 hover:text-cyan-300 font-medium text-xs truncate block"
                                >
                                  {{ getTeamPlayers(map, 1)[idx].playerName }}
                                </router-link>
                              </td>
                              <td class="p-2 text-center bg-cyan-500/5">
                                <span class="text-slate-200 font-bold text-xs font-mono">
                                  {{ getTeamPlayers(map, 1)[idx].totalScore.toLocaleString() }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-cyan-500/5">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 1)[idx].totalKills }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-cyan-500/5 border-r-2 border-r-cyan-400/40">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 1)[idx].totalDeaths }}
                                </span>
                              </td>
                            </template>
                            <template v-else>
                              <td class="p-2 bg-cyan-500/5 border-l-2 border-l-cyan-400/40" colspan="4" />
                            </template>
                            <!-- Team 2 Player -->
                            <template v-if="getTeamPlayers(map, 2)[idx]">
                              <td class="p-2 bg-orange-500/5 border-l-2 border-l-orange-400/40">
                                <router-link
                                  :to="`/players/${getTeamPlayers(map, 2)[idx].playerName}`"
                                  class="text-orange-400 hover:text-orange-300 font-medium text-xs truncate block"
                                >
                                  {{ getTeamPlayers(map, 2)[idx].playerName }}
                                </router-link>
                              </td>
                              <td class="p-2 text-center bg-orange-500/5">
                                <span class="text-slate-200 font-bold text-xs font-mono">
                                  {{ getTeamPlayers(map, 2)[idx].totalScore.toLocaleString() }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-orange-500/5">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 2)[idx].totalKills }}
                                </span>
                              </td>
                              <td class="p-2 text-center bg-orange-500/5">
                                <span class="text-slate-300 text-xs font-mono">
                                  {{ getTeamPlayers(map, 2)[idx].totalDeaths }}
                                </span>
                              </td>
                            </template>
                            <template v-else>
                              <td class="p-2 bg-orange-500/5 border-l-2 border-l-orange-400/40" colspan="4" />
                            </template>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="upcomingMatches.length === 0 && completedMatches.length === 0" class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">📅</div>
          <h3 class="text-2xl font-bold text-slate-300 mb-3">No Matches Scheduled Yet</h3>
          <p class="text-slate-400 text-lg">
            Check back soon for match announcements!
          </p>
        </div>

        <!-- Teams Section -->
        <div v-if="tournament.teams.length > 0">
          <h2 class="text-3xl sm:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            Teams
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="team in tournament.teams"
              :key="team.id"
              class="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-xl border-2 border-slate-700/50 p-6 hover:border-amber-500/40 transition-all duration-300 shadow-lg text-left"
              @click="openTeamModal(team)"
            >
              <h3 class="text-xl font-bold text-amber-400 mb-2">{{ team.name }}</h3>
              <p class="text-slate-400">
                {{ team.players.length }} {{ team.players.length === 1 ? 'player' : 'players' }}
              </p>
              <div class="mt-3 text-sm text-cyan-400 flex items-center gap-2">
                <span>View Roster</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Roster Modal -->
    <div
      v-if="selectedTeam"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeTeamModal"
    >
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold text-amber-400 mb-2">{{ selectedTeam.name }}</h3>
            <p class="text-slate-400">{{ selectedTeam.players.length }} {{ selectedTeam.players.length === 1 ? 'player' : 'players' }}</p>
          </div>
          <button
            class="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            @click="closeTeamModal"
          >
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-2">
          <router-link
            v-for="player in selectedTeam.players"
            :key="player.playerName"
            :to="`/players/${player.playerName}`"
            class="block px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/50 rounded-lg transition-all"
          >
            <span class="text-cyan-400 hover:text-cyan-300 font-medium">{{ player.playerName }}</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  publicTournamentService,
  type PublicTournamentDetail,
  type PublicTournamentMatch,
  type PublicTournamentTeam,
  type PublicTournamentMatchMap
} from '@/services/publicTournamentService';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

const tournament = ref<PublicTournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedTeam = ref<PublicTournamentTeam | null>(null);
const expandedMaps = ref<Set<number>>(new Set());

const tournamentId = parseInt(route.params.id as string);

// Helper functions
const getTeamPlayers = (map: PublicTournamentMatchMap, team: number) => {
  if (!map.round?.players) return [];
  return map.round.players
    .filter(p => p.team === team)
    .sort((a, b) => b.totalScore - a.totalScore);
};

const getTeamName = (map: PublicTournamentMatchMap, team: number): string => {
  if (team === 1 && map.round?.team1Label) return map.round.team1Label;
  if (team === 2 && map.round?.team2Label) return map.round.team2Label;
  return `Team ${team}`;
};

const getTeamScore = (map: PublicTournamentMatchMap, team: number): number | undefined => {
  if (team === 1) return map.round?.tickets1;
  if (team === 2) return map.round?.tickets2;
  return undefined;
};

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

const getMatchWinner = (match: PublicTournamentMatch): string | null => {
  const completedMaps = match.maps.filter(map => map.round);
  if (completedMaps.length === 0 || completedMaps.length < match.maps.length) {
    return null;
  }

  const team1Wins = completedMaps.filter(map => map.round?.winningTeamName === match.team1Name).length;
  const team2Wins = completedMaps.filter(map => map.round?.winningTeamName === match.team2Name).length;

  if (team1Wins > team2Wins) return match.team1Name;
  if (team2Wins > team1Wins) return match.team2Name;
  return null;
};

const viewRoundReport = (roundId: string) => {
  router.push(`/rounds/${roundId}/report`);
};

const upcomingMatches = computed(() => {
  if (!tournament.value) return [];
  return tournament.value.matches
    .filter(match => {
      // A match is upcoming if not all maps have been played
      const completedMaps = match.maps.filter(map => map.round);
      return completedMaps.length < match.maps.length;
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
});

const completedMatches = computed(() => {
  if (!tournament.value) return [];
  return tournament.value.matches
    .filter(match => {
      // A match is completed if all maps have been played
      const completedMaps = match.maps.filter(map => map.round);
      return completedMaps.length === match.maps.length && match.maps.length > 0;
    })
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
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

    // Load hero image if available
    if (data.hasHeroImage) {
      await loadHeroImage();
    }
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
  } finally {
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

const getGameIcon = (): string => {
  if (!tournament.value) return `url('${bf1942Icon}')`;

  const iconMap: Record<string, string> = {
    'bf1942': `url('${bf1942Icon}')`,
    'fh2': `url('${fh2Icon}')`,
    'bfvietnam': `url('${bfvIcon}')`
  };
  return iconMap[tournament.value.game] || `url('${bf1942Icon}')`;
};

const openTeamModal = (team: PublicTournamentTeam) => {
  selectedTeam.value = team;
};

const closeTeamModal = () => {
  selectedTeam.value = null;
};

const toggleMapExpansion = (mapId: number) => {
  if (expandedMaps.value.has(mapId)) {
    expandedMaps.value.delete(mapId);
  } else {
    expandedMaps.value.add(mapId);
  }
};

const isMapExpanded = (mapId: number) => {
  return expandedMaps.value.has(mapId);
};

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
</style>
