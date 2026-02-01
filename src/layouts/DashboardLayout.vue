<template>
  <div class="dashboard-layout min-h-screen bg-slate-900">
    <!-- Subtle animated background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <!-- Site Notice Banner (full width across top) -->
    <SiteNoticeBanner />

    <div class="layout-row">
      <div class="layout-wrapper relative z-10">
        <main class="content-area">
          <router-view />
        </main>
        <Footer />
      </div>
      <Sidebar />
    </div>
    <OnlinePlayersSidebar v-if="isAuthenticated && isDesktop" />
    <ToastNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import SiteNoticeBanner from '../components/SiteNoticeBanner.vue';
import OnlinePlayersSidebar from '../components/OnlinePlayersSidebar.vue';
import ToastNotifications from '../components/ToastNotifications.vue';
import Footer from '../components/Footer.vue';
import { useAuth } from '@/composables/useAuth';

const { isAuthenticated } = useAuth();

// Reactive screen size tracking
const isDesktop = ref(false);

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-row {
  display: flex;
  flex: 1;
  min-height: 0;
}

.layout-wrapper {
  display: flex;
  flex-direction: column;
  margin-right: 60px; /* Same as sidebar width */
  flex-grow: 1;
  min-width: 0;
  min-height: 100vh;
}

.content-area {
  flex-grow: 1;
  color: var(--color-text);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .layout-wrapper {
    margin-right: 0;
    margin-top: var(--mobile-nav-height);
    width: 100%;
  }
}

</style> 