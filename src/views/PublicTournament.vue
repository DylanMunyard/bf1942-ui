<template>
  <div class="min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: getBackgroundColor() }">
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
        background: '#1a1a1a'
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
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7))'
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
            <!-- Tournament Name -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-6 leading-tight" :style="{ color: getAccentColor() }">
              {{ tournament.name }}
            </h1>

            <!-- Community Logo Display (below tournament name) -->
            <div v-if="logoImageUrl" class="mb-6 flex justify-center">
              <img
                :src="logoImageUrl"
                alt="Community logo"
                class="max-h-16 object-contain"
              >
            </div>

            <!-- Game Icon & Info -->
            <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white mb-8">
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
        <div v-if="allMatchesByWeek.length > 0" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
            <h3 class="text-xl font-semibold flex items-center gap-3" :style="{ color: getTextColor() }">
              Matches
            </h3>
          </div>

          <!-- Matches Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <!-- Table Body -->
              <tbody>
                <!-- Week groups with matches -->
                <template v-for="weekGroup in allMatchesByWeek" :key="weekGroup.week || 'no-week'">
                  <!-- Week Header Row -->
                  <tr v-if="!weekGroup.hideWeekHeader" class="border-b" :style="{ backgroundColor: getBackgroundSoftColor(), borderColor: getAccentColor() }">
                    <td class="p-4 w-32">
                      <span class="text-sm font-bold uppercase tracking-wide" :style="{ color: getAccentColor() }">
                        {{ weekGroup.week }}
                      </span>
                    </td>
                    <td colspan="3" class="p-4 text-center">
                      <span class="text-sm font-bold uppercase tracking-wide" :style="{ color: getAccentColor() }">
                        {{ getWeekDateRange(weekGroup.matches) }}
                      </span>
                    </td>
                  </tr>

                  <!-- Match rows -->
                  <tr
                    v-for="matchItem in weekGroup.matches"
                    :key="matchItem.match.id"
                    class="group transition-all duration-300 border-b"
                    :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }"
                  >
                    <!-- Date -->
                    <td class="p-3">
                      <div class="text-xs font-mono" :style="{ color: getTextMutedColor() }">
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
                          <div class="text-sm font-bold" :style="{ color: getTextColor() }">
                            {{ matchItem.match.team1Name }}
                          </div>
                        </button>
                        <div class="text-xs font-medium" :style="{ color: getTextMutedColor() }">VS</div>
                        <button
                          class="text-left px-2 py-1 rounded transition-all hover:bg-slate-700/30"
                          @click="openMatchupModal(matchItem.match)"
                        >
                          <div class="text-sm font-bold" :style="{ color: getTextColor() }">
                            {{ matchItem.match.team2Name }}
                          </div>
                        </button>
                      </div>
                    </td>

                    <!-- Maps Summary -->
                    <td class="p-3">
                      <div class="text-xs space-y-0.5">
                        <div v-for="map in matchItem.match.maps" :key="map.id" class="flex items-center gap-2 flex-wrap">
                          <span class="font-mono" :style="{ color: getTextMutedColor() }">{{ map.mapOrder + 1 }}.</span>
                          <span :style="{ color: getAccentColor() }" class="font-medium truncate">{{ map.mapName }}</span>
                          <span v-if="map.matchResults?.length > 0" :style="{ color: getAccentColor() }" class="font-bold">
                            {{ getResultsAggregation(map, matchItem.match.team1Name, matchItem.match.team2Name) }}
                          </span>
                          <span v-else :style="{ color: getTextMutedColor() }">—</span>
                        </div>
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="p-3 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          class="px-3 py-1.5 text-xs font-bold transition-all rounded border-2"
                          :style="{ borderColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.2), color: getAccentColor() }"
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
          <h3 class="text-2xl font-bold text-white mb-3">No Matches Scheduled Yet</h3>
          <p class="text-gray-400 text-lg">
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
          background: getBackgroundSoftColor(),
          backdropFilter: 'blur(10px)',
          borderColor: getAccentColor(),
          backgroundColor: getBackgroundSoftColor()
        }"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <h3 class="text-3xl font-bold text-center mb-3" :style="{ color: getAccentColor() }">
              Tournament Rules
            </h3>
          </div>
          <button
            class="p-2 rounded-lg transition-colors flex-shrink-0"
            :style="{ color: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.2) }"
            @click="closeRulesModal"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.35);
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.2);
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
            '--rule-primary': getAccentColor(),
            '--rule-secondary': getAccentColor(),
          } as Record<string, string>"
        >
          <div
            v-html="renderedRules"
            class="text-white markdown-rules"
          />
        </div>
      </div>
    </div>

    <!-- Match Details Modal -->
    <div
      v-if="selectedMatch"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeMatchupModal"
    >
      <div
        class="rounded-2xl p-6 max-w-5xl w-full shadow-2xl max-h-[85vh] overflow-y-auto border-2"
        :style="{
          background: getBackgroundSoftColor(),
          backdropFilter: 'blur(10px)',
          borderColor: getAccentColor(),
          backgroundColor: getBackgroundSoftColor()
        }"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <h3 class="text-3xl font-bold text-center mb-3" :style="{ color: getAccentColor() }">
              Match Details
            </h3>
            <div class="flex items-center justify-center gap-4 text-sm flex-wrap" :style="{ color: getTextColor() }">
              <span>{{ selectedMatch.team1Name }} vs {{ selectedMatch.team2Name }}</span>
              <span>📅 {{ formatMatchDate(selectedMatch.scheduledDate) }}</span>
              <span v-if="selectedMatch.serverName">🖥️ {{ selectedMatch.serverName }}</span>
            </div>
          </div>
          <button
            class="p-2 rounded-lg transition-colors flex-shrink-0"
            :style="{ color: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.2) }"
            @click="closeMatchupModal"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.35);
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.2);
              }
            }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Maps and Results Table -->
        <div class="rounded-lg overflow-hidden border-2" :style="{ borderColor: getAccentColor() }">
          <table class="w-full border-collapse">
            <thead>
              <tr :style="{ backgroundColor: getBackgroundMuteColor() }">
                <th class="p-3 text-left font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                  Round
                </th>
                <th class="p-3 text-left font-bold text-xs uppercase border-b border-l-4" :style="{ color: getTextColor(), borderColor: getAccentColor(), borderLeftColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.1) }">
                  {{ selectedMatch.team1Name }}
                </th>
                <th class="p-3 text-left font-bold text-xs uppercase border-b border-l-4" :style="{ color: getTextColor(), borderColor: getAccentColor(), borderLeftColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.1) }">
                  {{ selectedMatch.team2Name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Group results by map -->
              <template v-for="(map, mapIndex) in selectedMatch.maps" :key="map.id">
                <!-- Map Header Row -->
                <tr :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }" class="border-b">
                  <td colspan="3" class="p-3">
                    <div class="flex items-center gap-3">
                      <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                        {{ map.mapName }}
                      </span>
                      <span v-if="map.teamName" class="text-xs" :style="{ color: getTextMutedColor() }">
                        (Selected by {{ map.teamName }})
                      </span>
                      <span v-if="map.matchResults?.length > 0" class="text-xs font-bold ml-auto" :style="{ color: getAccentColor() }">
                        {{ getResultsAggregation(map, selectedMatch.team1Name, selectedMatch.team2Name) }}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Rounds for this map -->
                <tr
                  v-for="(result, roundIndex) in map.matchResults"
                  :key="`${map.id}-${result.id}`"
                  class="border-b transition-all group"
                  :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }"
                >
                  <!-- Round number -->
                  <td class="p-3" :style="{ color: getTextMutedColor() }">
                    <div class="text-xs font-mono">Round {{ roundIndex + 1 }}</div>
                  </td>

                  <!-- Team 1 Score -->
                  <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold" :style="{ color: getTextColor() }">
                        {{ result.team1Tickets }}
                      </span>
                      <span v-if="result.winningTeamId === result.team1Id" class="text-lg">🏆</span>
                    </div>
                  </td>

                  <!-- Team 2 Score -->
                  <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold" :style="{ color: getTextColor() }">
                        {{ result.team2Tickets }}
                      </span>
                      <span v-if="result.winningTeamId === result.team2Id" class="text-lg">🏆</span>
                    </div>
                  </td>
                </tr>

                <!-- Empty state if no results for this map -->
                <tr v-if="!map.matchResults || map.matchResults.length === 0" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }" class="border-b">
                  <td colspan="3" class="p-3 text-center" :style="{ color: getTextMutedColor() }">
                    <span class="text-xs">No results yet</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Expandable Player Stats Section -->
        <!-- Note: Player stats are not available in the current API schema. This will be added in a future update. -->
        <div class="space-y-4">
          <div v-for="map in selectedMatch.maps" :key="map.id" class="space-y-2">
            <!-- Player stats unavailable - will be added in future update -->
          </div>
        </div>

        <!-- Expandable Player Stats Table (Disabled until round data available) -->
        <template v-if="false">
          <div v-if="false" class="rounded-lg overflow-hidden border border-slate-700/50">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gradient-to-r from-slate-800/95 to-slate-900/95">
                    <th class="p-2 border-b border-slate-700/30" />
                    <!-- Team 1 Stats -->
                    <th class="p-2 text-left font-bold text-xs uppercase text-slate-300 border-b border-slate-700/30 bg-cyan-500/5 border-l-4 border-l-cyan-400/60 min-w-[120px]">
                      <span class="font-mono">{{ getTeamName(map, 1) }} - Player</span>
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
                      <span class="font-mono">{{ getTeamName(map, 2) }} - Player</span>
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
        </template>

        <!-- Player Comparison Section -->
        <div class="mt-8 space-y-4">
          <h3 class="text-lg font-bold" :style="{ color: getAccentColor() }">Compare Players</h3>

          <!-- Rosters Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse rounded-lg overflow-hidden border-2" :style="{ borderColor: getAccentColor() }">
              <thead>
                <tr :style="{ backgroundColor: getBackgroundMuteColor() }">
                  <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b border-r-2" :style="{ borderColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.1), color: getAccentColor() }">
                    <div class="flex flex-col items-center gap-2">
                      <span>{{ selectedMatch.team1Name }}</span>
                      <span class="text-xs font-normal" :style="{ color: getTextMutedColor() }">
                        {{ getTeamRoster(selectedMatch, selectedMatch.team1Name).length }} players
                      </span>
                    </div>
                  </th>
                  <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b" :style="{ borderColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.1), color: getAccentColor() }">
                    <div class="flex flex-col items-center gap-2">
                      <span>{{ selectedMatch.team2Name }}</span>
                      <span class="text-xs font-normal" :style="{ color: getTextMutedColor() }">
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
                  class="border-b transition-all"
                  :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }"
                  @mouseenter="(e) => {
                    if (e.currentTarget) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.08);
                    }
                  }"
                  @mouseleave="(e) => {
                    if (e.currentTarget) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = getBackgroundMuteColor();
                    }
                  }"
                >
                  <!-- Team 1 Player -->
                  <td class="p-3 border-r-2" :style="{ borderColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.05) }">
                    <button
                      v-if="getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx]"
                      class="w-full text-left px-3 py-2 rounded-lg transition-all"
                      :class="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName)
                        ? 'border-2 font-bold'
                        : ''"
                      :style="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName)
                        ? {
                            backgroundColor: getAccentColorWithOpacity(0.2),
                            borderColor: getAccentColor(),
                            color: getAccentColor()
                          }
                        : {
                            color: getAccentColor()
                          }"
                      @click="selectPlayerForComparison(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName, selectedMatch.team1Name)"
                    >
                      <div class="flex items-center justify-between">
                        <span>{{ getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName }}</span>
                        <svg v-if="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team1Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: getAccentColor() }">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </td>
                  <!-- Team 2 Player -->
                  <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.05) }">
                    <button
                      v-if="getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx]"
                      class="w-full text-left px-3 py-2 rounded-lg transition-all"
                      :class="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName)
                        ? 'border-2 font-bold'
                        : ''"
                      :style="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName)
                        ? {
                            backgroundColor: getAccentColorWithOpacity(0.2),
                            borderColor: getAccentColor(),
                            color: getAccentColor()
                          }
                        : {
                            color: getAccentColor()
                          }"
                      @click="selectPlayerForComparison(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName, selectedMatch.team2Name)"
                    >
                      <div class="flex items-center justify-between">
                        <span>{{ getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName }}</span>
                        <svg v-if="isPlayerSelected(getTeamRoster(selectedMatch, selectedMatch.team2Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: getAccentColor() }">
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
          <div v-if="selectedPlayers.length === 2" class="text-center">
            <button
              class="px-8 py-4 font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
              :style="{ backgroundColor: getAccentColor(), color: getBackgroundColor() }"
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
          <div v-else-if="selectedPlayers.length === 1" class="text-center text-slate-400 text-sm">
            Select one more player from the other team to compare
          </div>
        </div>

        <!-- Future: Add comments section, more details, etc. -->
        <div class="mt-8 p-4 border-2 rounded-lg text-center text-sm" :style="{ borderColor: getAccentColor(), backgroundColor: getAccentColorWithOpacity(0.08), color: getTextMutedColor() }">
          More details and match comments coming soon...
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
import { isValidHex, normalizeHex, getContrastingTextColor, hexToRgb, rgbToHex, calculateLuminance } from '@/utils/colorUtils';
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
const expandedMaps = ref<Set<string>>(new Set());

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
  const colors = getThemeColors();
  return colors.accent;
};

// Helper function to get results aggregation (e.g., "Team A 2-0 Team B", "Team A 1-1 Team B")
const getResultsAggregation = (map: any, matchTeam1Name?: string, matchTeam2Name?: string): string => {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  const team2Id = results[0]?.team2Id;
  if (!team1Id || !team2Id) return '—';

  const team1Wins = results.filter((r: any) => r.winningTeamId === team1Id).length;
  const team2Wins = results.filter((r: any) => r.winningTeamId === team2Id).length;
  const draws = results.filter((r: any) => r.winningTeamId !== team1Id && r.winningTeamId !== team2Id).length;

  let scoreStr: string;
  if (draws > 0) {
    scoreStr = `${team1Wins}-${team2Wins}-${draws}`;
  } else {
    scoreStr = `${team1Wins}-${team2Wins}`;
  }

  // Add team names if provided
  if (matchTeam1Name && matchTeam2Name) {
    return `${matchTeam1Name} ${scoreStr} ${matchTeam2Name}`;
  }
  return scoreStr;
};

// Helper function to get theme colors
const getThemeColors = () => {
  if (!tournament.value?.theme) {
    return {
      background: '#000000',
      text: '#FFFFFF',
      accent: '#FFD700',
    };
  }

  return {
    background: tournament.value.theme.backgroundColour || '#000000',
    text: tournament.value.theme.textColour || '#FFFFFF',
    accent: tournament.value.theme.accentColour || '#FFD700',
  };
};

const themeVars = computed<Record<string, string>>(() => {
  // Defaults - black background, white text, yellow/golden borders
  const defaults = {
    background: '#000000',       // black
    backgroundSoft: '#1a1a1a',   // very dark gray
    backgroundMute: '#2d2d2d',   // dark gray
    text: '#FFFFFF',             // white
    textMuted: '#d0d0d0',        // light gray
    border: '#FFD700',           // golden/yellow
  } as const;

  const bgHex = normalizeHex(tournament.value?.theme?.backgroundColour ?? '') || defaults.background;
  const textHexRaw = normalizeHex(tournament.value?.theme?.textColour ?? '');
  const borderHexRaw = normalizeHex(tournament.value?.theme?.accentColour ?? '');

  const bg = isValidHex(bgHex) ? bgHex : defaults.background;
  const bgLum = calculateLuminance(bg);
  const isDark = bgLum < 0.5;

  // Helper to mix two hex colors
  const mixHex = (a: string, b: string, t: number): string => {
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    if (!ra || !rb) return a;
    const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
    return rgbToHex(mix(ra.r, rb.r), mix(ra.g, rb.g), mix(ra.b, rb.b));
  };

  const text = isValidHex(textHexRaw) ? textHexRaw : getContrastingTextColor(bg);
  const border = isValidHex(borderHexRaw) ? borderHexRaw : defaults.border;

  const backgroundSoft = isDark ? mixHex(bg, '#FFFFFF', 0.08) : mixHex(bg, '#000000', 0.06);
  const backgroundMute = isDark ? mixHex(bg, '#FFFFFF', 0.16) : mixHex(bg, '#000000', 0.12);
  const textMuted = isDark ? mixHex(text, bg, 0.35) : mixHex(text, bg, 0.45);

  const borderHover = isDark ? mixHex(border, '#FFFFFF', 0.1) : mixHex(border, '#000000', 0.1);

  return {
    '--color-background': bg,
    '--color-background-soft': backgroundSoft,
    '--color-background-mute': backgroundMute,
    '--color-text': text,
    '--color-text-muted': textMuted,
    '--color-heading': text,
    '--color-border': border,
    '--color-primary': border,
    '--color-primary-hover': borderHover,
    '--rule-primary': border,
    '--rule-secondary': border,
  };
});

// Helper functions to derive colors from theme
const getAccentColor = (): string => {
  if (!tournament.value?.theme?.accentColour) return '#FFD700';
  const normalized = normalizeHex(tournament.value.theme.accentColour);
  return isValidHex(normalized) ? normalized : '#FFD700';
};

const getAccentColorWithOpacity = (opacity: number): string => {
  const accent = getAccentColor();
  const rgb = hexToRgb(accent);
  if (!rgb) return `rgba(255, 215, 0, ${opacity})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

const getBackgroundColor = (): string => {
  return themeVars.value['--color-background'] || '#000000';
};

const getBackgroundSoftColor = (): string => {
  return themeVars.value['--color-background-soft'] || '#1a1a1a';
};

const getBackgroundMuteColor = (): string => {
  return themeVars.value['--color-background-mute'] || '#2d2d2d';
};

const getTextColor = (): string => {
  return themeVars.value['--color-text'] || '#FFFFFF';
};

const getTextMutedColor = (): string => {
  return themeVars.value['--color-text-muted'] || '#d0d0d0';
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

const getWeekDateRange = (matches: MatchWithStatus[]): string => {
  if (!matches || matches.length === 0) return '';

  // Get all scheduled dates from all matches
  const dates = matches.flatMap(m => m.match.maps.map(_map => new Date(m.match.scheduledDate)));

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
        const completedMaps = match.maps.filter(map => map.matchResults?.length > 0);
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
      theme: data.theme
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
  expandedMaps.value.clear();
};

const toggleMapExpansion = (mapId: number) => {
  const mapIdStr = String(mapId);
  if (expandedMaps.value.has(mapIdStr)) {
    expandedMaps.value.delete(mapIdStr);
  } else {
    expandedMaps.value.add(mapIdStr);
  }
};

const isMapExpanded = (mapId: number): boolean => {
  return expandedMaps.value.has(String(mapId));
};

const getTeamRoster = (_match: PublicTournamentMatch, teamName: string) => {
  if (!tournament.value) return [];
  const team = tournament.value.teams.find(t => t.name === teamName);
  return team?.players || [];
};

const getTeamName = (_map: any, teamNumber: 1 | 2): string => {
  if (!selectedMatch.value) return '';
  return teamNumber === 1 ? selectedMatch.value.team1Name : selectedMatch.value.team2Name;
};

const getTeamPlayers = (map: any, teamNumber: 1 | 2): any[] => {
  if (!map.round?.players) return [];
  const teamName = getTeamName(map, teamNumber);
  return map.round.players.filter((p: any) => p.teamName === teamName);
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
/* CSS Custom Property Utilities */
:deep(.bg-bf-background) {
  background-color: var(--color-background);
}

:deep(.bg-bf-background-soft) {
  background-color: var(--color-background-soft);
}

:deep(.bg-bf-background-mute) {
  background-color: var(--color-background-mute);
}

:deep(.text-bf-text) {
  color: var(--color-text);
}

:deep(.text-bf-text-muted) {
  color: var(--color-text-muted);
}

:deep(.border-bf-border) {
  border-color: var(--color-border);
}

/* Apply background color from CSS variables to root element */
:deep(#app) {
  background-color: var(--color-background, #000000);
  color: var(--color-text, #FFFFFF);
}

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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
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
