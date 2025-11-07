<template>
  <div class="min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: getBackgroundColor() }">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <!-- Background decorative elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <!-- Error content -->
      <div class="relative z-10 text-center max-w-lg w-full">
        <!-- Error icon -->
        <div class="mb-8 flex justify-center">
          <div class="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <!-- Error heading -->
        <h1 class="text-4xl md:text-5xl font-black mb-4" :style="{ color: getAccentColor() }">
          Tournament Not Found
        </h1>

        <!-- Error message -->
        <p class="text-lg mb-8" :style="{ color: getTextMutedColor() }">
          {{ error }}
        </p>

        <!-- Description -->
        <p class="text-sm mb-12" :style="{ color: getTextMutedColor() }">
          The tournament you're looking for isn't here .. or it might be coming soon, so stay tuned
        </p>

        <!-- Decorative divider -->
        <div class="flex items-center justify-center gap-4 mb-12">
          <div class="h-px w-12" :style="{ backgroundColor: getAccentColorWithOpacity(0.3) }" />
          <div class="w-2 h-2 rotate-45" :style="{ backgroundColor: getAccentColor() }" />
          <div class="h-px w-12" :style="{ backgroundColor: getAccentColorWithOpacity(0.3) }" />
        </div>

        <!-- Action button -->
        <div class="flex justify-center">
          <button
            class="px-8 py-3 rounded-lg font-medium transition-all border-2"
            :style="{
              borderColor: getAccentColor(),
              backgroundColor: getAccentColor(),
              color: getBackgroundColor()
            }"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '0.9';
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }
            }"
            @click="router.push('/servers')"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-2m6 2l6-2" />
              </svg>
              Browse Servers
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tournament Content -->
    <div v-else-if="tournament">
      <!-- Tournament Hero with Navigation -->
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
      />

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8">
        <!-- Latest Matches Section -->
        <div v-if="computedLatestMatches && computedLatestMatches.length > 0" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <!-- Latest Matches Header -->
          <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
            <h3 class="text-xl font-semibold" :style="{ color: getTextColor() }">
              ⚡ Latest Matches
            </h3>
          </div>

          <!-- Latest Matches List -->
          <div class="divide-y" :style="{ borderColor: getAccentColor() }">
            <div
              v-for="match in computedLatestMatches"
              :key="match.id"
              class="p-4 sm:p-6 hover:bg-opacity-50 transition-all cursor-pointer last:divide-y-0"
              :style="{ backgroundColor: getBackgroundMuteColor(), borderBottomColor: getAccentColor() }"
              @click="openMatchupModal(match)"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <!-- Match Date -->
                <div class="text-xs sm:text-sm font-mono" :style="{ color: getTextMutedColor() }">
                  {{ formatMatchDate(match.scheduledDate) }}
                </div>

                <!-- Teams & Score -->
                <div class="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div class="text-sm sm:text-base font-semibold flex items-center gap-1" :style="{ color: getMatchWinner(match) === 'team1' ? getAccentColor() : getTextColor() }">
                    <span v-if="getMatchWinner(match) === 'team1'" class="text-lg">🏆</span>
                    {{ match.team1Name }}
                  </div>
                  <div class="text-xs sm:text-sm font-medium" :style="{ color: getTextMutedColor() }">
                    vs
                  </div>
                  <div class="text-sm sm:text-base font-semibold flex items-center gap-1" :style="{ color: getMatchWinner(match) === 'team2' ? getAccentColor() : getTextColor() }">
                    <span v-if="getMatchWinner(match) === 'team2'" class="text-lg">🏆</span>
                    {{ match.team2Name }}
                  </div>
                </div>

                <!-- Server & Maps Count -->
                <div class="flex items-center gap-4 text-xs sm:text-sm" :style="{ color: getTextMutedColor() }">
                  <div v-if="match.serverName" class="flex items-center gap-1">
                    <span>🖥️</span>
                    <span>{{ match.serverName }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span>🗺️</span>
                    <span>{{ match.maps?.length ?? 0 }} map<span v-if="(match.maps?.length ?? 0) !== 1">s</span></span>
                  </div>
                </div>

                <!-- View Button -->
                <button
                  class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-all self-start sm:self-auto"
                  :style="{
                    backgroundColor: getAccentColor() + '20',
                    color: getAccentColor(),
                    border: `1px solid ${getAccentColor()}`
                  }"
                  @click.stop="openMatchupModal(match)"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tournament Leaderboard -->
        <div v-if="leaderboard && leaderboard.rankings.length > 0" class="backdrop-blur-sm border-2 rounded-xl overflow-hidden" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
          <!-- Leaderboard Header -->
          <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
            <h3 class="text-xl font-semibold" :style="{ color: getTextColor() }">
              🏆 Leaderboard
            </h3>
          </div>

          <!-- Leaderboard Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr :style="{ backgroundColor: getBackgroundMuteColor() }">
                  <th class="p-4 text-left font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Ranking
                  </th>
                  <th class="p-4 text-left font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Team
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Matches Played
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Victories
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Ties
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Losses
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Rounds Won
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Rounds Tied
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Rounds Lost
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Tickets For
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Tickets Against
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Ticket Differential
                  </th>
                  <th class="p-4 text-center font-bold text-xs uppercase border-b" :style="{ color: getTextColor(), borderColor: getAccentColor() }">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ranking, idx) in leaderboard.rankings"
                  :key="ranking.teamId"
                  class="group transition-all duration-300 border-b"
                  :style="{ borderColor: getAccentColor(), backgroundColor: idx % 2 === 0 ? getBackgroundMuteColor() : getBackgroundSoftColor() }"
                >
                  <!-- Ranking -->
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <span v-if="ranking.rank === 1" class="text-xl">🥇</span>
                      <span v-else-if="ranking.rank === 2" class="text-xl">🥈</span>
                      <span v-else-if="ranking.rank === 3" class="text-xl">🥉</span>
                      <span v-else class="text-sm font-bold" :style="{ color: getAccentColor() }">{{ ranking.rank }}</span>
                    </div>
                  </td>

                  <!-- Team Name -->
                  <td class="p-4">
                    <div class="text-sm font-bold" :style="{ color: getTextColor() }">
                      {{ ranking.teamName }}
                    </div>
                  </td>

                  <!-- Matches Played -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextColor() }">
                      {{ ranking.matchesPlayed }}
                    </span>
                  </td>

                  <!-- Victories -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ ranking.victories }}
                    </span>
                  </td>

                  <!-- Ties -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.ties }}
                    </span>
                  </td>

                  <!-- Losses -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.losses }}
                    </span>
                  </td>

                  <!-- Rounds Won -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ ranking.roundsWon }}
                    </span>
                  </td>

                  <!-- Rounds Tied -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.roundsTied }}
                    </span>
                  </td>

                  <!-- Rounds Lost -->
                  <td class="p-4 text-center">
                    <span class="text-sm" :style="{ color: getTextMutedColor() }">
                      {{ ranking.roundsLost }}
                    </span>
                  </td>

                  <!-- Tickets For -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-mono" :style="{ color: getTextColor() }">
                      {{ ranking.ticketsFor }}
                    </span>
                  </td>

                  <!-- Tickets Against -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-mono" :style="{ color: getTextColor() }">
                      {{ ranking.ticketsAgainst }}
                    </span>
                  </td>

                  <!-- Ticket Differential -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-mono" :style="{ color: ranking.ticketDifferential >= 0 ? getAccentColor() : '#ef4444' }">
                      {{ ranking.ticketDifferential >= 0 ? '+' : '' }}{{ ranking.ticketDifferential }}
                    </span>
                  </td>

                  <!-- Points -->
                  <td class="p-4 text-center">
                    <span class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ ranking.points }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- Match Details Modal -->
    <div
      v-if="selectedMatch"
      class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
              <template v-for="map in selectedMatch.maps" :key="map.id">
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

                <!-- Total ticket score row -->
                <tr v-if="map.matchResults && map.matchResults.length > 0" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }" class="border-b font-bold">
                  <td class="p-3" :style="{ color: getTextMutedColor() }">
                    <div class="text-xs font-mono">Total</div>
                  </td>
                  <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                    <div class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ map.matchResults.reduce((sum, r) => sum + (r.team1Tickets || 0), 0) }}
                    </div>
                  </td>
                  <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.08) }">
                    <div class="text-sm font-bold" :style="{ color: getAccentColor() }">
                      {{ map.matchResults.reduce((sum, r) => sum + (r.team2Tickets || 0), 0) }}
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
        <!-- This section is disabled and will be implemented in a future update when player stats are available -->

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
import TournamentHero from '@/components/TournamentHero.vue';
import TournamentPageNav from '@/components/TournamentPageNav.vue';
import {
  publicTournamentService,
  type PublicTournamentDetail,
  type PublicTournamentMatch,
  type PublicTournamentLeaderboard
} from '@/services/publicTournamentService';
import { notificationService } from '@/services/notificationService';
import { isValidHex, normalizeHex, getContrastingTextColor, hexToRgb, rgbToHex, calculateLuminance } from '@/utils/colorUtils';
import { useTournamentCache } from '@/composables/useTournamentCache';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();
const { useTournament } = useTournamentCache();

const tournament = ref<PublicTournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const logoImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedMatch = ref<PublicTournamentMatch | null>(null);
const selectedPlayers = ref<string[]>([]);
const expandedMaps = ref<Set<string>>(new Set());
const leaderboard = ref<PublicTournamentLeaderboard | null>(null);
const selectedWeekForLeaderboard = ref<string | null>(null);

const tournamentId = parseInt(route.params.id as string);

// Helper function to get themed accent color
const getThemedAccentColor = (): string => {
  const colors = getThemeColors();
  return colors.accent;
};

// Helper function to determine match winner
const getMatchWinner = (match: PublicTournamentMatch): 'team1' | 'team2' | 'tie' | null => {
  if (!match.maps || match.maps.length === 0) return null;

  let team1Wins = 0;
  let team2Wins = 0;

  for (const map of match.maps) {
    if (!map.matchResults || map.matchResults.length === 0) continue;

    for (const result of map.matchResults) {
      if (result.winningTeamId === result.team1Id) {
        team1Wins++;
      } else if (result.winningTeamId === result.team2Id) {
        team2Wins++;
      }
    }
  }

  if (team1Wins > team2Wins) return 'team1';
  if (team2Wins > team1Wins) return 'team2';
  if (team1Wins === team2Wins && team1Wins > 0) return 'tie';
  return null;
};

// Helper function to get formatted score with both ticket and round scores: "[Tickets] ([Rounds])"
const getFormattedScore = (map: any, matchTeam1Name?: string, matchTeam2Name?: string): string => {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  const team2Id = results[0]?.team2Id;
  if (!team1Id || !team2Id) return '—';

  // Calculate round scores (wins/losses)
  const team1RoundWins = results.filter((r: any) => r.winningTeamId === team1Id).length;
  const team2RoundWins = results.filter((r: any) => r.winningTeamId === team2Id).length;
  const draws = results.filter((r: any) => r.winningTeamId !== team1Id && r.winningTeamId !== team2Id).length;

  // Calculate ticket scores
  let team1Tickets = 0;
  let team2Tickets = 0;
  for (const result of results) {
    team1Tickets += result.team1Tickets || 0;
    team2Tickets += result.team2Tickets || 0;
  }

  // Format round score
  let roundScore: string;
  if (draws > 0) {
    roundScore = `${team1RoundWins}-${team2RoundWins}-${draws}`;
  } else {
    roundScore = `${team1RoundWins}-${team2RoundWins}`;
  }

  // Format as "[Tickets] ([Rounds])"
  const scoreStr = `${team1Tickets}-${team2Tickets} (${roundScore})`;

  // Add team names if provided
  if (matchTeam1Name && matchTeam2Name) {
    return `${matchTeam1Name} ${scoreStr} ${matchTeam2Name}`;
  }
  return scoreStr;
};

// Helper function to get results aggregation (e.g., "Team A 2-0 Team B", "Team A 1-1 Team B") - kept for backward compatibility
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

const getAccentTextColor = (): string => {
  const accent = getAccentColor();
  const lum = calculateLuminance(accent);
  // If accent is light, use dark text; if dark, use light text
  return lum > 0.5 ? '#000000' : '#FFFFFF';
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

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'registration':
      return '#FFEB3B'; // Yellow
    case 'open':
      return '#4CAF50'; // Green
    case 'closed':
      return '#EF4444'; // Red
    default:
      return '#FFD700'; // Golden (fallback)
  }
};

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'registration':
      return '#000000'; // Black text on yellow
    case 'open':
      return '#FFFFFF'; // White text on green
    case 'closed':
      return '#FFFFFF'; // White text on red
    default:
      return '#000000'; // Black text (fallback)
  }
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

const getWeekDateRange = (week: string | null, matches?: MatchWithStatus[]): string => {
  // Try to use week dates if available
  if (tournament.value?.weekDates && week) {
    const weekDate = tournament.value.weekDates.find(w => w.week === week);
    if (weekDate) {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      };
      const startDate = new Date(weekDate.startDate);
      const endDate = new Date(weekDate.endDate);
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }

  // Fallback: calculate from matches if week dates not available
  if (!matches || matches.length === 0) return '';

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

// Compute latest matches - use API-provided latestMatches or derive from matches array
const computedLatestMatches = computed(() => {
  // If API provides latestMatches, use it
  if (tournament.value?.latestMatches && tournament.value.latestMatches.length > 0) {
    return tournament.value.latestMatches.slice(0, 2);
  }

  // Otherwise, derive from all matches by finding completed matches
  if (!tournament.value?.matches) return [];

  const completedMatches = tournament.value.matches.filter(match => {
    const completedMaps = match.maps.filter(map => map.matchResults?.length > 0);
    return completedMaps.length === match.maps.length && match.maps.length > 0;
  });

  // Return the most recent 2 completed matches (assuming createdAt is ordered)
  return completedMatches.slice(-2).reverse();
});

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


const loadLeaderboard = async (week?: string) => {
  try {
    const data = await publicTournamentService.getLeaderboard(tournamentId, week);
    leaderboard.value = data;
    selectedWeekForLeaderboard.value = week || null;
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    leaderboard.value = null;
  }
};

const loadTournament = async () => {
  error.value = null;

  try {
    const { tournament: cachedTournament, heroImageUrl: cachedHeroUrl, logoImageUrl: cachedLogoUrl, error: cacheError } = await useTournament(tournamentId);

    if (cacheError.value) {
      throw new Error(cacheError.value);
    }

    tournament.value = cachedTournament.value;
    heroImageUrl.value = cachedHeroUrl.value;
    logoImageUrl.value = cachedLogoUrl.value;

    const data = cachedTournament.value;
    if (!data) return;

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

    // Always set loading to false - data is ready either from cache or API
    loading.value = false;

    // Load leaderboard (async, doesn't block rendering)
    loadLeaderboard().catch(err => console.debug('Failed to load leaderboard:', err));
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
    loading.value = false;
  }
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
