import { ref, watch, onMounted, onUnmounted } from 'vue';
import { signalrService } from '@/services/signalrService';
import { useAuth } from '@/composables/useAuth';

const isConnected = ref(false);
const connectionId = ref<string | null>(null);

export function useSignalR() {
  const { isAuthenticated, user } = useAuth();

  const connect = async () => {
    if (!isAuthenticated.value || !user.value) {
      console.log('SignalR: Not connecting - user not authenticated');
      return;
    }

    try {
      console.log('SignalR: Connecting for authenticated user:', user.value.email);
      await signalrService.connect(user.value);
      isConnected.value = signalrService.isConnected();
      connectionId.value = signalrService.getConnectionId();
      console.log('SignalR: Connected successfully');
    } catch (error) {
      console.error('SignalR: Connection failed:', error);
      isConnected.value = false;
      connectionId.value = null;
    }
  };

  const disconnect = async () => {
    try {
      console.log('SignalR: Disconnecting...');
      await signalrService.disconnect();
      isConnected.value = false;
      connectionId.value = null;
      console.log('SignalR: Disconnected successfully');
    } catch (error) {
      console.error('SignalR: Disconnect failed:', error);
    }
  };

  // Watch authentication state and connect/disconnect accordingly
  watch(
    [isAuthenticated, user],
    ([authenticated, currentUser]) => {
      console.log('SignalR: Auth state changed:', { authenticated, user: currentUser?.email });
      
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
      console.log('SignalR: Handling logout event');
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