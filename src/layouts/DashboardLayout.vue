<template>
  <div class="dashboard-layout min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

    <main class="content-area relative z-10">
      <router-view />
    </main>
    <Sidebar />
    <OnlinePlayersSidebar v-if="isAuthenticated" />
    <ToastNotifications />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
import OnlinePlayersSidebar from '../components/OnlinePlayersSidebar.vue';
import ToastNotifications from '../components/ToastNotifications.vue';
import { useAuth } from '@/composables/useAuth';

const { isAuthenticated } = useAuth();
</script>

<style scoped>
.dashboard-layout {
  display: flex;
}

.content-area {
  margin-right: 60px; /* Same as sidebar width */
  flex-grow: 1;
  width: calc(100% - 60px);
  min-height: 100vh;
  color: var(--color-text);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
  }
  
  .content-area {
    margin-right: 0;
    margin-top: 60px; /* Height of mobile sidebar */
    width: 100%;
  }
}

</style> 