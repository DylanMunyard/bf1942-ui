export interface UserProfile {
  id: number;
  name: string;
  email: string;
  /** Roles from JWT (e.g. User, Support, Admin). Derived from token when loading state. */
  roles?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
}

class AuthService {
  private discordClientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '';
  private discordRedirectUri = `${window.location.origin}/auth/discord/callback`;

  private parseJwt(token: string): Record<string, unknown> {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  }

  /** Get role claim(s) from JWT. Handles both "role" and full claim type; value can be string or string[]. */
  getRolesFromToken(token: string): string[] {
    try {
      const p = this.parseJwt(token);
      const raw = p['role'] ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (raw == null) return [];
      return Array.isArray(raw) ? (raw as string[]) : [raw as string];
    } catch {
      return [];
    }
  }

  // Discord OAuth Methods
  async initiateDiscordLogin(): Promise<void> {
    if (!this.discordClientId) {
      throw new Error('Discord Client ID not configured. Please set VITE_DISCORD_CLIENT_ID environment variable.');
    }

    // Save the current path to redirect back after auth
    const currentPath = window.location.pathname;
    localStorage.setItem('discord_auth_return_path', currentPath);

    // Build Discord OAuth URL
    const params = new URLSearchParams({
      client_id: this.discordClientId,
      redirect_uri: this.discordRedirectUri,
      response_type: 'code',
      scope: 'identify email',
    });

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

    // Redirect to Discord OAuth
    window.location.href = discordAuthUrl;
  }

  async handleDiscordCallback(code: string): Promise<void> {
    try {
      // Send the authorization code to our backend
      // The backend will exchange it for an access token using the client secret (server-side)
      // This is more secure than doing it client-side
      const loginResponse = await fetch('/stats/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          discordCode: code,
          redirectUri: this.discordRedirectUri
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();

        const userProfile: UserProfile = {
          id: loginData.user.id,
          name: loginData.user.name,
          email: loginData.user.email,
          roles: this.getRolesFromToken(loginData.accessToken),
        };

        const authState: AuthState = {
          isAuthenticated: true,
          token: loginData.accessToken,
          user: userProfile,
        };

        // Store the backend JWT, user profile, and expiration in localStorage
        localStorage.setItem('authToken', loginData.accessToken);
        localStorage.setItem('userProfile', JSON.stringify({ id: userProfile.id, name: userProfile.name, email: userProfile.email }));
        if (loginData.expiresAt) {
          localStorage.setItem('tokenExpiresAt', loginData.expiresAt);
        }

        // Trigger success event
        window.dispatchEvent(new CustomEvent('discord-auth-success', { detail: authState }));
      } else {
        const errorData = await loginResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Backend authentication failed');
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('discord-auth-error', { detail: error }));
      throw error;
    }
  }

  getStoredAuthState(): AuthState {
    const token = localStorage.getItem('authToken');
    const userProfileJson = localStorage.getItem('userProfile');
    let user: UserProfile | null = null;

    if (userProfileJson) {
      try {
        user = JSON.parse(userProfileJson) as UserProfile;
      } catch {
        // Failed to parse stored user profile
      }
    }
    const roles = token ? this.getRolesFromToken(token) : [];
    if (user) user = { ...user, roles };

    return {
      isAuthenticated: !!token,
      token,
      user,
    };
  }



  async logout(): Promise<void> {
    // Inform backend to revoke refresh token and clear cookie
    try {
      await fetch('/stats/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
    } catch (e) {
      // Logout request failed, continuing to clear client state
    }
    // Clear stored token and user profile
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('tokenExpiresAt');

    // Trigger logout event
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  getTokenExpirationTime(token: string): number | null {
    try {
      const payload = this.parseJwt(token);
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/stats/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Uses httpOnly refresh token cookie (60-day expiry)
        credentials: 'same-origin',
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const accessToken: string = data.accessToken;
      const expiresAt: string | undefined = data.expiresAt;

      if (!accessToken) {
        return false;
      }

      // Update stored token and expiration
      localStorage.setItem('authToken', accessToken);
      if (expiresAt) {
        localStorage.setItem('tokenExpiresAt', expiresAt);
      }

      window.dispatchEvent(new CustomEvent('auth-token-refreshed'));
      return true;
    } catch (error) {
      return false;
    }
  }

  async ensureValidToken(): Promise<boolean> {
    let token = localStorage.getItem('authToken');
    if (!token) {
      // Try to obtain a new access token using refresh cookie
      const refreshed = await this.refreshToken();
      if (!refreshed) return false;
      token = localStorage.getItem('authToken');
      if (!token) return false;
    }

    const storedExpiresAt = localStorage.getItem('tokenExpiresAt');
    let isExpired = false;
    if (storedExpiresAt) {
      const expiryMs = Date.parse(storedExpiresAt);
      isExpired = isNaN(expiryMs) ? this.isTokenExpired(token) : Date.now() >= expiryMs;
    } else {
      isExpired = this.isTokenExpired(token);
    }

    if (isExpired) {
      try {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          await this.logout();
          return false;
        }
      } catch (error) {
        await this.logout();
        return false;
      }
    }

    return true;
  }

  setupAutoRefresh(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Prefer server-provided expiresAt; fallback to JWT exp
    const expiresAtStr = localStorage.getItem('tokenExpiresAt');
    const expirationTime = expiresAtStr ? Date.parse(expiresAtStr) : this.getTokenExpirationTime(token);
    if (!expirationTime) return;

    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    // For long-lived tokens (> 1 day), refresh 1 hour before expiration
    // For shorter tokens, refresh 5 minutes before expiration
    const isLongLived = timeUntilExpiration > (24 * 60 * 60 * 1000); // > 1 day
    const refreshBuffer = isLongLived ? (60 * 60 * 1000) : (5 * 60 * 1000); // 1 hour or 5 minutes
    const refreshTime = Math.max(0, timeUntilExpiration - refreshBuffer);

    setTimeout(async () => {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Set up next auto-refresh with the new token
        this.setupAutoRefresh();
      } else {
        // Set a timer to logout 1 minute later if no manual intervention
        setTimeout(async () => {
          const currentToken = localStorage.getItem('authToken');
          if (currentToken && this.isTokenExpired(currentToken)) {
            await this.logout();
            window.dispatchEvent(new CustomEvent('auth-expired', {
              detail: { message: 'Your session has expired. Please sign in again.' }
            }));
          }
        }, 60 * 1000); // Wait 1 minute then logout if token still expired
      }
    }, refreshTime);
  }

}

export const authService = new AuthService();
