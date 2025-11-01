<template>
  <div class="relative min-h-screen px-3 sm:px-6 pb-12">
    <!-- Background Effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
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
            <!-- Community Logo Display -->
            <div v-if="logoImageUrl" class="mb-6 flex justify-center">
              <img
                :src="logoImageUrl"
                alt="Community logo"
                class="max-h-20 object-contain"
              >
            </div>

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
                    <span>{{ tournament.matches.length }}/{{ tournament.anticipatedRoundCount }} matches</span>
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-all flex items-center gap-2"
                  @click="showEditModal = true"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
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

          <div class="p-4 sm:p-6">
            <!-- Matches List -->
            <div v-if="sortedMatches.length > 0" class="space-y-4">
              <div
                v-for="match in sortedMatches"
                :key="match.id"
                class="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-violet-500/30 transition-all"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-sm text-slate-400">📅 {{ formatMatchDate(match.scheduledDate) }}</span>
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
                  <div class="flex items-center gap-2">
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
                </div>

                <!-- Maps List -->
                <div class="space-y-2">
                  <div
                    v-for="map in match.maps"
                    :key="map.id"
                    class="flex items-center justify-between gap-3 bg-slate-700/30 rounded-lg p-3 border border-slate-600/30"
                  >
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <span class="text-sm font-mono text-slate-500 flex-shrink-0">{{ map.mapOrder + 1 }}</span>
                      <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span class="text-amber-400 font-medium truncate">{{ map.mapName }}</span>
                        <span v-if="map.teamName" class="text-xs text-emerald-400">
                          Selected by {{ map.teamName }}
                        </span>
                      </div>
                      <button
                        v-if="map.roundId"
                        class="p-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 rounded transition-all flex-shrink-0"
                        @click="viewRoundReport(map.roundId)"
                        :title="`View round report`"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <button
                        v-if="map.roundId"
                        class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-all text-xs font-medium"
                        @click="linkRound(match, map)"
                        title="Change the linked round"
                      >
                        Change
                      </button>
                      <button
                        v-if="map.roundId"
                        class="p-1.5 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 border border-slate-500/30 hover:border-slate-500/50 rounded-lg transition-all"
                        @click="unlinkRound(match, map)"
                        title="Unlink round from this map"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        v-else
                        class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-all text-xs font-medium"
                        @click="linkRound(match, map)"
                        title="Link completed round to this map"
                      >
                        Link Round
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
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
      :match="editingMatch"
      @close="showAddMatchModal = false; editingMatch = undefined"
      @added="onMatchAdded"
    />

    <!-- Link Round Modal -->
    <AddRoundModal
      v-if="showLinkRoundModal && tournament && linkingMatch && linkingMap"
      :tournament-id="tournament.id"
      :game="tournament.game"
      :default-server-guid="linkingMatch.serverGuid"
      :default-server-name="linkingMatch.serverName"
      :default-map-name="linkingMap.mapName"
      :multi-select="false"
      @close="showLinkRoundModal = false; linkingMatch = undefined; linkingMap = undefined"
      @added="onRoundLinked"
    />

    <!-- Delete Team Confirmation Modal -->
    <div
      v-if="deleteTeamConfirmation"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
import AddRoundModal from '@/components/dashboard/AddRoundModal.vue';
import AddTeamModal from '@/components/dashboard/AddTeamModal.vue';
import AddMatchModal from '@/components/dashboard/AddMatchModal.vue';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

const router = useRouter();
const route = useRoute();

const tournament = ref<TournamentDetail | null>(null);
const heroImageUrl = ref<string | null>(null);
const logoImageUrl = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showEditModal = ref(false);
const showAddTeamModal = ref(false);
const showAddMatchModal = ref(false);
const showLinkRoundModal = ref(false);
const deleteTeamConfirmation = ref<{ id: number; name: string } | null>(null);
const deleteMatchConfirmation = ref<{ id: number } | null>(null);
const isDeleting = ref(false);
const editingTeam = ref<TournamentTeam | undefined>(undefined);
const editingMatch = ref<TournamentMatch | undefined>(undefined);
const linkingMatch = ref<TournamentMatch | undefined>(undefined);
const linkingMap = ref<TournamentMatchMap | undefined>(undefined);

const tournamentId = parseInt(route.params.id as string);

const sortedMatches = computed(() => {
  if (!tournament.value) return [];
  return [...tournament.value.matches].sort((a, b) => {
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });
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
    tournament.value = data;

    // Load hero image if available
    if (data.heroImageBase64) {
      heroImageUrl.value = `data:${data.heroImageContentType || 'image/png'};base64,${data.heroImageBase64}`;
    } else {
      // Try to fetch from API
      await loadHeroImage();
    }

    // Load logo image if available
    if (data.communityLogoBase64) {
      logoImageUrl.value = `data:${data.communityLogoContentType || 'image/png'};base64,${data.communityLogoBase64}`;
    } else {
      // Try to fetch from API
      await loadLogoImage();
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
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(adminTournamentService.getTournamentImageUrl(tournamentId), {
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

    const response = await fetch(adminTournamentService.getTournamentLogoUrl(tournamentId), {
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
  return Math.min(100, (tournament.value.matches.length / tournament.value.anticipatedRoundCount) * 100);
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
const editMatch = async (matchId: number) => {
  try {
    editingMatch.value = await adminTournamentService.getMatchDetail(tournamentId, matchId);
    showAddMatchModal.value = true;
  } catch (err) {
    console.error('Error loading match details:', err);
    error.value = 'Failed to load match details';
  }
};

const linkRound = (match: TournamentMatch, map: TournamentMatchMap) => {
  linkingMatch.value = match;
  linkingMap.value = map;
  showLinkRoundModal.value = true;
};

const unlinkRound = async (match: TournamentMatch, map: TournamentMatchMap) => {
  if (!tournament.value) return;

  try {
    await adminTournamentService.updateMatchMap(tournament.value.id, match.id, map.id, {
      mapId: map.id,
      roundId: null,
      updateRoundId: true
    });
    await loadTournament();
  } catch (err) {
    console.error('Error unlinking round:', err);
    error.value = err instanceof Error ? err.message : 'Failed to unlink round';
  }
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

const onRoundLinked = async (roundId: string) => {
  if (!linkingMatch.value || !linkingMap.value) return;

  try {
    // Link the round to the specific map
    await adminTournamentService.updateMatchMap(tournamentId, linkingMatch.value.id, linkingMap.value.id, {
      mapId: linkingMap.value.id,
      roundId,
      updateRoundId: true,
    });

    showLinkRoundModal.value = false;
    linkingMatch.value = undefined;
    linkingMap.value = undefined;
    await loadTournament();
  } catch (err) {
    console.error('Error linking round to map:', err);
    error.value = err instanceof Error ? err.message : 'Failed to link round to map';
  }
};

onMounted(() => {
  loadTournament();
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
</style>
