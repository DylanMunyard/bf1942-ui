
export interface UserProfile {
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
}

// Declare Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: Element, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

class AuthService {
  private clientId = '468014767883-2gsdumjjgpgm2fp1qgic82i45k03tj7e.apps.googleusercontent.com';
  private isInitialized = false;

  async initializeGoogleAuth(): Promise<void> {
    if (this.isInitialized) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);

    return new Promise((resolve) => {
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          use_fedcm_for_prompt: false,
        });
        this.isInitialized = true;
        resolve();
      };
    });
  }

  private async handleCredentialResponse(response: any): Promise<void> {
    try {
      // Get the Google ID token
      const idToken = response.credential;
      const payload = this.parseJwt(idToken);

      // Authenticate with backend using Google ID token
      try {
        const loginResponse = await fetch('/stats/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          credentials: 'include',
          body: JSON.stringify({ email: payload.email })
        });

        if (loginResponse.ok) {
          // Extract user profile from Google JWT payload
          console.log('JWT payload:', payload);
          const userProfile: UserProfile = {
            name: payload.name || payload.email,
            email: payload.email,
          };
          console.log('Extracted user profile:', userProfile);

          const authState: AuthState = {
            isAuthenticated: true,
            token: idToken, // Use the Google ID token directly
            user: userProfile,
          };

          // Store the Google ID token and user profile in sessionStorage
          sessionStorage.setItem('authToken', idToken);
          sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
          console.log('Stored user profile in sessionStorage:', JSON.stringify(userProfile));
          
          // Trigger success event
          window.dispatchEvent(new CustomEvent('google-auth-success', { detail: authState }));
        } else {
          throw new Error('Backend authentication failed');
        }
      } catch (error) {
        console.error('Failed to authenticate with stats service:', error);
        throw error;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      window.dispatchEvent(new CustomEvent('google-auth-error', { detail: error }));
    }
  }

  private parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  async initiateGoogleLogin(): Promise<void> {
    try {
      console.log('Initializing Google auth...');
      console.log('Current origin:', window.location.origin);
      console.log('Client ID:', this.clientId);
      await this.initializeGoogleAuth();
      console.log('Creating popup auth...');
      
      // Create a hidden button and click it to trigger OAuth popup
      const tempButton = document.createElement('div');
      tempButton.id = 'temp-google-signin-' + Date.now();
      tempButton.style.display = 'none';
      document.body.appendChild(tempButton);
      
      window.google.accounts.id.renderButton(tempButton, {
        theme: 'outline',
        size: 'large',
        type: 'standard'
      });
      
      // Trigger the button click
      setTimeout(() => {
        const button = tempButton.querySelector('div[role="button"]') as HTMLElement;
        if (button) {
          console.log('Clicking Google sign-in button...');
          button.click();
        } else {
          console.error('Google sign-in button not found');
          // Fallback to prompt
          window.google.accounts.id.prompt();
        }
        // Clean up the temporary button
        document.body.removeChild(tempButton);
      }, 100);
    } catch (error) {
      console.error('Login initialization error:', error);
      throw error;
    }
  }

  async signInWithPopup(): Promise<void> {
    await this.initializeGoogleAuth();
    window.google.accounts.id.prompt();
  }

  getStoredAuthState(): AuthState {
    const token = sessionStorage.getItem('authToken');
    const userProfileJson = sessionStorage.getItem('userProfile');
    let user: UserProfile | null = null;

    if (userProfileJson) {
      try {
        user = JSON.parse(userProfileJson);
      } catch (error) {
        console.error('Failed to parse stored user profile:', error);
      }
    }

    return {
      isAuthenticated: !!token,
      token,
      user,
    };
  }



  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await fetch('/stats/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with local cleanup even if backend fails
    }
    
    // Clear stored token and user profile
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userProfile');
    
    // Disable Google auto-select
    window.google?.accounts?.id?.disableAutoSelect?.();
    
    // Trigger logout event
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token for expiration check:', error);
      return true;
    }
  }

  getTokenExpirationTime(token: string): number | null {
    try {
      const payload = this.parseJwt(token);
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error parsing token for expiration time:', error);
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      console.log('Attempting silent token refresh...');
      
      // Check if Google Identity Services is available
      if (!window.google?.accounts?.id) {
        console.log('Google Identity Services not available for refresh');
        return false;
      }
      
      // Use Google Identity Services silent refresh
      return new Promise((resolve) => {
        // Set up a temporary callback for the refresh
        const originalCallback = window.google.accounts.id.initialize;
        
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            if (response.credential) {
              // Successfully got new token
              this.handleCredentialResponse(response).then(() => {
                console.log('Silent token refresh successful');
                resolve(true);
              }).catch(() => {
                console.log('Silent token refresh failed during handling');
                resolve(false);
              });
            } else {
              console.log('Silent token refresh failed - no credential returned');
              resolve(false);
            }
          },
          auto_select: true, // Enable silent refresh
          use_fedcm_for_prompt: false,
        });
        
        // Trigger silent prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Silent refresh not available, user needs to login again');
            resolve(false);
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          console.log('Silent token refresh timeout');
          resolve(false);
        }, 5000);
      });
    } catch (error) {
      console.error('Silent token refresh error:', error);
      return false;
    }
  }

  async ensureValidToken(): Promise<boolean> {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      console.log('Token expired, attempting refresh...');
      try {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          console.log('Token refresh failed, logging out...');
          await this.logout();
          return false;
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        await this.logout();
        return false;
      }
    }

    return true;
  }

  setupAutoRefresh(): void {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) return;

    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    // Try to refresh token 5 minutes before expiration
    const refreshTime = Math.max(0, timeUntilExpiration - (5 * 60 * 1000));

    console.log(`Setting up auto-refresh in ${refreshTime / 1000} seconds`);
    
    setTimeout(async () => {
      console.log('Auto-refreshing token...');
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Set up next auto-refresh with the new token
        this.setupAutoRefresh();
      } else {
        console.log('Auto-refresh failed, user will need to login again');
        // Set a timer to logout 1 minute later if no manual intervention
        setTimeout(async () => {
          const currentToken = sessionStorage.getItem('authToken');
          if (currentToken && this.isTokenExpired(currentToken)) {
            console.log('Token still expired after failed refresh, logging out...');
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