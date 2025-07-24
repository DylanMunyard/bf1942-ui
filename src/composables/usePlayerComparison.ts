import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface SelectedPlayer {
  name: string;
  source?: string; // Where the player was selected from (e.g., 'server-table', 'round-report')
  serverGuid?: string; // The actual server GUID for the comparison
  timestamp: number;
}

const selectedPlayers = ref<SelectedPlayer[]>([]);
const isVisible = ref(false);

export function usePlayerComparison() {
  const router = useRouter();

  const canAddPlayer = computed(() => selectedPlayers.value.length < 2);
  const canCompare = computed(() => selectedPlayers.value.length >= 1);
  const hasSelections = computed(() => selectedPlayers.value.length > 0);

  const addPlayer = (playerName: string, source?: string, serverGuid?: string) => {
    if (!playerName || !canAddPlayer.value) return;
    
    // Check if player is already selected
    if (selectedPlayers.value.some(p => p.name === playerName)) return;
    
    selectedPlayers.value.push({
      name: playerName,
      source,
      serverGuid,
      timestamp: Date.now()
    });
    
    // Show the widget when a player is added
    isVisible.value = true;
  };

  const removePlayer = (playerName: string) => {
    const index = selectedPlayers.value.findIndex(p => p.name === playerName);
    if (index > -1) {
      selectedPlayers.value.splice(index, 1);
    }
    
    // Hide widget if no players selected
    if (selectedPlayers.value.length === 0) {
      isVisible.value = false;
    }
  };

  const clearAll = () => {
    selectedPlayers.value = [];
    isVisible.value = false;
  };

  const compareSelected = () => {
    if (!canCompare.value) return;
    
    const [player1, player2] = selectedPlayers.value;
    const query: Record<string, string> = {
      player1: player1.name
    };
    
    // Add player2 if available
    if (player2) {
      query.player2 = player2.name;
    }
    
    // Add serverGuid if available from either player
    const serverGuid = player1.serverGuid || (player2 && player2.serverGuid);
    if (serverGuid) {
      query.serverGuid = serverGuid;
    }
    
    router.push({
      path: '/players/compare',
      query
    });
    
    // Clear selections after navigating
    clearAll();
  };

  const toggleWidget = () => {
    isVisible.value = !isVisible.value;
  };

  const showWidget = () => {
    isVisible.value = true;
  };

  const hideWidget = () => {
    isVisible.value = false;
  };

  return {
    selectedPlayers: computed(() => selectedPlayers.value),
    isVisible: computed(() => isVisible.value),
    canAddPlayer,
    canCompare,
    hasSelections,
    addPlayer,
    removePlayer,
    clearAll,
    compareSelected,
    toggleWidget,
    showWidget,
    hideWidget
  };
}