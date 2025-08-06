import { ref, computed, onMounted, onUnmounted } from 'vue';
import { authService, type AuthState } from '@/services/authService';

const authState = ref<AuthState>({
  isAuthenticated: false,
  token: null,
});

export function useAuth() {
  const isAuthenticated = computed(() => authState.value.isAuthenticated);
  const token = computed(() => authState.value.token);

  const handleAuthSuccess = (event: CustomEvent) => {
    authState.value = event.detail;
  };

  const handleAuthError = (event: CustomEvent) => {
    console.error('Google auth error:', event.detail);
    authState.value = {
      isAuthenticated: false,
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
      token: null,
    };
  };

  const loadStoredAuth = (): void => {
    const stored = authService.getStoredAuthState();
    authState.value = stored;
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
    token,
    login,
    logout,
    loadStoredAuth,
  };
}