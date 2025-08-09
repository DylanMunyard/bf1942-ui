import { ref } from 'vue';

export interface BuddyOnlineNotification {
  type: 'buddy_online';
  buddyName: string;
  serverName: string;
  mapName: string;
  timestamp: string;
  message: string;
}

export interface ToastNotification {
  id: string;
  type: 'buddy_online' | 'server_favorite' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // in milliseconds
  icon?: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

class NotificationService {
  private notifications = ref<ToastNotification[]>([]);
  private originalTitle = ref<string>('');
  private titleInterval: number | null = null;
  private pendingNotifications = ref(0);

  constructor() {
    // Store original title when service is initialized
    if (typeof document !== 'undefined') {
      this.originalTitle.value = document.title || 'BF1942 Servers Dashboard';
    }
  }

  // Get all active notifications
  getNotifications() {
    return this.notifications;
  }

  // Get count of pending notifications (for tab title)
  getPendingCount() {
    return this.pendingNotifications;
  }

  // Add a new notification
  addNotification(notification: Omit<ToastNotification, 'id' | 'timestamp'>) {
    const newNotification: ToastNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      duration: notification.duration || 5000, // 5 seconds default
    };

    this.notifications.value.unshift(newNotification);
    this.pendingNotifications.value++;
    
    // Update tab title to indicate new notification
    this.updateTabTitle();

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification;
  }

  // Remove a specific notification
  removeNotification(id: string) {
    const index = this.notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.value.splice(index, 1);
      this.pendingNotifications.value = Math.max(0, this.pendingNotifications.value - 1);
      
      // Update tab title
      this.updateTabTitle();
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications.value = [];
    this.pendingNotifications.value = 0;
    this.updateTabTitle();
  }

  // Mark notifications as viewed (reset tab title)
  markAsViewed() {
    this.pendingNotifications.value = 0;
    this.updateTabTitle();
  }

  // Handle buddy online notifications specifically
  handleBuddyOnline(data: BuddyOnlineNotification) {
    const notification = this.addNotification({
      type: 'buddy_online',
      title: `${data.buddyName} is online!`,
      message: `Playing ${data.mapName} on ${data.serverName}`,
      duration: 8000, // Show buddy notifications longer
      icon: '👤',
      action: {
        label: 'View Server',
        handler: () => {
          // Navigate to server details - we'll implement this later
          console.log('Navigate to server:', data.serverName);
        }
      }
    });

    // Try to show browser notification if permission granted
    this.showBrowserNotification({
      title: `${data.buddyName} is online!`,
      body: `Playing ${data.mapName} on ${data.serverName}`,
      icon: '/favicon.ico', // Use app icon
      tag: `buddy-${data.buddyName}`, // Prevent duplicate notifications
    });

    return notification;
  }

  // Update tab title to show notification count
  private updateTabTitle() {
    if (typeof document === 'undefined') return;

    // Clear existing interval
    if (this.titleInterval) {
      clearInterval(this.titleInterval);
      this.titleInterval = null;
    }

    if (this.pendingNotifications.value > 0) {
      // Create blinking effect for new notifications
      let showCount = true;
      this.titleInterval = window.setInterval(() => {
        if (showCount) {
          document.title = `(${this.pendingNotifications.value}) ${this.originalTitle.value}`;
        } else {
          document.title = this.originalTitle.value;
        }
        showCount = !showCount;
      }, 1000);
    } else {
      // Restore original title
      document.title = this.originalTitle.value;
    }
  }

  // Show browser notification (if permission granted)
  private showBrowserNotification(options: NotificationOptions & { title: string }) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        tag: options.tag,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Click handler to focus the tab
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  }

  // Generate unique ID for notifications
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clean up when service is destroyed
  destroy() {
    if (this.titleInterval) {
      clearInterval(this.titleInterval);
      this.titleInterval = null;
    }
    
    if (typeof document !== 'undefined') {
      document.title = this.originalTitle.value;
    }
  }

  // Test function for development
  testBuddyOnlineNotification(buddyName: string = 'Hellraz0r') {
    const testData: BuddyOnlineNotification = {
      type: 'buddy_online',
      buddyName,
      serverName: '-[HELLO]- Desert Combat',
      mapName: 'dc twin rivers',
      timestamp: new Date().toISOString(),
      message: `${buddyName} is now online on -[HELLO]- Desert Combat playing dc twin rivers`
    };
    
    return this.handleBuddyOnline(testData);
  }
}

export const notificationService = new NotificationService();

// Expose test function to window for development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testBuddyNotification = (buddyName?: string) => 
    notificationService.testBuddyOnlineNotification(buddyName);
}