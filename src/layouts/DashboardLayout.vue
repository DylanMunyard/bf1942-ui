<template>
  <div class="dashboard-layout">
    <main class="content-area">
      <router-view />
    </main>
    <Sidebar />
    <PlayerComparisonWidget />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
import PlayerComparisonWidget from '../components/PlayerComparisonWidget.vue';
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  background-color: var(--color-background);
  min-height: 100vh;
}

.content-area {
  margin-right: 60px; /* Same as sidebar width */
  flex-grow: 1;
  padding: 30px;
  width: calc(100% - 60px);
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dashboard-layout {
    background-color: var(--color-background);
    flex-direction: column;
  }
  
  .content-area {
    margin-right: 0;
    margin-top: 60px; /* Height of mobile sidebar */
    width: 100%;
    padding: 15px 8px;
    background-color: var(--color-background);
  }
}

@media (max-width: 480px) {
  .dashboard-layout {
    background-color: var(--color-background);
  }
  
  .content-area {
    padding: 10px 5px;
    background-color: var(--color-background);
  }
}

@media (max-width: 360px) {
  .dashboard-layout {
    background-color: var(--color-background);
  }
  
  .content-area {
    padding: 8px 3px;
    background-color: var(--color-background);
  }
}
</style> 