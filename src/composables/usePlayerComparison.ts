import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface SelectedPlayer {
  name: string;
  source?: string; // Where the player was selected from (e.g., 'server-table', 'round-report')
  timestamp: number;
}

const selectedPlayers = ref<SelectedPlayer[]>([]);
const isVisible = ref(false);

export function usePlayerComparison() {
  const router = useRouter();

  const canAddPlayer = computed(() => selectedPlayers.value.length < 2);
  const canCompare = computed(() => selectedPlayers.value.length === 2);
  const hasSelections = computed(() => selectedPlayers.value.length > 0);

  const addPlayer = (playerName: string, source?: string) => {
    if (!playerName || !canAddPlayer.value) return;
    
    // Check if player is already selected
    if (selectedPlayers.value.some(p => p.name === playerName)) return;
    
    selectedPlayers.value.push({
      name: playerName,
      source,
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
    router.push({
      path: '/players/compare',
      query: {
        player1: player1.name,
        player2: player2.name
      }
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