
export interface AuthState {
  isAuthenticated: boolean;
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
          const authState: AuthState = {
            isAuthenticated: true,
            token: idToken, // Use the Google ID token directly
          };

          // Store the Google ID token in sessionStorage
          sessionStorage.setItem('authToken', idToken);
          
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
    return {
      isAuthenticated: !!token,
      token,
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
    
    // Clear stored token
    sessionStorage.removeItem('authToken');
    
    // Disable Google auto-select
    window.google?.accounts?.id?.disableAutoSelect?.();
    
    // Trigger logout event
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/stats/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      return response.ok;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

}

export const authService = new AuthService();