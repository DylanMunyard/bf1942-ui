import * as signalR from '@microsoft/signalr';
import type { UserProfile } from './authService';
import { authService } from './authService';
import { notificationService, type BuddyOnlineNotification, type ServerMapChangeNotification } from './notificationService';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private userEmail: string | null = null;

  async connect(user: UserProfile): Promise<void> {
    // If we already have a connection in any state other than Disconnected, don't create a new one
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

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
      // SignalR reconnecting
    });

    this.connection.onreconnected((connectionId) => {
      this.registerUser();
    });

    this.connection.onclose((error) => {
      // SignalR connection closed
    });

    // Set up message handlers
    this.setupEventHandlers();

    try {
      await this.connection.start();

      // Register the user with their email after connection is established
      await this.registerUser();
    } catch (error) {
      throw error;
    }
  }

  private async registerUser(): Promise<void> {
    if (!this.connection || !this.userEmail) {
      return;
    }

    try {
      // Send the user's email to the hub to associate it with the connection
      await this.connection.invoke('RegisterUser', this.userEmail);
    } catch (error) {
      // Error registering user with SignalR hub
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Buddy-related handler
    this.connection.on('BuddyOnline', (data: BuddyOnlineNotification) => {
      // Handle the buddy online notification
      notificationService.handleBuddyOnline(data);
    });

    // Server map change handler
    this.connection.on('ServerMapChange', (data: ServerMapChangeNotification) => {
      // Handle the server map change notification
      notificationService.handleServerMapChange(data);
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (error) {
        // Error disconnecting from SignalR hub
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
      return;
    }

    try {
      await this.connection.invoke(method, ...args);
    } catch (error) {
      // Error sending SignalR message
    }
  }
}

export const signalrService = new SignalRService();