import { ref, computed } from 'vue';
import router from '@/router';

export interface BuddyOnlineNotification {
  type: 'buddy_online';
  buddyName: string;
  serverName: string;
  mapName: string;
  timestamp: string;
  message: string;
}

export interface ServerMapChangeNotification {
  type: 'server_map_change';
  serverName: string;
  mapName: string;
  timestamp: string;
  message: string;
  joinLink?: string;
}

export interface ToastNotification {
  id: string;
  type: 'buddy_online' | 'server_map_change' | 'server_favorite' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // in milliseconds
  icon?: string;
  viewed?: boolean; // for recent notifications tracking
  interacted?: boolean; // true if user clicked on the toast
  autoRemoved?: boolean; // true if toast was auto-removed vs manually closed
  action?: {
    label: string;
    handler: () => void;
  };
}

class NotificationService {
  private notifications = ref<ToastNotification[]>([]);
  private recentNotifications = ref<ToastNotification[]>([]);
  private originalTitle = ref<string>('');
  private titleInterval: number | null = null;
  private pendingNotifications = ref(0);
  private MAX_RECENT_NOTIFICATIONS = 10;

  constructor() {
    // Store original title when service is initialized
    // Now we need to get the current title dynamically since it changes with routes
    this.updateOriginalTitle();
  }
  // Update the original title to current document title (called when route changes)
  updateOriginalTitle() {
    if (typeof document !== 'undefined') {
      this.originalTitle.value = document.title || 'BF Stats - Battlefield Server Statistics';
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

  // Get recent notifications for sidebar
  getRecentNotifications() {
    return this.recentNotifications;
  }

  // Get count of unread recent notifications
  getUnreadRecentCount() {
    return computed(() => this.recentNotifications.value.filter(n => !n.viewed).length);
  }

  // Get count of truly missed notifications (auto-closed without interaction)
  getMissedNotificationCount() {
    return computed(() => this.recentNotifications.value.filter(n => 
      !n.viewed && n.autoRemoved && !n.interacted
    ).length);
  }

  // Add a new notification
  addNotification(notification: Omit<ToastNotification, 'id' | 'timestamp'>) {
    const newNotification: ToastNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      duration: notification.duration || 5000, // 5 seconds default
      viewed: false,
      interacted: false,
      autoRemoved: false,
    };

    this.notifications.value.unshift(newNotification);
    this.pendingNotifications.value++;

    // Add to recent notifications (at the beginning)
    this.recentNotifications.value.unshift({ ...newNotification });

    // Keep only the most recent notifications
    if (this.recentNotifications.value.length > this.MAX_RECENT_NOTIFICATIONS) {
      this.recentNotifications.value = this.recentNotifications.value.slice(0, this.MAX_RECENT_NOTIFICATIONS);
    }

    // Update tab title to indicate new notification
    this.updateTabTitle();

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id, true); // Mark as auto-removed
      }, newNotification.duration);
    }

    return newNotification;
  }

  // Remove a specific notification
  removeNotification(id: string, autoRemoved: boolean = false) {
    const index = this.notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      // Mark the notification in recent notifications as auto-removed
      const recentIndex = this.recentNotifications.value.findIndex(n => n.id === id);
      if (recentIndex > -1) {
        this.recentNotifications.value[recentIndex].autoRemoved = autoRemoved;
      }

      this.notifications.value.splice(index, 1);
      this.pendingNotifications.value = Math.max(0, this.pendingNotifications.value - 1);

      // Update tab title
      this.updateTabTitle();
    }
  }

  // Mark notification as interacted (clicked)
  markAsInteracted(id: string) {
    const recentIndex = this.recentNotifications.value.findIndex(n => n.id === id);
    if (recentIndex > -1) {
      this.recentNotifications.value[recentIndex].interacted = true;
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

  // Mark recent notifications as viewed
  markRecentAsViewed() {
    this.recentNotifications.value.forEach(n => n.viewed = true);
  }

  // Remove a specific recent notification
  removeRecentNotification(id: string) {
    const index = this.recentNotifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      this.recentNotifications.value.splice(index, 1);
    }
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
          router.push({ name: 'server-details', params: { serverName: data.serverName } });
        }
      }
    });

    return notification;
  }

  // Handle server map change notifications specifically
  handleServerMapChange(data: ServerMapChangeNotification) {
    const notification = this.addNotification({
      type: 'server_map_change',
      title: `Map Changed on ${data.serverName}`,
      message: `Now playing ${data.mapName}`,
      duration: 6000,
      icon: '🗺️',
      action: data.joinLink ? {
        label: '🚀 Join',
        handler: () => {
          if (data.joinLink) {
            window.open(data.joinLink, '_blank');
          }
        }
      } : {
        label: 'View Server',
        handler: () => {
          router.push({ name: 'server-details', params: { serverName: data.serverName } });
        }
      }
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

  // Test function for server map change notifications
  testServerMapChangeNotification(serverName: string = '-[HELLO]- Desert Combat') {
    const testData: ServerMapChangeNotification = {
      type: 'server_map_change',
      serverName,
      mapName: 'fh2 normandy_1944',
      timestamp: new Date().toISOString(),
      message: `Server ${serverName} changed map from fh2 sidi_bou_zid to fh2 normandy_1944`,
      joinLink: 'bf1942://192.168.1.100:14567'
    };

    return this.handleServerMapChange(testData);
  }
}

export const notificationService = new NotificationService();

// Expose test functions to window for development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testBuddyNotification = (buddyName?: string) => 
    notificationService.testBuddyOnlineNotification(buddyName);
  (window as any).testServerMapChangeNotification = (serverName?: string) => 
    notificationService.testServerMapChangeNotification(serverName);
}
