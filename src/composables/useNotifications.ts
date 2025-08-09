import { ref, onMounted, computed } from 'vue';
import { notificationService } from '@/services/notificationService';

export function useNotifications() {
  const notificationPermission = ref<NotificationPermission>('default');
  const notifications = notificationService.getNotifications();
  const pendingCount = notificationService.getPendingCount();

  const hasPermission = computed(() => notificationPermission.value === 'granted');
  const canRequestPermission = computed(() => notificationPermission.value === 'default');

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await notificationService.requestNotificationPermission();
      notificationPermission.value = permission;
      return permission;
    }
    return 'denied';
  };

  const addNotification = (notification: Parameters<typeof notificationService.addNotification>[0]) => {
    return notificationService.addNotification(notification);
  };

  const removeNotification = (id: string) => {
    notificationService.removeNotification(id);
  };

  const clearAllNotifications = () => {
    notificationService.clearAll();
  };

  const markAsViewed = () => {
    notificationService.markAsViewed();
  };

  // Check initial permission status
  onMounted(() => {
    if ('Notification' in window) {
      notificationPermission.value = Notification.permission;
    }
  });

  return {
    notifications,
    pendingCount,
    notificationPermission,
    hasPermission,
    canRequestPermission,
    requestPermission,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsViewed,
  };
}