import * as signalR from '@microsoft/signalr';
import type { UserProfile } from './authService';
import { authService } from './authService';
import { notificationService, type BuddyOnlineNotification } from './notificationService';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private userEmail: string | null = null;

  async connect(user: UserProfile): Promise<void> {
    // If we already have a connection in any state other than Disconnected, don't create a new one
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      console.log('SignalR connection already exists in state:', this.connection.state);
      return;
    }

    console.log('SignalR: Starting connection process...');

    this.userEmail = user.email;

    // Get the stored auth token for the Authorization header
    const authState = authService.getStoredAuthState();
    const token = authState.token;

    if (!token) {
      throw new Error('No authentication token available for SignalR connection');
    }

    // Build connection using the proxied endpoint with bearer token
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hub', {
        withCredentials: false, // Don't send cookies
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => token, // Add bearer token to requests
      })
      .withAutomaticReconnect()
      .build();

    // Set up event listeners for connection state changes
    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected with connection ID:', connectionId);
      this.registerUser();
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed', error);
    });

    // Set up message handlers
    this.setupEventHandlers();

    try {
      await this.connection.start();
      console.log('SignalR connected successfully');
      console.log('Connection ID:', this.connection.connectionId);
      console.log('User email:', this.userEmail);
      
      // Register the user with their email after connection is established
      await this.registerUser();
    } catch (error) {
      console.error('Error connecting to SignalR hub:', error);
      throw error;
    }
  }

  private async registerUser(): Promise<void> {
    if (!this.connection || !this.userEmail) {
      console.error('Cannot register user: connection or email not available');
      return;
    }

    try {
      // Send the user's email to the hub to associate it with the connection
      await this.connection.invoke('RegisterUser', this.userEmail);
      console.log('User registered with SignalR hub:', this.userEmail);
    } catch (error) {
      console.error('Error registering user with SignalR hub:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    console.log('SignalR: Setting up event handlers...');

    // Buddy-related handler
    this.connection.on('BuddyOnline', (data: BuddyOnlineNotification) => {
      console.log('SignalR - BuddyOnline:', data);
      
      // Handle the buddy online notification
      notificationService.handleBuddyOnline(data);
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR disconnected');
      } catch (error) {
        console.error('Error disconnecting from SignalR hub:', error);
      }
      this.connection = null;
      this.userEmail = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }

  // Method to send messages to the hub if needed
  async sendMessage(method: string, ...args: any[]): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR not connected. Cannot send message.');
      return;
    }

    try {
      await this.connection.invoke(method, ...args);
      console.log(`SignalR message sent: ${method}`, args);
    } catch (error) {
      console.error(`Error sending SignalR message ${method}:`, error);
    }
  }
}

export const signalrService = new SignalRService();