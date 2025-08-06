import { ref, computed, onMounted, onUnmounted } from 'vue';
import { authService, type AuthState } from '@/services/authService';

const authState = ref<AuthState>({
  isAuthenticated: false,
  token: null,
  user: null,
});

export function useAuth() {
  const isAuthenticated = computed(() => authState.value.isAuthenticated);
  const token = computed(() => authState.value.token);
  const user = computed(() => authState.value.user);

  const handleAuthSuccess = (event: CustomEvent) => {
    authState.value = event.detail;
  };

  const handleAuthError = (event: CustomEvent) => {
    console.error('Google auth error:', event.detail);
    authState.value = {
      isAuthenticated: false,
      token: null,
      user: null,
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
      user: null,
    };
  };

  const loadStoredAuth = (): void => {
    const stored = authService.getStoredAuthState();
    console.log('useAuth - loadStoredAuth:', stored);
    authState.value = stored;
  };

  // Initialize auth state immediately
  loadStoredAuth();
  
  // Initialize auth state on first use
  onMounted(() => {
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
    user,
    login,
    logout,
    loadStoredAuth,
  };
}