import { ref, watch, onMounted, onUnmounted } from 'vue';
import { signalrService } from '@/services/signalrService';
import { useAuth } from '@/composables/useAuth';

const isConnected = ref(false);
const connectionId = ref<string | null>(null);

export function useSignalR() {
  const { isAuthenticated, user } = useAuth();

  const connect = async () => {
    if (!isAuthenticated.value || !user.value) {
      return;
    }

    try {
      await signalrService.connect(user.value);
      isConnected.value = signalrService.isConnected();
      connectionId.value = signalrService.getConnectionId();
    } catch (error) {
      isConnected.value = false;
      connectionId.value = null;
    }
  };

  const disconnect = async () => {
    try {
      await signalrService.disconnect();
      isConnected.value = false;
      connectionId.value = null;
    } catch (error) {
      // Disconnect failed
    }
  };

  // Watch authentication state and connect/disconnect accordingly
  watch(
    [isAuthenticated, user],
    ([authenticated, currentUser]) => {
      if (authenticated && currentUser) {
        // User is authenticated, connect to SignalR
        connect();
      } else {
        // User is not authenticated, disconnect from SignalR
        disconnect();
      }
    },
    { immediate: true }
  );

  // Handle logout events
  onMounted(() => {
    const handleLogout = () => {
      disconnect();
    };

    window.addEventListener('auth-logout', handleLogout);
    
    // Clean up on unmount
    onUnmounted(() => {
      window.removeEventListener('auth-logout', handleLogout);
      disconnect();
    });
  });

  return {
    isConnected,
    connectionId,
    connect,
    disconnect,
    sendMessage: signalrService.sendMessage.bind(signalrService),
  };
}