<template>
  <div class="min-h-screen pb-12 text-bf-text" :style="{ ...themeVars, backgroundColor: getBackgroundColor() }">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="error" class="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div class="relative z-10 text-center max-w-lg w-full">
        <div class="mb-8 flex justify-center">
          <div class="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 class="text-4xl md:text-5xl font-black mb-4" :style="{ color: getAccentColor() }">
          Tournament Not Found
        </h1>

        <p class="text-lg mb-8" :style="{ color: getTextMutedColor() }">
          {{ error }}
        </p>
      </div>
    </div>

    <div v-else-if="tournament">
      <TournamentHero
        :tournament="tournament"
        :tournament-id="tournamentId"
        :hero-image-url="heroImageUrl"
        :logo-image-url="logoImageUrl"
      />

      <!-- Content -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 space-y-8">
        <!-- Registration Section (for authenticated users) -->
        <div v-if="isAuthenticated && registrationStatus">
          <!-- Already on a team - show registered status with manage option -->
          <div v-if="registrationStatus.teamMembership">
            <div
              class="backdrop-blur-sm border-2 rounded-xl p-4 sm:p-5"
              :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }"
            >
              <!-- Main row: info left, actions right -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    :style="{ backgroundColor: getAccentColor() + '22', border: `2px solid ${getAccentColor()}` }"
                  >
                    ✓
                  </div>
                  <div>
                    <h2 class="text-lg font-bold" :style="{ color: getTextColor() }">
                      You're Registered
                    </h2>
                    <p class="text-sm" :style="{ color: getTextMutedColor() }">
                      Playing for <span class="font-semibold" :style="{ color: getAccentColor() }">{{ registrationStatus.teamMembership.teamName }}</span>
                      <span v-if="registrationStatus.teamMembership.isLeader" class="opacity-75"> · Leader</span>
                      <span
                        v-else-if="registrationStatus.teamMembership.membershipStatus === MembershipStatus.Pending"
                        class="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      >
                        Pending Approval
                      </span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 sm:gap-3">
                  <button
                    v-if="tournament?.registrationRules"
                    class="text-sm font-medium px-3 py-2 rounded-lg transition-all"
                    :style="{ backgroundColor: showRegistrationRules ? getAccentColor() + '33' : 'transparent', color: getAccentColor(), border: `1px solid ${getAccentColor()}66` }"
                    @click="showRegistrationRules = !showRegistrationRules"
                  >
                    {{ showRegistrationRules ? 'Hide' : 'View' }} Info
                  </button>
                  <button
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                    :style="{ backgroundColor: getAccentColor(), color: getAccentTextColor }"
                    @click="showManageTeamModal = true"
                  >
                    Manage Team
                  </button>
                </div>
              </div>

              <!-- Expandable registration rules -->
              <div
                v-if="showRegistrationRules && tournament?.registrationRules"
                class="mt-4 p-4 rounded-lg border"
                :style="{ backgroundColor: getBackgroundMuteColor(), borderColor: getAccentColor() + '44' }"
              >
                <div
                  class="prose prose-invert prose-sm max-w-none markdown-rules"
                  :style="{
                    '--color-text': getTextColor(),
                    '--color-text-muted': getTextMutedColor(),
                    '--rule-primary': getAccentColor(),
                    '--rule-secondary': getAccentColor(),
                  } as Record<string, string>"
                  v-html="renderedRegistrationRules"
                />
              </div>
            </div>
          </div>

          <!-- Not on a team - show registration options -->
          <div v-else-if="registrationStatus.isRegistrationOpen" class="text-center">
            <div
              class="inline-block backdrop-blur-sm border-2 rounded-xl p-6 sm:p-8"
              :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }"
            >
              <h2 class="text-xl sm:text-2xl font-bold mb-2" :style="{ color: getTextColor() }">
                Registration Open
              </h2>
              <p class="mb-4" :style="{ color: getTextMutedColor() }">
                Join the tournament by creating a new team or joining an existing one
              </p>

              <!-- Registration Rules Toggle -->
              <div v-if="tournament?.registrationRules" class="mb-6">
                <button
                  class="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                  :style="{ backgroundColor: showRegistrationRules ? getAccentColor() + '33' : 'transparent', color: getAccentColor(), border: `1px solid ${getAccentColor()}66` }"
                  @click="showRegistrationRules = !showRegistrationRules"
                >
                  {{ showRegistrationRules ? 'Hide' : 'View' }} Registration Info
                </button>
                <div
                  v-if="showRegistrationRules"
                  class="mt-4 text-left p-4 rounded-lg border"
                  :style="{ backgroundColor: getBackgroundMuteColor(), borderColor: getAccentColor() + '44' }"
                >
                  <div
                    class="prose prose-invert prose-sm max-w-none markdown-rules"
                    :style="{
                      '--color-text': getTextColor(),
                      '--color-text-muted': getTextMutedColor(),
                      '--rule-primary': getAccentColor(),
                      '--rule-secondary': getAccentColor(),
                    } as Record<string, string>"
                    v-html="renderedRegistrationRules"
                  />
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  class="px-6 py-3 font-medium rounded-lg transition-all hover:scale-105"
                  :style="{ backgroundColor: getAccentColor(), color: getAccentTextColor }"
                  @click="showCreateTeamModal = true"
                >
                  Create a Team
                </button>
                <button
                  class="px-6 py-3 font-medium rounded-lg border-2 transition-all hover:scale-105"
                  :style="{ borderColor: getAccentColor(), color: getAccentColor(), backgroundColor: 'transparent' }"
                  @click="showJoinTeamModal = true"
                >
                  Join a Team
                </button>
              </div>
            </div>
          </div>

          <!-- Registration closed message (only show if not on a team and registration is closed) -->
          <div v-else class="text-center">
            <div
              class="inline-block backdrop-blur-sm border-2 rounded-xl p-6"
              :style="{ borderColor: getTextMutedColor() + '44', backgroundColor: getBackgroundSoftColor() }"
            >
              <p :style="{ color: getTextMutedColor() }">
                Registration is currently closed for this tournament.
              </p>
            </div>
          </div>
        </div>

        <!-- Fallback: Authenticated but API failed - show registration UI if tournament status indicates registration -->
        <div v-else-if="isAuthenticated && registrationStatusError && isTournamentInRegistration()" class="text-center">
          <div
            class="inline-block backdrop-blur-sm border-2 rounded-xl p-6 sm:p-8"
            :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }"
          >
            <h2 class="text-xl sm:text-2xl font-bold mb-2" :style="{ color: getTextColor() }">
              Registration Open
            </h2>
            <p class="mb-4" :style="{ color: getTextMutedColor() }">
              Join the tournament by creating a new team or joining an existing one
            </p>

            <!-- Registration Rules Toggle -->
            <div v-if="tournament?.registrationRules" class="mb-6">
              <button
                class="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                :style="{ backgroundColor: showRegistrationRules ? getAccentColor() + '33' : 'transparent', color: getAccentColor(), border: `1px solid ${getAccentColor()}66` }"
                @click="showRegistrationRules = !showRegistrationRules"
              >
                {{ showRegistrationRules ? 'Hide' : 'View' }} Registration Info
              </button>
              <div
                v-if="showRegistrationRules"
                class="mt-4 text-left p-4 rounded-lg border"
                :style="{ backgroundColor: getBackgroundMuteColor(), borderColor: getAccentColor() + '44' }"
              >
                <div
                  class="prose prose-invert prose-sm max-w-none markdown-rules"
                  :style="{
                    '--color-text': getTextColor(),
                    '--color-text-muted': getTextMutedColor(),
                    '--rule-primary': getAccentColor(),
                    '--rule-secondary': getAccentColor(),
                  } as Record<string, string>"
                  v-html="renderedRegistrationRules"
                />
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                class="px-6 py-3 font-medium rounded-lg transition-all hover:scale-105"
                :style="{ backgroundColor: getAccentColor(), color: getAccentTextColor }"
                @click="showCreateTeamModal = true"
              >
                Create a Team
              </button>
              <button
                class="px-6 py-3 font-medium rounded-lg border-2 transition-all hover:scale-105"
                :style="{ borderColor: getAccentColor(), color: getAccentColor(), backgroundColor: 'transparent' }"
                @click="showJoinTeamModal = true"
              >
                Join a Team
              </button>
            </div>
          </div>
        </div>

        <!-- Sign in prompt for unauthenticated users when registration might be open -->
        <div v-else-if="!isAuthenticated && isTournamentInRegistration()" class="text-center">
          <div
            class="inline-block backdrop-blur-sm border-2 rounded-xl p-6 sm:p-8"
            :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }"
          >
            <h2 class="text-xl sm:text-2xl font-bold mb-2" :style="{ color: getTextColor() }">
              Registration Open
            </h2>
            <p class="mb-4" :style="{ color: getTextMutedColor() }">
              Sign in with Discord to register for this tournament
            </p>

            <!-- Registration Rules Toggle -->
            <div v-if="tournament?.registrationRules" class="mb-6">
              <button
                class="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                :style="{ backgroundColor: showRegistrationRules ? getAccentColor() + '33' : 'transparent', color: getAccentColor(), border: `1px solid ${getAccentColor()}66` }"
                @click="showRegistrationRules = !showRegistrationRules"
              >
                {{ showRegistrationRules ? 'Hide' : 'View' }} Registration Info
              </button>
              <div
                  v-if="showRegistrationRules"
                  class="mt-4 text-left p-4 rounded-lg border"
                  :style="{ backgroundColor: getBackgroundMuteColor(), borderColor: getAccentColor() + '44' }"
                >
                  <div
                    class="prose prose-invert prose-sm max-w-none markdown-rules"
                    :style="{
                      '--color-text': getTextColor(),
                      '--color-text-muted': getTextMutedColor(),
                      '--rule-primary': getAccentColor(),
                      '--rule-secondary': getAccentColor(),
                    } as Record<string, string>"
                    v-html="renderedRegistrationRules"
                  />
                </div>
              </div>

            <!-- Enhanced Discord Sign-in Button -->
            <div class="flex justify-center">
              <button
                v-if="!isAuthenticated"
                class="group flex items-center justify-center gap-4 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 max-w-xs"
                :disabled="isLoginLoading"
                @click="handleDiscordLogin"
                style="box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4), 0 0 0 1px rgba(88, 101, 242, 0.2)"
              >
              <svg
                class="w-8 h-8 flex-shrink-0 transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
                <span class="text-lg">{{ isLoginLoading ? 'Signing in...' : 'Sign in with Discord' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Teams Grid -->
        <div v-if="tournament.teams && tournament.teams.length > 0">
          <h2 class="text-2xl font-bold mb-6" :style="{ color: getTextColor() }">
            Registered Teams ({{ tournament.teams.length }})
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="team in sortedTeams"
              :key="team.id"
              class="backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all hover:border-opacity-100"
              :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }"
            >
              <!-- Team Header -->
              <div class="px-6 py-4 border-b-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundSoftColor() }">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-bold" :style="{ color: getTextColor() }">
                    {{ team.name }}
                  </h3>
                  <button
                    v-if="isUserTeam(team.id)"
                    class="text-sm font-medium opacity-75 hover:opacity-100 transition-opacity"
                    :style="{ color: getAccentColor() }"
                    @click="openManageTeamModal(team.id)"
                  >
                    Manage
                  </button>
                </div>
                
                <!-- Recruitment Status Badge -->
                <div 
                  v-if="isTournamentInRegistration()"
                  class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  :style="getRecruitmentStatusStyle(team.recruitmentStatus)"
                >
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getRecruitmentDotColor(team.recruitmentStatus) }"></span>
                  {{ getRecruitmentStatusText(team.recruitmentStatus) }}
                </div>
              </div>

              <!-- Team Content -->
              <div class="px-6 py-4">
                <!-- Players List -->
                <div v-if="team.players && sortedPlayers(team.players, isLeaderOfTeam(team.id)).length > 0" class="space-y-2">
                  <p class="text-xs font-bold uppercase" :style="{ color: getTextMutedColor() }">
                    {{ sortedPlayers(team.players).length }} Player<span v-if="sortedPlayers(team.players).length !== 1">s</span>
                    <span v-if="isLeaderOfTeam(team.id) && sortedPlayers(team.players, true).length > sortedPlayers(team.players).length" class="text-amber-400 font-normal normal-case">
                      (+{{ sortedPlayers(team.players, true).length - sortedPlayers(team.players).length }} pending)
                    </span>
                  </p>
                  <ul class="space-y-1">
                    <li
                      v-for="(player, idx) in sortedPlayers(team.players, isLeaderOfTeam(team.id))"
                      :key="idx"
                      class="text-sm py-1 px-2 rounded flex items-center gap-2"
                      :style="{ backgroundColor: getBackgroundMuteColor() }"
                    >
                      <router-link
                        :to="`/players/${encodeURIComponent(player.playerName)}`"
                        class="hover:underline transition-colors flex-1"
                        :style="{ color: player.membershipStatus === MembershipStatus.Pending ? getTextMutedColor() : getTextColor() }"
                      >
                        {{ player.playerName }}
                      </router-link>
                      <span
                        v-if="player.isLeader"
                        class="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        :style="{
                          backgroundColor: getAccentColor() + '20',
                          color: getAccentColor(),
                          border: `1px solid ${getAccentColor()}40`
                        }"
                      >
                        👑 Leader
                      </span>
                      <span
                        v-else-if="player.membershipStatus === MembershipStatus.Pending"
                        class="text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      >
                        Pending
                      </span>
                    </li>
                  </ul>
                </div>
                <div v-else class="text-sm" :style="{ color: getTextMutedColor() }">
                  No players registered yet
                </div>
              </div>

              <!-- Team Meta -->
              <div class="px-6 py-3 border-t-2" :style="{ borderColor: getAccentColor(), backgroundColor: getBackgroundMuteColor() }">
                <p class="text-xs" :style="{ color: getTextMutedColor() }">
                  Registered: {{ formatDate(team.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="text-8xl mb-6 opacity-50">
            <svg class="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: getTextMutedColor() }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-3" :style="{ color: getTextColor() }">No Teams Registered</h3>
          <p :style="{ color: getTextMutedColor() }">
            Teams will appear here once they register for the tournament.
          </p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateTeamModal
      :is-visible="showCreateTeamModal"
      :tournament-id="parseInt(tournamentId)"
      :registration-rules="tournament?.registrationRules"
      :accent-color="getAccentColor()"
      @close="showCreateTeamModal = false"
      @success="handleTeamCreated"
    />

    <JoinTeamModal
      :is-visible="showJoinTeamModal"
      :tournament-id="parseInt(tournamentId)"
      :registration-rules="tournament?.registrationRules"
      :accent-color="getAccentColor()"
      @close="showJoinTeamModal = false"
      @success="handleTeamJoined"
    />

    <!-- Team Management Modal -->
    <Teleport to="body">
      <div
        v-if="showManageTeamModal && registrationStatus?.teamMembership"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showManageTeamModal = false" />
        <div class="relative w-full max-w-2xl">
          <button
            class="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            @click="showManageTeamModal = false"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <TeamManagementPanel
            :tournament-id="parseInt(tournamentId)"
            :team-id="registrationStatus.teamMembership.teamId"
            :is-leader="registrationStatus.teamMembership.isLeader"
            :accent-color="getAccentColor()"
            :text-color="getTextColor()"
            :text-muted-color="getTextMutedColor()"
            :background-color="getBackgroundSoftColor()"
            :background-mute-color="getBackgroundMuteColor()"
            @team-updated="handleTeamUpdated"
            @left-team="handleLeftTeam"
            @deleted-team="handleDeletedTeam"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { marked } from 'marked'
import TournamentHero from '@/components/TournamentHero.vue'
import LoginButton from '@/components/LoginButton.vue'
import CreateTeamModal from '@/components/CreateTeamModal.vue'
import JoinTeamModal from '@/components/JoinTeamModal.vue'
import TeamManagementPanel from '@/components/TeamManagementPanel.vue'
import { usePublicTournamentPage } from '@/composables/usePublicTournamentPage'
import { useAuth } from '@/composables/useAuth'
import { teamRegistrationService, TeamRecruitmentStatus, MembershipStatus, getRecruitmentStatusText, getRecruitmentStatusMessage, type RegistrationStatusResponse } from '@/services/teamRegistrationService'
import { notificationService } from '@/services/notificationService'

const {
  tournament,
  loading,
  error,
  heroImageUrl,
  logoImageUrl,
  tournamentId,
  themeVars,
  getBackgroundColor,
  getTextColor,
  getTextMutedColor,
  getAccentColor,
  getBackgroundMuteColor,
  getBackgroundSoftColor,
  loadTournament,
  clearCache,
} = usePublicTournamentPage()

// Computed property for accent text color (black on light accents, white on dark accents)
const getAccentTextColor = computed(() => {
  const accent = getAccentColor()
  if (!accent) return '#FFFFFF'

  // Simple luminance calculation
  const hex = accent.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculate luminance using the formula: (0.299*R + 0.587*G + 0.114*B)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // If accent color is light (high luminance), use dark text; if dark, use light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
})

const { isAuthenticated, loginWithDiscord } = useAuth()

// Registration state
const registrationStatus = ref<RegistrationStatusResponse | null>(null)
const registrationStatusError = ref(false)
const showCreateTeamModal = ref(false)
const showJoinTeamModal = ref(false)
const showManageTeamModal = ref(false)

// Discord login state
const isLoginLoading = ref(false)

// Registration rules display
const showRegistrationRules = ref(false)
const renderedRegistrationRules = computed(() => {
  if (!tournament.value?.registrationRules) return ''
  try {
    return marked(tournament.value.registrationRules, { breaks: true })
  } catch {
    return ''
  }
})

// Sort teams so user's team appears first
const sortedTeams = computed(() => {
  if (!tournament.value?.teams) return []
  const userTeamId = registrationStatus.value?.teamMembership?.teamId
  if (!userTeamId) return tournament.value.teams

  return [...tournament.value.teams].sort((a, b) => {
    if (a.id === userTeamId) return -1
    if (b.id === userTeamId) return 1
    return 0
  })
})

const isUserTeam = (teamId: number) => {
  return registrationStatus.value?.teamMembership?.teamId === teamId
}

const openManageTeamModal = (_teamId: number) => {
  showManageTeamModal.value = true
}

const loadRegistrationStatus = async () => {
  if (!isAuthenticated.value || !tournamentId.value) return

  registrationStatusError.value = false
  try {
    registrationStatus.value = await teamRegistrationService.getRegistrationStatus(parseInt(tournamentId.value))
  } catch (err) {
    // API might not exist yet or user might not have access
    registrationStatus.value = null
    registrationStatusError.value = true
  }
}

// Check if tournament is in registration phase based on status string
const isTournamentInRegistration = () => {
  return tournament.value?.status?.toLowerCase() === 'registration'
}

// Helper functions for recruitment status styling
const getRecruitmentStatusStyle = (status: TeamRecruitmentStatus) => {
  switch (status) {
    case TeamRecruitmentStatus.Open:
      return {
        backgroundColor: '#10b98133',
        color: '#10b981',
        border: '1px solid #10b98155'
      }
    case TeamRecruitmentStatus.Closed:
      return {
        backgroundColor: '#ef444433',
        color: '#ef4444',
        border: '1px solid #ef444455'
      }
    case TeamRecruitmentStatus.LookingForBTeam:
      return {
        backgroundColor: '#f59e0b33',
        color: '#f59e0b',
        border: '1px solid #f59e0b55'
      }
    default:
      return {
        backgroundColor: getAccentColor() + '33',
        color: getAccentColor(),
        border: `1px solid ${getAccentColor()}55`
      }
  }
}

const getRecruitmentDotColor = (status: TeamRecruitmentStatus) => {
  switch (status) {
    case TeamRecruitmentStatus.Open:
      return '#10b981'
    case TeamRecruitmentStatus.Closed:
      return '#ef4444'
    case TeamRecruitmentStatus.LookingForBTeam:
      return '#f59e0b'
    default:
      return getAccentColor()
  }
}

const handleTeamCreated = async () => {
  showCreateTeamModal.value = false
  // Clear tournament cache to ensure fresh data is loaded
  clearCache(parseInt(tournamentId.value))
  await loadRegistrationStatus()
  await loadTournament()
}

const handleTeamJoined = async (_teamId: number, teamName: string, isPending: boolean) => {
  showJoinTeamModal.value = false
  // Clear tournament cache to ensure fresh data is loaded
  clearCache(parseInt(tournamentId.value))
  await loadRegistrationStatus()
  await loadTournament()

  // Show appropriate notification based on pending status
  if (isPending) {
    notificationService.addNotification({
      type: 'info',
      title: 'Request Submitted',
      message: `Waiting for ${teamName} leader to approve your membership.`,
      duration: 5000
    })
  }
}

const handleTeamUpdated = async () => {
  // Clear tournament cache to ensure fresh data is loaded
  clearCache(parseInt(tournamentId.value))
  await loadTournament()
}

const handleLeftTeam = async () => {
  showManageTeamModal.value = false
  // Clear tournament cache to ensure fresh data is loaded
  clearCache(parseInt(tournamentId.value))
  await loadRegistrationStatus()
  await loadTournament()
}

const handleDeletedTeam = async () => {
  showManageTeamModal.value = false
  // Clear tournament cache to ensure fresh data is loaded
  clearCache(parseInt(tournamentId.value))
  await loadRegistrationStatus()
  await loadTournament()
}

const handleDiscordLogin = async () => {
  if (isLoginLoading.value) return

  try {
    isLoginLoading.value = true
    await loginWithDiscord()
  } catch (error) {
    console.error('Discord login failed:', error)
    // Could add a toast notification here if desired
  } finally {
    isLoginLoading.value = false
  }
}

// Get current user's player name if they're on a team
const currentUserPlayerName = computed(() => registrationStatus.value?.teamMembership?.playerName)

// Sort players with leaders first, filtering out pending members (unless viewer is leader or it's themselves)
const sortedPlayers = (players: { playerName: string; isLeader?: boolean; membershipStatus?: MembershipStatus | null }[], includePending = false) => {
  return [...players]
    // Filter out pending members unless includePending is true or it's the current user
    // Treat missing/null membershipStatus as Approved for backward compatibility
    .filter(p =>
      includePending ||
      p.membershipStatus === MembershipStatus.Approved ||
      p.membershipStatus == null ||
      p.playerName === currentUserPlayerName.value
    )
    .sort((a, b) => {
      // Leaders come first
      if (a.isLeader && !b.isLeader) return -1
      if (!a.isLeader && b.isLeader) return 1
      // Approved members before pending
      const aApproved = a.membershipStatus === MembershipStatus.Approved || a.membershipStatus == null
      const bApproved = b.membershipStatus === MembershipStatus.Approved || b.membershipStatus == null
      if (aApproved && !bApproved) return -1
      if (!aApproved && bApproved) return 1
      // Then sort alphabetically by player name
      return a.playerName.localeCompare(b.playerName)
    })
}

// Check if current user is the leader of a specific team
const isLeaderOfTeam = (teamId: number) => {
  return registrationStatus.value?.teamMembership?.teamId === teamId &&
         registrationStatus.value?.teamMembership?.isLeader
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Load registration status when authenticated
watch(
  () => isAuthenticated.value,
  (authenticated) => {
    if (authenticated) {
      loadRegistrationStatus()
    } else {
      registrationStatus.value = null
    }
  },
  { immediate: true }
)

// Reload registration status when tournament changes
watch(
  () => tournamentId.value,
  () => {
    if (isAuthenticated.value) {
      loadRegistrationStatus()
    }
  }
)

// Watch tournament data and update page title when it loads
watch(tournament, (newTournament) => {
  if (newTournament) {
    const fullTitle = `Teams - ${newTournament.name} - BF Stats`
    document.title = fullTitle
    notificationService.updateOriginalTitle()
  }
})

onMounted(() => {
  if (isAuthenticated.value) {
    loadRegistrationStatus()
  }
})
</script>

<style scoped>
/* Markdown rules styling */
.markdown-rules :deep(h1),
.markdown-rules :deep(h2),
.markdown-rules :deep(h3),
.markdown-rules :deep(h4),
.markdown-rules :deep(h5),
.markdown-rules :deep(h6) {
  color: var(--color-text);
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
  color: var(--color-text);
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
  color: var(--color-text);
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  border: 1px solid var(--rule-primary);
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
  color: var(--color-text);
  text-decoration: underline;
  font-weight: 600;
  transition: all 0.2s ease;
}

.markdown-rules :deep(a:hover) {
  color: var(--color-text);
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
  color: var(--color-text);
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
