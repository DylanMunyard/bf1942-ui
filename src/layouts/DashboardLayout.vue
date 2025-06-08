<template>
  <div class="dashboard-layout">
    <main class="content-area">
      <router-view />
    </main>
    <Sidebar />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  background-color: var(--color-background-soft);
}

.content-area {
  margin-right: 60px; /* Same as sidebar width */
  flex-grow: 1;
  padding: 30px;
  width: calc(100% - 60px);
  min-height: 100vh;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .content-area {
    margin-right: 50px; /* Adjusted for mobile sidebar width */
    width: calc(100% - 50px);
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 10px;
  }
}
</style> 