import { notificationService } from '@/services/notificationService';

export function useNotifications() {
  const notifications = notificationService.getNotifications();
  const pendingCount = notificationService.getPendingCount();
  const recentNotifications = notificationService.getRecentNotifications();
  const unreadRecentCount = notificationService.getUnreadRecentCount();
  const missedNotificationCount = notificationService.getMissedNotificationCount();

  const addNotification = (notification: Parameters<typeof notificationService.addNotification>[0]) => {
    return notificationService.addNotification(notification);
  };

  const removeNotification = (id: string) => {
    notificationService.removeNotification(id);
  };

  const removeRecentNotification = (id: string) => {
    notificationService.removeRecentNotification(id);
  };

  const clearAllNotifications = () => {
    notificationService.clearAll();
  };

  const markAsViewed = () => {
    notificationService.markAsViewed();
  };

  const markRecentAsViewed = () => {
    notificationService.markRecentAsViewed();
  };

  const markAsInteracted = (id: string) => {
    notificationService.markAsInteracted(id);
  };

  return {
    notifications,
    pendingCount,
    recentNotifications,
    unreadRecentCount,
    missedNotificationCount,
    addNotification,
    removeNotification,
    removeRecentNotification,
    clearAllNotifications,
    markAsViewed,
    markRecentAsViewed,
    markAsInteracted,
  };
}