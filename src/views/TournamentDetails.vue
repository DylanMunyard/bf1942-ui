<template>
  <div class="relative min-h-screen px-3 sm:px-6 pb-12">
    <!-- Background Effects -->
    <div class="modal-mobile-safe fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <div class="relative z-10 max-w-7xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center min-h-screen">
        <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6">
        <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p class="text-red-400 mb-4">{{ error }}</p>
          <button
            class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="router.push('/dashboard')"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Tournament Content -->
      <div v-else-if="tournament" class="space-y-6">
        <!-- Header Section -->
        <div class="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
          <!-- Hero Image Background -->
          <div
            v-if="heroImageUrl"
            class="absolute inset-0 opacity-20"
          >
            <img
              :src="heroImageUrl"
              :alt="tournament.name"
              class="w-full h-full object-cover"
            >
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
          </div>

          <!-- Header Content -->
          <div class="relative z-10 p-6 sm:p-8 md:p-12">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <button
                    class="text-slate-400 hover:text-slate-200 transition-colors"
                    @click="router.push('/dashboard')"
                    title="Back to Dashboard"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div
                    class="w-8 h-8 rounded bg-cover bg-center flex-shrink-0"
                    :style="{ backgroundImage: getGameIcon() }"
                  />
                  <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400">
                    {{ tournament.name }}
                  </h1>
                </div>

                <!-- Community Logo Display (below tournament name) -->
                <div v-if="logoImageUrl" class="mb-4 flex justify-start">
                  <img
                    :src="logoImageUrl"
                    alt="Community logo"
                    class="max-h-16 object-contain"
                  >
                </div>

                <div class="flex flex-wrap items-center gap-4 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span>👤</span>
                    <span class="font-medium">{{ tournament.organizer }}</span>
                  </span>
                  <span>•</span>
                  <span>{{ formatDate(tournament.createdAt) }}</span>
                  <span v-if="tournament.serverName">
                    •
                  </span>
                  <span v-if="tournament.serverName" class="flex items-center gap-2">
                    <span>🖥️</span>
                    <span class="font-medium">{{ tournament.serverName }}</span>
                  </span>
                  <span v-if="tournament.anticipatedRoundCount">
                    •
                  </span>
                  <span v-if="tournament.anticipatedRoundCount" class="flex items-center gap-2">
                    <span>🎯</span>
                    <span>{{ (tournament.matches?.length ?? 0) }}/{{ tournament.anticipatedRoundCount }} matches</span>
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-all flex items-center gap-2"
                  @click="showEditModal = true"
                  title="Edit tournament details"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-all flex items-center gap-2"
                  @click="showThemeModal = true"
                  title="Edit tournament theme"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .267M7 21H5a2 2 0 01-2-2v-4a2 2 0 012-2h2.5m5.5 0a2 2 0 012 2v4a2 2 0 01-2 2m0 0h5a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5" />
                  </svg>
                  <span>Theme</span>
                </button>
                <button
                  class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg transition-all flex items-center gap-2 font-medium"
                  @click="router.push(`/tournaments/${tournament.id}`)"
                  title="View public tournament page"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>View Public</span>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="tournament.anticipatedRoundCount" class="mt-6">
              <div class="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>Tournament Progress</span>
                <span class="font-mono">{{ getProgressPercentage() }}%</span>
              </div>
              <div class="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  :style="{ width: getProgressPercentage() + '%' }"
                />
              </div>
            </div>

          </div>
        </div>

        <!-- Teams Section -->
        <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
          <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div>
              <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Teams
              </h2>
              <p class="text-slate-400 text-sm mt-1">
                Configure tournament teams and their players
              </p>
            </div>
            <button
              class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              @click="showAddTeamModal = true"
            >
              <span class="text-lg">+</span>
              <span>Add</span>
            </button>
          </div>

          <div class="p-4 sm:p-6">
            <!-- Teams Grid -->
            <div v-if="tournament.teams.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="team in tournament.teams"
                :key="team.id"
                class="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-emerald-500/30 transition-all"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-emerald-400">{{ team.name }}</h3>
                    <p class="text-slate-400 text-sm mt-1">
                      {{ team.players.length }} {{ team.players.length === 1 ? 'player' : 'players' }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      class="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all"
                      @click="editTeam(team.id)"
                      title="Edit team"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      class="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all"
                      @click="confirmDeleteTeam(team.id, team.name)"
                      title="Delete team"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
              <div class="text-6xl mb-4">👥</div>
              <h3 class="text-xl font-bold text-slate-300 mb-2">No Teams Yet</h3>
              <p class="text-slate-400 mb-6">
                Create teams to organize players for tournament matches
              </p>
              <button
                class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all"
                @click="showAddTeamModal = true"
              >
                Add First Team
              </button>
            </div>
          </div>
        </div>

        <!-- Matches Section -->
        <div class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
          <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div>
              <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                Match Schedule
              </h2>
              <p class="text-slate-400 text-sm mt-1">
                Schedule and track matches between teams
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-all flex items-center gap-2"
                @click="openRecalculateModal"
                title="Refresh tournament rankings"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Rankings</span>
              </button>
              <button
                class="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                @click="showAddMatchModal = true"
                :disabled="tournament.teams.length < 2"
                :title="tournament.teams.length < 2 ? 'Create at least 2 teams first' : ''"
              >
                <span class="text-lg">+</span>
                <span>Schedule</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <!-- Matches Table -->
            <table v-if="matchesByWeekGroups.length > 0" class="w-full border-collapse">
              <tbody>
                <!-- Week groups with matches -->
                <template v-for="weekGroup in matchesByWeekGroups" :key="weekGroup.week || 'no-week'">
                  <!-- Week Header Row -->
                  <tr v-if="!weekGroup.hideWeekHeader" class="bg-slate-700/30 border-b border-slate-700/50">
                    <td class="p-4 w-40">
                      <span class="text-sm font-bold uppercase tracking-wide text-violet-400">
                        {{ weekGroup.week }}
                      </span>
                    </td>
                    <td colspan="4" class="p-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-bold uppercase tracking-wide text-slate-400">
                          {{ getWeekDateRange(weekGroup.matches) }}
                        </span>
                        <button
                          class="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 hover:border-violet-500/50 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                          @click="addMatchForWeek"
                          :disabled="tournament.teams.length < 2"
                          :title="tournament.teams.length < 2 ? 'Create at least 2 teams first' : ''"
                        >
                          <span class="text-base">+</span>
                          <span>Match</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Match rows with detail rows grouped together -->
                  <template v-for="match in weekGroup.matches" :key="match.id">
                    <!-- Match Row -->
                    <tr class="group transition-all duration-300 hover:bg-slate-800/20 border-b border-slate-700/30">
                      <!-- Date -->
                      <td class="p-3">
                        <div class="text-xs font-mono text-slate-400">
                          {{ formatMatchDate(match.scheduledDate) }}
                        </div>
                      </td>

                      <!-- Team Matchup -->
                      <td class="p-3">
                        <div class="flex items-center gap-2 flex-wrap">
                          <div class="text-sm font-bold text-emerald-400">
                            {{ match.team1Name }}
                          </div>
                          <div class="text-xs text-slate-500 font-medium">VS</div>
                          <div class="text-sm font-bold text-emerald-400">
                            {{ match.team2Name }}
                          </div>
                        </div>
                        <div v-if="match.serverName" class="text-xs text-slate-400 mt-1">
                          🖥️ {{ match.serverName }}
                        </div>
                      </td>

                      <!-- Maps Summary -->
                      <td class="p-3">
                        <div class="text-xs space-y-0.5">
                          <div v-for="map in (match.maps || []).filter((m: any) => m)" :key="map.id" class="flex items-center gap-2">
                            <span class="text-slate-500 font-mono">{{ map.mapOrder + 1 }}.</span>
                            <span class="text-amber-400 font-medium truncate">{{ map.mapName }}</span>
                            <span v-if="map.matchResults?.length > 0" class="text-emerald-400 font-medium">
                              {{ getResultsAggregation(map) }}
                            </span>
                            <span v-else class="text-slate-500">—</span>
                          </div>
                        </div>
                      </td>

                      <!-- Results Count -->
                      <td class="p-3">
                        <div v-if="(match.maps || []).length > 0" class="text-xs space-y-1">
                          <div v-for="map in (match.maps || []).filter((m: any) => m)" :key="`status-${map.id}`" class="flex items-center gap-1">
                            <span v-if="!map.matchResults?.length" class="text-slate-400">No results</span>
                            <span v-else class="text-emerald-400">{{ map.matchResults.length }} round<span v-if="map.matchResults.length !== 1">s</span></span>
                          </div>
                        </div>
                      </td>

                      <!-- Actions -->
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            class="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 rounded transition-all font-medium"
                            @click="openEditMapResultsModal(match)"
                            title="Enter match results for all maps"
                          >
                            Results
                          </button>
                          <button
                            class="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all"
                            @click="editMatch(match.id)"
                            title="Edit match"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            class="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all"
                            @click="confirmDeleteMatch(match.id)"
                            title="Delete match"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                  </template>
                </template>
              </tbody>
            </table>

            <!-- Empty State -->
            <div v-else class="text-center py-12 px-4">
              <div class="text-6xl mb-4">📅</div>
              <h3 class="text-xl font-bold text-slate-300 mb-2">No Matches Scheduled</h3>
              <p class="text-slate-400 mb-6">
                {{ tournament.teams.length < 2 ? 'Create at least 2 teams before scheduling matches' : 'Schedule matches to organize your tournament calendar' }}
              </p>
              <button
                v-if="tournament.teams.length >= 2"
                class="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                @click="showAddMatchModal = true"
              >
                Schedule First Match
              </button>
            </div>
          </div>
        </div>

        <!-- Tournament Rules Section -->
        <div v-if="tournament.rules && tournament.rules.trim()" class="bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
          <div class="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div>
              <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Tournament Rules
              </h2>
              <p class="text-slate-400 text-sm mt-1">
                Guidelines and rules for the tournament
              </p>
            </div>
          </div>

          <div class="p-4 sm:p-6">
            <div class="prose prose-invert prose-sm max-w-none">
              <div
                v-html="renderedRules"
                class="text-slate-300 markdown-rules"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Tournament Modal -->
    <AddTournamentModal
      v-if="showEditModal && tournament"
      :tournament="tournament"
      @close="showEditModal = false"
      @added="onTournamentUpdated"
    />

    <!-- Edit Tournament Theme Modal -->
    <EditTournamentThemeModal
      v-if="showThemeModal && tournament"
      :tournament="tournament"
      @close="showThemeModal = false"
    />

    <!-- Add/Edit Team Modal -->
    <AddTeamModal
      v-if="showAddTeamModal && tournament"
      :tournament-id="tournament.id"
      :team="editingTeam"
      @close="showAddTeamModal = false; editingTeam = undefined"
      @added="onTeamAdded"
    />

    <!-- Add/Edit Match Modal -->
    <AddMatchModal
      v-if="showAddMatchModal && tournament"
      :tournament-id="tournament.id"
      :teams="tournament.teams"
      :tournament="tournament"
      :match="editingMatch"
      @close="showAddMatchModal = false; editingMatch = undefined"
      @added="onMatchAdded"
    />

    <!-- Edit Map Results Modal -->
    <EditMapResultsModal
      v-if="showEditMapResultsModal && tournament && editingMatchForResults"
      :is-open="showEditMapResultsModal"
      :tournament="tournament"
      :match="editingMatchForResults"
      @close="showEditMapResultsModal = false; editingMatchForResults = null"
      @updated="loadTournament"
    />

    <!-- Delete Team Confirmation Modal -->
    <div
      v-if="deleteTeamConfirmation"
      class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="cancelDeleteTeam"
    >
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-slate-100 mb-2">
              Delete Team?
            </h3>
            <p class="text-slate-300 mb-2">
              Delete team <span class="font-bold text-emerald-400">{{ deleteTeamConfirmation.name }}</span>?
            </p>
            <p class="text-slate-400 text-sm">
              This will remove the team and all its players from the tournament.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="cancelDeleteTeam"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            :disabled="isDeleting"
            @click="executeDeleteTeam"
          >
            <svg v-if="!isDeleting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete Team' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Match Confirmation Modal -->
    <div
      v-if="deleteMatchConfirmation"
      class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="cancelDeleteMatch"
    >
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-slate-100 mb-2">
              Delete Match?
            </h3>
            <p class="text-slate-300 mb-2">
              Delete this scheduled match?
            </p>
            <p class="text-slate-400 text-sm">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="cancelDeleteMatch"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            :disabled="isDeleting"
            @click="executeDeleteMatch"
          >
            <svg v-if="!isDeleting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete Match' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Recalculate Leaderboard Modal -->
    <div
      v-if="showRecalculateModal"
      class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeRecalculateModal"
    >
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-slate-100 mb-2">
              Recalculate Leaderboard
            </h3>
            <p class="text-slate-400 text-sm">
              Choose how you want to recalculate tournament rankings
            </p>
          </div>
        </div>

        <!-- Option 1: Recalculate Everything -->
        <div class="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-600 transition-all cursor-pointer" @click="recalculationMode = 'everything'">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              v-model="recalculationMode"
              value="everything"
              class="mt-1"
            >
            <div>
              <div class="font-medium text-slate-200">Recalculate Everything</div>
              <div class="text-xs text-slate-400 mt-1">Recalculates all weeks and cumulative leaderboard</div>
            </div>
          </label>
        </div>

        <!-- Option 2: Fix a Specific Week (only show if multiple weeks) -->
        <div v-if="hasMultipleWeeks" class="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-600 transition-all cursor-pointer" @click="recalculationMode = 'specific-week'">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              v-model="recalculationMode"
              value="specific-week"
              class="mt-1"
            >
            <div class="flex-1">
              <div class="font-medium text-slate-200">Fix a Specific Week</div>
              <div class="text-xs text-slate-400 mt-1">Recalculate only that week</div>
              <select
                v-if="recalculationMode === 'specific-week'"
                v-model="selectedWeek"
                class="mt-2 w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option :value="null">Select a week...</option>
                <option v-for="week in availableWeeks" :key="week" :value="week">
                  {{ week }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <!-- Option 3: Recalculate From Week Onwards (only show if multiple weeks) -->
        <div v-if="hasMultipleWeeks" class="mb-6 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-600 transition-all cursor-pointer" @click="recalculationMode = 'from-week'">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              v-model="recalculationMode"
              value="from-week"
              class="mt-1"
            >
            <div class="flex-1">
              <div class="font-medium text-slate-200">Recalculate From Week Onwards</div>
              <div class="text-xs text-slate-400 mt-1">Recalculate from selected week through cumulative</div>
              <select
                v-if="recalculationMode === 'from-week'"
                v-model="fromWeek"
                class="mt-2 w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option :value="null">Select starting week...</option>
                <option v-for="week in availableWeeks" :key="week" :value="week">
                  {{ week }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <!-- Message Display -->
        <div v-if="recalculationMessage" class="mb-6 p-3 rounded-lg" :class="recalculationMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'">
          {{ recalculationMessage.text }}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            @click="closeRecalculateModal"
            :disabled="isRecalculating"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            :disabled="isRecalculating || (recalculationMode === 'specific-week' && !selectedWeek) || (recalculationMode === 'from-week' && !fromWeek)"
            @click="recalculateLeaderboard"
          >
            <svg v-if="!isRecalculating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{{ isRecalculating ? 'Recalculating...' : 'Recalculate' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import {
  adminTournamentService,
  type TournamentDetail,
  type TournamentTeam,
  type TournamentMatch,
  type TournamentMatchMap
} from '@/services/adminTournamentService';
import AddTournamentModal from '@/components/dashboard/AddTournamentModal.vue';
import EditTournamentThemeModal from '@/components/dashboard/EditTournamentThemeModal.vue';
import AddTeamModal from '@/components/dashboard/AddTeamModal.vue';
import AddMatchModal from '@/components/dashboard/AddMatchModal.vue';
import EditMapResultsModal from '@/components/dashboard/EditMapResultsModal.vue';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

// Track screen size for responsive toast positioning
const isDesktop = ref(window.innerWidth > 768);

const tournament = ref<TournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const logoImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showEditModal = ref(false);
const showThemeModal = ref(false);
const showAddTeamModal = ref(false);
const showAddMatchModal = ref(false);
const showEditMapResultsModal = ref(false);
const editingMatchForResults = ref<TournamentMatch | null>(null);
const deleteTeamConfirmation = ref<{ id: number; name: string } | null>(null);
const deleteMatchConfirmation = ref<{ id: number } | null>(null);
const isDeleting = ref(false);
const editingTeam = ref<TournamentTeam | undefined>(undefined);
const editingMatch = ref<TournamentMatch | undefined>(undefined);
const showRecalculateModal = ref(false);
const recalculationMode = ref<'everything' | 'specific-week' | 'from-week'>('everything');
const selectedWeek = ref<string | null>(null);
const fromWeek = ref<string | null>(null);
const isRecalculating = ref(false);
const recalculationMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const tournamentId = parseInt(route.params.id as string);

const matchesByWeekGroups = computed(() => {
  if (!tournament.value) return [];

  // Use matchesByWeek if available, otherwise fallback to grouping matches by week field
  if (tournament.value.matchesByWeek && tournament.value.matchesByWeek.length > 0) {
    // Check if there's only one week group with null week value
    const hasOnlyOneNullWeek = tournament.value.matchesByWeek.length === 1 && tournament.value.matchesByWeek[0].week === null;

    return tournament.value.matchesByWeek.map(group => ({
      week: group.week,
      hideWeekHeader: hasOnlyOneNullWeek, // Don't show week header for single null week
      matches: [...group.matches].sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      })
    }));
  }

  // Fallback: group by week field if available
  const groups: Map<string | null, typeof tournament.value.matches> = new Map();

  tournament.value.matches.forEach(match => {
    const week = match.week ?? null;
    if (!groups.has(week)) {
      groups.set(week, []);
    }
    groups.get(week)!.push(match);
  });

  // Check if there's only one week group with null week value (for fallback path)
  const hasOnlyOneNullWeek = groups.size === 1 && groups.has(null);

  // Sort groups and matches within groups
  return Array.from(groups.entries())
    .map(([week, matches]) => ({
      week,
      hideWeekHeader: hasOnlyOneNullWeek, // Don't show week header for single null week
      matches: [...matches].sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      })
    }))
    .sort((a, b) => {
      // Put unscheduled (null) at the end
      if (a.week === null) return 1;
      if (b.week === null) return -1;
      return (a.week || '').localeCompare(b.week || '');
    });
});

const availableWeeks = computed(() => {
  // Get weeks from matchesByWeekGroups, excluding null weeks
  return matchesByWeekGroups.value
    .filter(group => group.week !== null)
    .map(group => group.week as string);
});

const hasMultipleWeeks = computed(() => {
  // Check if there are multiple weeks (excluding null)
  return availableWeeks.value.length > 1;
});

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

const loadTournament = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (isNaN(tournamentId)) {
      throw new Error('Invalid tournament ID');
    }

    const data = await adminTournamentService.getTournamentDetail(tournamentId);
    // Ensure matches array exists (may be undefined for newly created tournaments)
    tournament.value = {
      ...data,
      matches: data.matches ?? []
    };

    // Update page title
    document.title = `${tournament.value.name} - Tournament Details`;

    // Set loading to false BEFORE loading images - images load asynchronously in background
    loading.value = false;

    // Load or clear hero image
    if (data.hasHeroImage) {
      loadHeroImage().catch(err => console.debug('Failed to load hero image:', err));
    } else {
      // Clear hero image if it was removed
      heroImageUrl.value = null;
    }

    // Load or clear logo image
    if (data.hasCommunityLogo) {
      loadLogoImage().catch(err => console.debug('Failed to load logo image:', err));
    } else {
      // Clear logo image if it was removed
      logoImageUrl.value = null;
    }
  } catch (err) {
    console.error('Error loading tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load tournament';
    loading.value = false;
  }
};

const loadHeroImage = async () => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/image`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      heroImageUrl.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    // Silently fail - hero image is optional
    console.debug('No hero image available');
  }
};

const loadLogoImage = async () => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/logo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      logoImageUrl.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    // Silently fail - logo image is optional
    console.debug('No logo image available');
  }
};

const getProgressPercentage = (): number => {
  if (!tournament.value?.anticipatedRoundCount || tournament.value.anticipatedRoundCount === 0) {
    return 0;
  }
  return Math.min(100, ((tournament.value.matches?.length ?? 0) / tournament.value.anticipatedRoundCount) * 100);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const viewRoundReport = (roundId: string) => {
  router.push(`/rounds/${roundId}/report`);
};

const onTournamentUpdated = () => {
  showEditModal.value = false;
  loadTournament(); // Reload to get updated data
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

const getWeekDateRange = (matches: TournamentMatch[]): string => {
  if (!matches || matches.length === 0) return '';

  const dates = matches.map(m => new Date(m.scheduledDate));

  if (dates.length === 0) return '';

  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const formatDateRange = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return `${formatDateRange(earliestDate)} - ${formatDateRange(latestDate)}`;
};

// Teams management
const editTeam = async (teamId: number) => {
  try {
    editingTeam.value = await adminTournamentService.getTeamDetail(tournamentId, teamId);
    showAddTeamModal.value = true;
  } catch (err) {
    console.error('Error loading team details:', err);
    error.value = 'Failed to load team details';
  }
};

const confirmDeleteTeam = (teamId: number, teamName: string) => {
  deleteTeamConfirmation.value = { id: teamId, name: teamName };
};

const cancelDeleteTeam = () => {
  deleteTeamConfirmation.value = null;
  isDeleting.value = false;
};

const executeDeleteTeam = async () => {
  if (!deleteTeamConfirmation.value) return;

  isDeleting.value = true;
  try {
    await adminTournamentService.deleteTeam(tournamentId, deleteTeamConfirmation.value.id);
    deleteTeamConfirmation.value = null;
    await loadTournament();
  } catch (err) {
    console.error('Error deleting team:', err);
    error.value = err instanceof Error ? err.message : 'Failed to delete team';
  } finally {
    isDeleting.value = false;
  }
};

const onTeamAdded = () => {
  showAddTeamModal.value = false;
  editingTeam.value = undefined;
  loadTournament();
};

// Matches management
const addMatchForWeek = () => {
  // Clear any editing state and open the add match modal
  editingMatch.value = undefined;
  showAddMatchModal.value = true;
};

const editMatch = async (matchId: number) => {
  try {
    editingMatch.value = await adminTournamentService.getMatchDetail(tournamentId, matchId);
    showAddMatchModal.value = true;
  } catch (err) {
    console.error('Error loading match details:', err);
    error.value = 'Failed to load match details';
  }
};

const openEditMapResultsModal = (match: TournamentMatch) => {
  editingMatchForResults.value = match;
  showEditMapResultsModal.value = true;
};

const confirmDeleteMatch = (matchId: number) => {
  deleteMatchConfirmation.value = { id: matchId };
};

const cancelDeleteMatch = () => {
  deleteMatchConfirmation.value = null;
  isDeleting.value = false;
};

const executeDeleteMatch = async () => {
  if (!deleteMatchConfirmation.value) return;

  isDeleting.value = true;
  try {
    await adminTournamentService.deleteMatch(tournamentId, deleteMatchConfirmation.value.id);
    deleteMatchConfirmation.value = null;
    await loadTournament();
  } catch (err) {
    console.error('Error deleting match:', err);
    error.value = err instanceof Error ? err.message : 'Failed to delete match';
  } finally {
    isDeleting.value = false;
  }
};

const onMatchAdded = () => {
  showAddMatchModal.value = false;
  editingMatch.value = undefined;
  loadTournament();
};

// Helper function to get only the teams participating in the match
const getMatchTeams = (match: TournamentMatch): TournamentTeam[] => {
  if (!tournament.value) return [];
  return tournament.value.teams.filter(team =>
    team.id === match.team1Id || team.id === match.team2Id
  );
};

// Helper function to get team display name (uses mapped name if available, otherwise uses round label)
const getTeamDisplayName = (map: TournamentMatchMap, teamNumber: 1 | 2): string => {
  const result = map.matchResults?.[0];
  if (teamNumber === 1) {
    return result?.team1Name || 'Team 1';
  } else {
    return result?.team2Name || 'Team 2';
  }
};

// Helper function to get results aggregation (e.g., "2-0", "1-1", "1-0-1" with draws)
const getResultsAggregation = (map: TournamentMatchMap): string => {
  const results = map.matchResults;
  if (!results || results.length === 0) return '—';

  const team1Id = results[0]?.team1Id;
  const team2Id = results[0]?.team2Id;
  if (!team1Id || !team2Id) return '—';

  const team1Wins = results.filter((r) => r.winningTeamId === team1Id).length;
  const team2Wins = results.filter((r) => r.winningTeamId === team2Id).length;
  const draws = results.filter((r) => r.winningTeamId !== team1Id && r.winningTeamId !== team2Id).length;

  if (draws > 0) {
    return `${team1Wins}-${team2Wins}-${draws}`;
  }
  return `${team1Wins}-${team2Wins}`;
};

const handleResize = () => {
  isDesktop.value = window.innerWidth > 768;
};

const openRecalculateModal = () => {
  recalculationMode.value = 'everything';
  selectedWeek.value = null;
  fromWeek.value = null;
  recalculationMessage.value = null;
  showRecalculateModal.value = true;
};

const closeRecalculateModal = () => {
  showRecalculateModal.value = false;
  recalculationMessage.value = null;
};

const recalculateLeaderboard = async () => {
  isRecalculating.value = true;
  recalculationMessage.value = null;

  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const payload: Record<string, string> = {};
    if (recalculationMode.value === 'specific-week' && selectedWeek.value) {
      payload.week = selectedWeek.value;
    } else if (recalculationMode.value === 'from-week' && fromWeek.value) {
      payload.fromWeek = fromWeek.value;
    }

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/leaderboard/recalculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to recalculate leaderboard');
    }

    recalculationMessage.value = {
      type: 'success',
      text: 'Leaderboard recalculated successfully'
    };

    // Close modal after 2 seconds
    setTimeout(() => {
      closeRecalculateModal();
    }, 2000);
  } catch (err) {
    console.error('Error recalculating leaderboard:', err);
    recalculationMessage.value = {
      type: 'error',
      text: err instanceof Error ? err.message : 'Failed to recalculate leaderboard'
    };
  } finally {
    isRecalculating.value = false;
  }
};

onMounted(() => {
  loadTournament();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* Smooth row hover transitions */
tbody tr {
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

/* Table responsive scrolling */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}

/* Markdown rules styling */
.markdown-rules :deep(h1),
.markdown-rules :deep(h2),
.markdown-rules :deep(h3),
.markdown-rules :deep(h4),
.markdown-rules :deep(h5),
.markdown-rules :deep(h6) {
  color: #cbd5e1;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-rules :deep(p) {
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.markdown-rules :deep(strong) {
  font-weight: 600;
  color: #e0f2fe;
}

.markdown-rules :deep(em) {
  color: #cbd5e1;
  font-style: italic;
}

.markdown-rules :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.markdown-rules :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.markdown-rules :deep(li) {
  margin-bottom: 0.25rem;
  color: #cbd5e1;
  margin-left: 1rem;
}

.markdown-rules :deep(code) {
  background-color: rgba(71, 85, 105, 0.5);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: #fbbf24;
  font-family: monospace;
}

.markdown-rules :deep(blockquote) {
  border-left: 3px solid #475569;
  padding-left: 1rem;
  margin-left: 0;
  color: #94a3b8;
}

.markdown-rules :deep(a) {
  color: #06b6d4;
  text-decoration: underline;
}

.markdown-rules :deep(a:hover) {
  color: #22d3ee;
}

.markdown-rules :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 0.5rem;
  overflow: hidden;
}

.markdown-rules :deep(thead) {
  background: linear-gradient(to right, rgba(51, 65, 85, 0.95), rgba(15, 23, 42, 0.95));
  backdrop-filter: blur(0.5rem);
}

.markdown-rules :deep(th) {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(71, 85, 105, 0.5);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.markdown-rules :deep(td) {
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
}

.markdown-rules :deep(tbody tr) {
  background-color: rgba(30, 41, 59, 0.3);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.markdown-rules :deep(tbody tr:nth-child(even)) {
  background-color: rgba(15, 23, 42, 0.4);
}

.markdown-rules :deep(tbody tr:hover) {
  background-color: rgba(51, 65, 85, 0.4);
  box-shadow: inset 0 0 12px rgba(6, 182, 212, 0.1);
}

/* Toast transition animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) translateY(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) translateY(30px);
}
</style>
