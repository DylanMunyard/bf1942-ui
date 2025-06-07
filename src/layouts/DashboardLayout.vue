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
  background-color: #f4f7f6;
}

.content-area {
  margin-left: 250px; /* Same as sidebar width */
  flex-grow: 1;
  padding: 30px;
  width: calc(100% - 250px);
  min-height: 100vh;
}
</style> 