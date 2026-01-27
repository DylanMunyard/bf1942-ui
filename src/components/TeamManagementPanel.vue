<template>
  <div
    class="backdrop-blur-sm border-2 rounded-xl"
    :style="{ borderColor: accentColor, backgroundColor: backgroundColor }"
  >
    <!-- Pending Approval Banner (for non-leaders who are pending) -->
    <div
      v-if="!isLeader && props.membershipStatus === MembershipStatus.Pending"
      class="px-6 py-4 border-b-2 border-amber-500/30 bg-amber-500/10"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-amber-400">Awaiting Approval</p>
          <p class="text-sm text-amber-200/70">The team leader needs to approve your join request</p>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div
      class="px-6 py-4 border-b-2"
      :style="{ borderColor: accentColor, background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)` }"
    >
      <div>
        <h3 class="text-lg font-bold" :style="{ color: textColor }">
          {{ teamDetails?.teamName || 'Your Team' }}
          <span v-if="teamDetails?.tag" class="text-sm font-normal opacity-75 ml-2">{{ teamDetails.tag }}</span>
        </h3>
        <p class="text-sm mt-1" :style="{ color: textMutedColor }">
          <span v-if="isAdmin && !isLeader" class="text-cyan-400">Tournament Admin</span>
          <span v-else-if="isLeader">Team Leader</span>
          <span v-else-if="props.membershipStatus === MembershipStatus.Pending" class="text-amber-400">Pending Approval</span>
          <span v-else>Team Member</span>
          &middot; {{ approvedPlayers.length }} player{{ approvedPlayers.length !== 1 ? 's' : '' }}
          <span v-if="canPerformLeaderActions && pendingPlayers.length > 0" class="ml-2 text-amber-400">
            &middot; {{ pendingPlayers.length }} pending
          </span>
        </p>
      </div>
    </div>

    <!-- Recruitment Status Selector (Leader or Admin) -->
    <div v-if="canPerformLeaderActions" class="px-6 py-4 border-b-2" :style="{ borderColor: accentColor + '44' }">
      <div class="mb-2 flex items-center gap-2">
        <h4 class="text-sm font-semibold" :style="{ color: textColor }">Recruitment Status</h4>
        <span 
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
          :style="getRecruitmentStatusStyle(teamDetails?.recruitmentStatus ?? TeamRecruitmentStatus.Open)"
        >
          <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: getRecruitmentDotColor(teamDetails?.recruitmentStatus ?? TeamRecruitmentStatus.Open) }"></span>
          {{ getRecruitmentStatusText(teamDetails?.recruitmentStatus ?? TeamRecruitmentStatus.Open) }}
        </span>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          v-for="status in recruitmentStatusOptions"
          :key="status.value"
          :disabled="isUpdatingStatus || teamDetails?.recruitmentStatus === status.value"
          class="flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left"
          :class="getStatusButtonClasses(status.value)"
          :style="teamDetails?.recruitmentStatus === status.value ? getStatusButtonActiveStyle(status.value) : {}"
          @click="handleUpdateRecruitmentStatus(status.value)"
        >
          <span class="text-sm font-medium" :style="{ color: teamDetails?.recruitmentStatus === status.value ? getRecruitmentDotColor(status.value) : textColor }">
            {{ status.label }}
          </span>
          <span class="text-xs mt-1" :style="{ color: textMutedColor }">
            {{ status.description }}
          </span>
        </button>
      </div>
      
      <div v-if="recruitmentStatusError" class="text-red-400 text-sm mt-2">{{ recruitmentStatusError }}</div>
    </div>

    <!-- Add Player Form (Leader or Admin) -->
    <div v-if="canPerformLeaderActions" class="px-6 py-4 border-b-2" :style="{ borderColor: accentColor + '44' }">
      <MultiPlayerSelector
        :current-players="teamDetails?.players?.map(p => p.playerName) || []"
        :loading="isAddingPlayer"
        placeholder="Search players to add..."
        help-text="Search for players and select multiple to add them to your team. Great for adding clan members!"
        :accent-color="accentColor"
        :text-color="textColor"
        :text-muted-color="textMutedColor"
        :background-color="backgroundColor"
        :background-mute-color="backgroundMuteColor"
        @add-players="handleAddMultiplePlayers"
        @remove-player="handleRemovePlayerFromSelector"
        @clear-all-players="handleClearAllPlayers"
      />
      <div v-if="addPlayerError" class="text-red-400 text-sm mt-2">{{ addPlayerError }}</div>
    </div>

    <!-- Pending Approvals Section (Leader or Admin) -->
    <div v-if="canPerformLeaderActions && pendingPlayers.length > 0" class="px-6 py-4 border-b-2" :style="{ borderColor: accentColor + '44' }">
      <h4 class="text-sm font-semibold mb-3 flex items-center gap-2" :style="{ color: textColor }">
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        Pending Approvals ({{ pendingPlayers.length }})
      </h4>
      <div class="space-y-2">
        <div
          v-for="player in pendingPlayers"
          :key="player.playerName"
          class="flex items-center justify-between p-3 rounded-lg border-2 border-amber-500/30"
          :style="{ backgroundColor: backgroundMuteColor }"
        >
          <div class="flex items-center gap-3">
            <div>
              <router-link
                :to="`/players/${encodeURIComponent(player.playerName)}`"
                class="font-medium hover:underline"
                :style="{ color: textColor }"
              >
                {{ player.playerName }}
              </router-link>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Pending
                </span>
                <span class="text-xs" :style="{ color: textMutedColor }">
                  Requested {{ formatDate(player.joinedAt) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Approve Button -->
            <button
              class="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
              title="Approve member"
              :disabled="isApprovingMember === player.playerName"
              @click="handleApproveMember(player.playerName)"
            >
              <svg v-if="isApprovingMember === player.playerName" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <!-- Reject Button -->
            <button
              class="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
              title="Reject request"
              :disabled="isRemovingPlayer === player.playerName"
              @click="handleRemovePlayer(player.playerName)"
            >
              <svg v-if="isRemovingPlayer === player.playerName" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Players List -->
    <div class="px-6 py-4">
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <svg class="w-6 h-6 animate-spin" :style="{ color: accentColor }" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <div v-else-if="loadError" class="text-red-400 text-sm py-4">{{ loadError }}</div>

      <div v-else-if="approvedPlayers.length" class="space-y-2">
        <div
          v-for="player in approvedPlayers"
          :key="player.playerName"
          class="flex items-center justify-between p-3 rounded-lg"
          :style="{ backgroundColor: backgroundMuteColor }"
        >
          <div class="flex items-center gap-3">
            <div>
              <router-link
                :to="`/players/${encodeURIComponent(player.playerName)}`"
                class="font-medium hover:underline"
                :style="{ color: textColor }"
              >
                {{ player.playerName }}
              </router-link>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="player.isLeader" class="text-xs px-2 py-0.5 rounded" :style="{ backgroundColor: accentColor + '33', color: accentColor }">
                  Leader
                </span>
                <span class="text-xs" :style="{ color: textMutedColor }">
                  Joined {{ formatDate(player.joinedAt) }}
                </span>
              </div>
            </div>
          </div>
          <button
            v-if="canPerformLeaderActions && !player.isLeader"
            class="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
            title="Remove player"
            :disabled="isRemovingPlayer === player.playerName"
            @click="handleRemovePlayer(player.playerName)"
          >
            <svg v-if="isRemovingPlayer === player.playerName" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="text-center py-8" :style="{ color: textMutedColor }">
        No players in the team yet
      </div>
    </div>

    <!-- Leave Team (Non-Leaders who are actually on this team) -->
    <div v-if="!isLeader && !isAdmin && props.membershipStatus !== undefined" class="px-6 py-4 border-t-2" :style="{ borderColor: accentColor + '44' }">
      <!-- Warning Message (shown when confirming) -->
      <div v-if="leaveState === 'confirming'" class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in">
        <div class="flex items-start gap-3">
          <div class="text-red-400 text-xl">⚠️</div>
          <div class="flex-1">
            <p class="text-sm text-red-200/80 mb-2">Leaving this team will:</p>
            <ul class="text-sm text-red-200/80 space-y-1 ml-4">
              <li>• Remove you from the tournament</li>
              <li>• Free up your spot for another player</li>
            </ul>
            <p class="text-sm text-red-200/80 mt-2">You can rejoin the team or join another team while registration is open.</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="leaveState === 'error'" class="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
        <div class="flex items-center gap-2 text-red-300 text-sm">
          <span>❌</span>
          <span>{{ leaveError }}</span>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          class="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          :class="getLeaveButtonClasses()"
          :disabled="leaveState === 'leaving'"
          @click="handleLeaveTeam"
        >
          {{ getLeaveButtonText() }}
        </button>

        <button
          v-if="leaveState === 'confirming'"
          class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg transition-colors"
          @click="cancelLeave"
        >
          Cancel
        </button>
      </div>

      <div v-if="leaveError && leaveState !== 'error'" class="text-red-400 text-sm mt-2 text-center">{{ leaveError }}</div>
    </div>

    <!-- Delete Team (Leaders or Admins) -->
    <div v-if="canPerformLeaderActions" class="px-6 py-4 border-t-2" :style="{ borderColor: accentColor + '44' }">
      <!-- Warning Message (shown when confirming) -->
      <div v-if="deleteState === 'confirming'" class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in">
        <div class="flex items-start gap-3">
          <div class="text-red-400 text-xl">⚠️</div>
          <div class="flex-1">
            <p class="text-sm text-red-200/80 mb-2">Deleting your team will:</p>
            <ul class="text-sm text-red-200/80 space-y-1 ml-4">
              <li>• Remove all team members from the tournament</li>
            </ul>
            <p class="text-sm text-red-200/80 mt-2">You can re-register your team while registration is open.</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="deleteState === 'error'" class="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
        <div class="flex items-center gap-2 text-red-300 text-sm">
          <span>❌</span>
          <span>{{ deleteError }}</span>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          class="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          :class="getDeleteButtonClasses()"
          :disabled="deleteState === 'deleting'"
          @click="handleDeleteTeam"
        >
          {{ getDeleteButtonText() }}
        </button>

        <button
          v-if="deleteState === 'confirming'"
          class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg transition-colors"
          @click="cancelDelete"
        >
          Cancel
        </button>
      </div>

      <div v-if="deleteError && deleteState !== 'error'" class="text-red-400 text-sm mt-2 text-center">{{ deleteError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import MultiPlayerSelector from '@/components/MultiPlayerSelector.vue';
import { teamRegistrationService, TeamRecruitmentStatus, MembershipStatus, getRecruitmentStatusText, type TeamDetailsResponse, type TeamPlayerInfo } from '@/services/teamRegistrationService';

interface Props {
  tournamentId: number;
  teamId: number;
  isLeader: boolean;
  isAdmin?: boolean; // Tournament admin (can manage any team)
  membershipStatus?: MembershipStatus | null;
  accentColor?: string;
  textColor?: string;
  textMutedColor?: string;
  backgroundColor?: string;
  backgroundMuteColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  accentColor: '#06b6d4',
  textColor: '#FFFFFF',
  textMutedColor: '#9ca3af',
  backgroundColor: '#1a1a1a',
  backgroundMuteColor: '#2d2d2d',
});

// Can perform leader actions (is leader OR is tournament admin)
const canPerformLeaderActions = computed(() => props.isLeader || props.isAdmin);

// Get teamId to pass to service calls (needed for admin managing other teams)
const getTeamIdForService = () => props.isAdmin && !props.isLeader ? props.teamId : undefined;

const emit = defineEmits<{
  teamUpdated: [];
  leftTeam: [];
  deletedTeam: [];
}>();

const teamDetails = ref<TeamDetailsResponse | null>(null);
const isLoading = ref(false);
const loadError = ref('');

const isAddingPlayer = ref(false);
const addPlayerError = ref('');

const isRemovingPlayer = ref<string | null>(null);

const leaveState = ref<'idle' | 'confirming' | 'leaving' | 'error'>('idle');
const leaveError = ref('');

const deleteState = ref<'idle' | 'confirming' | 'deleting' | 'error'>('idle');
const deleteError = ref('');

const isUpdatingStatus = ref(false);
const recruitmentStatusError = ref('');

const isApprovingMember = ref<string | null>(null);

// Computed properties for pending and approved players
const pendingPlayers = computed<TeamPlayerInfo[]>(() => {
  if (!teamDetails.value?.players) return [];
  return teamDetails.value.players.filter(
    p => p.membershipStatus === MembershipStatus.Pending
  );
});

const approvedPlayers = computed<TeamPlayerInfo[]>(() => {
  if (!teamDetails.value?.players) return [];
  return teamDetails.value.players.filter(
    // Treat missing/null membershipStatus as Approved for backward compatibility
    p => p.membershipStatus === MembershipStatus.Approved || p.membershipStatus == null
  );
});

// Recruitment status options
const recruitmentStatusOptions = [
  {
    value: TeamRecruitmentStatus.Open,
    label: 'Open',
    description: 'Accepting new members'
  },
  {
    value: TeamRecruitmentStatus.Closed,
    label: 'Closed',
    description: 'Not recruiting'
  },
  {
    value: TeamRecruitmentStatus.LookingForBTeam,
    label: 'Looking for B Team',
    description: 'Starting a second team'
  }
];

const loadTeamDetails = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    teamDetails.value = await teamRegistrationService.getTeamDetails(props.tournamentId, getTeamIdForService());
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load team details';
  } finally {
    isLoading.value = false;
  }
};

// Recruitment status helpers
const getRecruitmentStatusStyle = (status: TeamRecruitmentStatus) => {
  switch (status) {
    case TeamRecruitmentStatus.Open:
      return {
        backgroundColor: '#10b98133',
        color: '#10b981',
        border: '1px solid #10b98155'
      };
    case TeamRecruitmentStatus.Closed:
      return {
        backgroundColor: '#ef444433',
        color: '#ef4444',
        border: '1px solid #ef444455'
      };
    case TeamRecruitmentStatus.LookingForBTeam:
      return {
        backgroundColor: '#f59e0b33',
        color: '#f59e0b',
        border: '1px solid #f59e0b55'
      };
    default:
      return {
        backgroundColor: props.accentColor + '33',
        color: props.accentColor,
        border: `1px solid ${props.accentColor}55`
      };
  }
};

const getRecruitmentDotColor = (status: TeamRecruitmentStatus) => {
  switch (status) {
    case TeamRecruitmentStatus.Open:
      return '#10b981';
    case TeamRecruitmentStatus.Closed:
      return '#ef4444';
    case TeamRecruitmentStatus.LookingForBTeam:
      return '#f59e0b';
    default:
      return props.accentColor;
  }
};

const getStatusButtonClasses = (status: TeamRecruitmentStatus): string => {
  const isActive = teamDetails.value?.recruitmentStatus === status;
  if (isActive) {
    return 'cursor-default';
  }
  return 'cursor-pointer hover:bg-slate-700/30 border-slate-600/50';
};

const getStatusButtonActiveStyle = (status: TeamRecruitmentStatus) => {
  const color = getRecruitmentDotColor(status);
  return {
    backgroundColor: color + '22',
    borderColor: color
  };
};

const handleUpdateRecruitmentStatus = async (status: TeamRecruitmentStatus) => {
  if (isUpdatingStatus.value || teamDetails.value?.recruitmentStatus === status) return;
  
  isUpdatingStatus.value = true;
  recruitmentStatusError.value = '';
  
  try {
    await teamRegistrationService.updateRecruitmentStatus(props.tournamentId, status, getTeamIdForService());
    await loadTeamDetails();
    emit('teamUpdated');
  } catch (error) {
    recruitmentStatusError.value = error instanceof Error ? error.message : 'Failed to update recruitment status';
  } finally {
    isUpdatingStatus.value = false;
  }
};

const handleAddMultiplePlayers = async (players: string[]) => {
  if (players.length === 0 || isAddingPlayer.value) return;
  isAddingPlayer.value = true;
  addPlayerError.value = '';

  try {
    // Add players one by one (could be optimized to batch API calls if available)
    const addPromises = players.map(playerName =>
      teamRegistrationService.addPlayer(props.tournamentId, { playerName: playerName.trim() }, getTeamIdForService())
    );

    await Promise.all(addPromises);
    await loadTeamDetails();
    emit('teamUpdated');
  } catch (error) {
    addPlayerError.value = error instanceof Error ? error.message : 'Failed to add players';
  } finally {
    isAddingPlayer.value = false;
  }
};

const handleRemovePlayerFromSelector = async (index: number) => {
  if (!teamDetails.value?.players) return;
  const playerName = teamDetails.value.players[index]?.playerName;
  if (playerName) {
    await handleRemovePlayer(playerName);
  }
};

const handleClearAllPlayers = async () => {
  if (!teamDetails.value?.players) return;

  isAddingPlayer.value = true;
  addPlayerError.value = '';

  try {
    // Remove all players
    const removePromises = teamDetails.value.players.map(player =>
      teamRegistrationService.removePlayer(props.tournamentId, player.playerName, getTeamIdForService())
    );

    await Promise.all(removePromises);
    await loadTeamDetails();
    emit('teamUpdated');
  } catch (error) {
    addPlayerError.value = error instanceof Error ? error.message : 'Failed to remove players';
  } finally {
    isAddingPlayer.value = false;
  }
};

const handleRemovePlayer = async (playerName: string) => {
  if (isRemovingPlayer.value) return;
  isRemovingPlayer.value = playerName;

  try {
    await teamRegistrationService.removePlayer(props.tournamentId, playerName, getTeamIdForService());
    await loadTeamDetails();
    emit('teamUpdated');
  } catch (error) {
    // Show error briefly
    loadError.value = error instanceof Error ? error.message : 'Failed to remove player';
    setTimeout(() => { loadError.value = ''; }, 3000);
  } finally {
    isRemovingPlayer.value = null;
  }
};

const handleApproveMember = async (playerName: string) => {
  if (isApprovingMember.value) return;
  isApprovingMember.value = playerName;

  try {
    await teamRegistrationService.approveMember(props.tournamentId, playerName, getTeamIdForService());
    await loadTeamDetails();
    emit('teamUpdated');
  } catch (error) {
    // Show error briefly
    loadError.value = error instanceof Error ? error.message : 'Failed to approve member';
    setTimeout(() => { loadError.value = ''; }, 3000);
  } finally {
    isApprovingMember.value = null;
  }
};

const handleLeaveTeam = async () => {
  if (leaveState.value === 'leaving') return;

  if (leaveState.value === 'idle') {
    // First click - show confirmation
    leaveState.value = 'confirming';
    leaveError.value = '';
    return;
  }

  if (leaveState.value === 'confirming') {
    // Second click - proceed with leaving
    leaveState.value = 'leaving';
    leaveError.value = '';

    try {
      await teamRegistrationService.leaveTeam(props.tournamentId, props.teamId);
      emit('leftTeam');
    } catch (error) {
      leaveError.value = error instanceof Error ? error.message : 'Failed to leave team';
      leaveState.value = 'error';
    }
  } else if (leaveState.value === 'error') {
    // Retry after error
    leaveState.value = 'leaving';
    leaveError.value = '';

    try {
      await teamRegistrationService.leaveTeam(props.tournamentId, props.teamId);
      emit('leftTeam');
    } catch (error) {
      leaveError.value = error instanceof Error ? error.message : 'Failed to leave team';
      leaveState.value = 'error';
    }
  }
};

const cancelLeave = () => {
  leaveState.value = 'idle';
  leaveError.value = '';
};

const getLeaveButtonText = (): string => {
  switch (leaveState.value) {
    case 'idle':
      return 'Leave Team';
    case 'confirming':
      return 'Confirm Leave';
    case 'leaving':
      return 'Leaving...';
    case 'error':
      return 'Try Again';
    default:
      return 'Leave Team';
  }
};

const getLeaveButtonClasses = (): string => {
  switch (leaveState.value) {
    case 'idle':
      return 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30';
    case 'confirming':
      return 'text-white bg-red-600 hover:bg-red-700 border border-red-600 animate-pulse';
    case 'leaving':
      return 'text-red-400 bg-red-500/10 border border-red-500/30 opacity-50 cursor-not-allowed';
    case 'error':
      return 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30';
    default:
      return 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30';
  }
};

const handleDeleteTeam = async () => {
  if (deleteState.value === 'deleting') return;

  if (deleteState.value === 'idle') {
    // First click - show confirmation
    deleteState.value = 'confirming';
    deleteError.value = '';
    return;
  }

  if (deleteState.value === 'confirming') {
    // Second click - proceed with deletion
    deleteState.value = 'deleting';
    deleteError.value = '';

    try {
      await teamRegistrationService.deleteTeam(props.tournamentId, getTeamIdForService());
      emit('deletedTeam');
    } catch (error) {
      deleteError.value = error instanceof Error ? error.message : 'Failed to delete team';
      deleteState.value = 'error';
    }
  } else if (deleteState.value === 'error') {
    // Retry after error
    deleteState.value = 'deleting';
    deleteError.value = '';

    try {
      await teamRegistrationService.deleteTeam(props.tournamentId, getTeamIdForService());
      emit('deletedTeam');
    } catch (error) {
      deleteError.value = error instanceof Error ? error.message : 'Failed to delete team';
      deleteState.value = 'error';
    }
  }
};

const cancelDelete = () => {
  deleteState.value = 'idle';
  deleteError.value = '';
};

const getDeleteButtonText = (): string => {
  switch (deleteState.value) {
    case 'idle':
      return 'Delete Team';
    case 'confirming':
      return 'Confirm Delete';
    case 'deleting':
      return 'Deleting...';
    case 'error':
      return 'Try Again';
    default:
      return 'Delete Team';
  }
};

const getDeleteButtonClasses = (): string => {
  switch (deleteState.value) {
    case 'idle':
      return 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30';
    case 'confirming':
      return 'text-white bg-red-600 hover:bg-red-700 border border-red-600 animate-pulse';
    case 'deleting':
      return 'text-red-400 bg-red-500/10 border border-red-500/30 opacity-50 cursor-not-allowed';
    case 'error':
      return 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30';
    default:
      return 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

onMounted(() => {
  loadTeamDetails();
});

watch(
  () => props.teamId,
  () => {
    // Reset leave state when switching teams
    leaveState.value = 'idle';
    leaveError.value = '';
    loadTeamDetails();
  }
);
</script>

<style scoped src="./TeamManagementPanel.vue.css"></style>
