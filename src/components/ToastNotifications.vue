<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'toast',
          `toast-${notification.type}`
        ]"
        @click="handleNotificationClick(notification)"
      >
        <div class="toast-icon">
          <span v-if="notification.icon">{{ notification.icon }}</span>
          <span v-else>{{ getDefaultIcon(notification.type) }}</span>
        </div>
        
        <div class="toast-content">
          <div class="toast-title">{{ notification.title }}</div>
          <div class="toast-message">{{ notification.message }}</div>
          <div class="toast-timestamp">{{ formatTimestamp(notification.timestamp) }}</div>
        </div>
        
        <div class="toast-actions">
          <button
            v-if="notification.action"
            class="toast-action-btn"
            @click.stop="notification.action.handler()"
          >
            {{ notification.action.label }}
          </button>
          <button
            class="toast-close-btn"
            @click.stop="removeNotification(notification.id)"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
        
        <div class="toast-progress" v-if="notification.duration">
          <div
            class="toast-progress-bar"
            :style="{ animationDuration: `${notification.duration}ms` }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { notificationService, type ToastNotification } from '@/services/notificationService';

const notifications = notificationService.getNotifications();

const removeNotification = (id: string) => {
  notificationService.removeNotification(id);
};

const handleNotificationClick = (notification: ToastNotification) => {
  // Mark as viewed when clicked
  notificationService.markAsViewed();
  
  // If there's an action, execute it
  if (notification.action) {
    notification.action.handler();
  }
};

const getDefaultIcon = (type: string): string => {
  const icons = {
    buddy_online: '👤',
    server_favorite: '🎮',
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };
  return icons[type as keyof typeof icons] || 'ℹ️';
};

const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// Clean up on unmount
onUnmounted(() => {
  notificationService.destroy();
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: 100%;
  pointer-events: none;
}

.toast {
  position: relative;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(12px);
  cursor: pointer;
  pointer-events: auto;
  overflow: hidden;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

/* Toast type variations */
.toast-buddy_online {
  border-left: 4px solid #22c55e;
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(34, 197, 94, 0.05) 100%);
}

.toast-server_favorite {
  border-left: 4px solid var(--color-primary);
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(var(--color-primary-rgb), 0.05) 100%);
}

.toast-info {
  border-left: 4px solid #3b82f6;
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.toast-success {
  border-left: 4px solid #22c55e;
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(34, 197, 94, 0.05) 100%);
}

.toast-warning {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(245, 158, 11, 0.05) 100%);
}

.toast-error {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, var(--color-card-bg) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.toast-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-heading);
  margin-bottom: 4px;
  line-height: 1.4;
}

.toast-message {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-bottom: 6px;
}

.toast-timestamp {
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.toast-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}

.toast-action-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast-action-btn:hover {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.toast-close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  transition: all 0.2s ease;
}

.toast-close-btn:hover {
  background: var(--color-background-mute);
  color: var(--color-text);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(var(--color-border-rgb), 0.3);
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  background: var(--color-primary);
  width: 100%;
  animation: toast-progress linear forwards;
  transform-origin: left;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Transition animations */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .toast {
    padding: 12px;
    border-radius: 8px;
  }
  
  .toast-title {
    font-size: 13px;
  }
  
  .toast-message {
    font-size: 12px;
  }
}

/* Dark mode specific enhancements */
.dark-mode .toast {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.dark-mode .toast:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
</style>