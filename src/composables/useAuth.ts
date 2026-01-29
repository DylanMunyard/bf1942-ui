import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService, type AuthState } from '@/services/authService';
import { ROLE_ADMIN, ROLE_SUPPORT, ADMIN_EMAIL } from '@/constants/roles';
import { appInsightsService } from '@/services/appInsightsService';

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
  const roles = computed(() => user.value?.roles ?? []);
  const isAdmin = computed(
    () => roles.value.includes(ROLE_ADMIN) || (user.value?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );
  const isSupport = computed(() => roles.value.includes(ROLE_SUPPORT) || isAdmin.value);

  const handleAuthSuccess = (event: CustomEvent) => {
    authState.value = event.detail;
    // Set Application Insights user context
    if (event.detail.user) {
      appInsightsService.setAuthenticatedUser(
        event.detail.user.id.toString(),
        event.detail.user.email
      );
      // Track login event
      appInsightsService.trackEvent('UserLogin', {
        userId: event.detail.user.id.toString(),
        userEmail: event.detail.user.email,
        userName: event.detail.user.name
      });
    }
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
    const userId = authState.value.user?.id?.toString();
    
    // Track logout event before clearing user context
    if (userId) {
      appInsightsService.trackEvent('UserLogout', {
        userId: userId
      });
    }
    
    // Clear Application Insights user context
    appInsightsService.clearAuthenticatedUser();
    
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
          appInsightsService.clearAuthenticatedUser();
          authState.value = {
            isAuthenticated: false,
            token: null,
            user: null,
          };
          return;
        }
        // Reload auth state after potential refresh
        authState.value = authService.getStoredAuthState();
        // Set Application Insights user context if user is authenticated
        if (authState.value.user) {
          appInsightsService.setAuthenticatedUser(
            authState.value.user.id.toString(),
            authState.value.user.email
          );
        }
        // Setup auto-refresh for future expirations
        authService.setupAutoRefresh();
      } catch (error) {
        // Clear auth state on error
        appInsightsService.clearAuthenticatedUser();
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
  
  const handleTokenRefreshed = () => {
    authState.value = authService.getStoredAuthState();
  };

  // Initialize auth state on first use
  onMounted(() => {
    window.addEventListener('discord-auth-success', handleAuthSuccess as EventListener);
    window.addEventListener('discord-auth-error', handleAuthError as EventListener);
    window.addEventListener('auth-token-refreshed', handleTokenRefreshed);
  });

  onUnmounted(() => {
    window.removeEventListener('discord-auth-success', handleAuthSuccess as EventListener);
    window.removeEventListener('discord-auth-error', handleAuthError as EventListener);
    window.removeEventListener('auth-token-refreshed', handleTokenRefreshed);
  });

  const ensureValidToken = async (): Promise<boolean> => {
    return await authService.ensureValidToken();
  };

  return {
    isAuthenticated,
    token,
    user,
    roles,
    isAdmin,
    isSupport,
    loginWithDiscord,
    logout,
    loadStoredAuth,
    ensureValidToken,
  };
}