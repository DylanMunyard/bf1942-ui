<template>
  <div class="empty-state-card">
    <div class="empty-state-content">
      <div class="icon-container">
        <span class="icon">{{ icon }}</span>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ description }}</p>
      <button v-if="actionText" @click="$emit('action')" class="action-button">
        {{ actionText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  actionText?: string;
  icon: string;
}>();

defineEmits<{
  action: [];
}>();
</script>

<style scoped>
.empty-state-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  background-color: rgba(var(--color-accent-rgb), 0.02);
  transition: all 0.3s ease;
}

.empty-state-card:hover {
  border-color: rgba(var(--color-accent-rgb), 0.3);
  background-color: rgba(var(--color-accent-rgb), 0.05);
}

.empty-state-content {
  max-width: 280px;
}

.icon-container {
  margin-bottom: 16px;
}

.icon {
  font-size: 3rem;
  opacity: 0.7;
}

.empty-title {
  color: var(--color-text);
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.empty-description {
  color: var(--color-text-secondary);
  margin: 0 0 20px 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.action-button {
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(var(--color-accent-rgb), 0.8) 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.3);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .empty-state-card {
    min-height: 150px;
    padding: 30px 15px;
  }
  
  .icon {
    font-size: 2.5rem;
  }
  
  .empty-title {
    font-size: 1.125rem;
  }
  
  .empty-description {
    font-size: 0.8rem;
  }
}
</style>