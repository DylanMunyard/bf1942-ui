
export interface GoogleUser {
  id: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  token: string | null;
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
      // Decode the JWT token to get user info
      const token = response.credential;
      const payload = this.parseJwt(token);
      
      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email,
      };

      const authState: AuthState = {
        isAuthenticated: true,
        user,
        token: token,
      };

      // Store in localStorage
      localStorage.setItem('authState', JSON.stringify(authState));
      
      // Trigger a custom event to notify components
      window.dispatchEvent(new CustomEvent('google-auth-success', { detail: authState }));
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
    try {
      const stored = localStorage.getItem('authState');
      if (stored) {
        const authState = JSON.parse(stored);
        // Validate JWT token expiry
        if (authState.token && this.isTokenValid(authState.token)) {
          return authState;
        } else {
          // Token expired, clear storage
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }

    return {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('authState');
    window.google?.accounts?.id?.disableAutoSelect?.();
  }

  async validateToken(token: string): Promise<boolean> {
    return this.isTokenValid(token);
  }
}

export const authService = new AuthService();