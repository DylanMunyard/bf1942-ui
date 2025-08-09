import { ref } from 'vue';
import { notificationService } from '@/services/notificationService';

export function useNotifications() {
  const notifications = notificationService.getNotifications();
  const pendingCount = notificationService.getPendingCount();

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

  return {
    notifications,
    pendingCount,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsViewed,
  };
}