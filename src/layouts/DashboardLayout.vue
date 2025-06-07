<template>
  <div class="dashboard-layout">
    <Sidebar />
    <main class="content-area">
      <router-view />
    </main>
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
  margin-left: 250px; /* Same as sidebar width */
  flex-grow: 1;
  padding: 30px;
  width: calc(100% - 250px);
  min-height: 100vh;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}
</style> 