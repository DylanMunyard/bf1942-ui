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
    console.log('useAuth - loadStoredAuth:', stored);
    
    if (stored.isAuthenticated && stored.token) {
      // Check if token is expired and try to refresh if needed
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
    } else {
      authState.value = stored;
    }
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

  const ensureValidToken = async (): Promise<boolean> => {
    return await authService.ensureValidToken();
  };

  return {
    isAuthenticated,
    token,
    user,
    login,
    logout,
    loadStoredAuth,
    ensureValidToken,
  };
}