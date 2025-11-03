import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService, type AuthState } from '@/services/authService';

const authState = ref<AuthState>({
  isAuthenticated: false,
  token: null,
  user: null,
});

export function useAuth() {
  const router = useRouter();
  const isAuthenticated = computed(() => authState.value.isAuthenticated);
  const token = computed(() => authState.value.token);
  const user = computed(() => authState.value.user);

  const handleAuthSuccess = (event: CustomEvent) => {
    authState.value = event.detail;
    // Setup auto-refresh when authentication succeeds
    authService.setupAutoRefresh();
    // Redirect to dashboard after successful sign-in
    router.push('/dashboard');
  };

  const handleAuthError = (event: CustomEvent) => {
    authState.value = {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  };

  const loginWithDiscord = async (): Promise<void> => {
    await authService.initiateDiscordLogin();
  };

  const logout = (): void => {
    const currentRoute = router.currentRoute.value.path;
    authService.logout();
    authState.value = {
      isAuthenticated: false,
      token: null,
      user: null,
    };
    // Redirect to home if currently on dashboard
    if (currentRoute === '/dashboard') {
      router.push('/');
    }
  };

  const loadStoredAuth = async (): Promise<void> => {
    const stored = authService.getStoredAuthState();

    if (stored.isAuthenticated && stored.token) {
      // Check if token is expired and try to refresh if needed
      try {
        const isValid = await authService.ensureValidToken();
        if (!isValid) {
          // Token refresh failed, clear auth state
          authState.value = {
            isAuthenticated: false,
            token: null,
            user: null,
          };
          return;
        }
        // Reload auth state after potential refresh
        authState.value = authService.getStoredAuthState();
        // Setup auto-refresh for future expirations
        authService.setupAutoRefresh();
      } catch (error) {
        // Clear auth state on error
        authState.value = {
          isAuthenticated: false,
          token: null,
          user: null,
        };
      }
    } else {
      authState.value = stored;
    }
  };

  // Initialize auth state immediately
  loadStoredAuth();
  
  // Initialize auth state on first use
  onMounted(() => {
    // Listen for Discord auth events
    window.addEventListener('discord-auth-success', handleAuthSuccess as EventListener);
    window.addEventListener('discord-auth-error', handleAuthError as EventListener);
  });

  onUnmounted(() => {
    window.removeEventListener('discord-auth-success', handleAuthSuccess as EventListener);
    window.removeEventListener('discord-auth-error', handleAuthError as EventListener);
  });

  const ensureValidToken = async (): Promise<boolean> => {
    return await authService.ensureValidToken();
  };

  return {
    isAuthenticated,
    token,
    user,
    loginWithDiscord,
    logout,
    loadStoredAuth,
    ensureValidToken,
  };
}