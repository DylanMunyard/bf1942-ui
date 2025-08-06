import { ref, computed, onMounted, onUnmounted } from 'vue';
import { authService, type AuthState } from '@/services/authService';

const authState = ref<AuthState>({
  isAuthenticated: false,
  user: null,
  token: null,
});

export function useAuth() {
  const isAuthenticated = computed(() => authState.value.isAuthenticated);
  const user = computed(() => authState.value.user);
  const token = computed(() => authState.value.token);

  const handleAuthSuccess = (event: CustomEvent) => {
    authState.value = event.detail;
  };

  const handleAuthError = (event: CustomEvent) => {
    console.error('Google auth error:', event.detail);
    authState.value = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  };

  const login = async (): Promise<void> => {
    await authService.initiateGoogleLogin();
  };

  const logout = (): void => {
    authService.logout();
    authState.value = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  };

  const loadStoredAuth = async (): Promise<void> => {
    const stored = authService.getStoredAuthState();
    
    if (stored.isAuthenticated && stored.token) {
      // Validate token before using stored auth
      const isValid = await authService.validateToken(stored.token);
      if (isValid) {
        authState.value = stored;
      } else {
        // Token is invalid, clear storage
        authService.logout();
        authState.value = {
          isAuthenticated: false,
          user: null,
          token: null,
        };
      }
    }
  };

  // Initialize auth state on first use
  onMounted(() => {
    loadStoredAuth();
    
    // Listen for Google auth events
    window.addEventListener('google-auth-success', handleAuthSuccess as EventListener);
    window.addEventListener('google-auth-error', handleAuthError as EventListener);
  });

  onUnmounted(() => {
    window.removeEventListener('google-auth-success', handleAuthSuccess as EventListener);
    window.removeEventListener('google-auth-error', handleAuthError as EventListener);
  });

  return {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    loadStoredAuth,
  };
}