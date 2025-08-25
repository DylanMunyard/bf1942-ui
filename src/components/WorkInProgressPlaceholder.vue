<template>
  <div class="wip-container">
    <div class="wip-content">
      <div class="wip-icon">
        🚧
      </div>
      <h1 class="wip-title">
        Work in Progress
      </h1>
      <p class="wip-message">
        This feature is currently under development and will be available soon.
      </p>
      <div class="wip-spinner" />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.wip-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 32px;
  @apply bg-slate-900/40 backdrop-blur-sm;
  color: var(--color-text);
}

.wip-content {
  text-align: center;
  max-width: 500px;
}

.wip-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.wip-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.wip-message {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.8;
  line-height: 1.5;
}

.wip-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>