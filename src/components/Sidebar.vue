<template>
  <div class="sidebar">
    <div class="nav-menu">
      <router-link to="/servers/bf1942" active-class="active" class="nav-item" title="42">
        <i class="icon-bf1942"></i>
      </router-link>
      <router-link to="/servers/fh2" active-class="active" class="nav-item" title="FH2">
        <i class="icon-fh2"></i>
      </router-link>
      <router-link to="/players" active-class="active" class="nav-item">
        <i class="icon-players"></i>
      </router-link>
      <div class="nav-item theme-toggle-item" @click="toggleDarkMode" :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
        <span class="toggle-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { inject, type Ref } from 'vue';

const route = useRoute();
const isDarkMode = inject<Ref<boolean>>('isDarkMode')!;
const toggleDarkMode = inject<() => void>('toggleDarkMode')!;
</script>

<style scoped>
.sidebar {
  width: 60px;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.4);
  border-left: 1px solid var(--sidebar-border);
  z-index: 100;
}

.nav-menu {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 8px;
  width: 44px;
  height: 44px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
}

.nav-item:hover, .nav-item.router-link-exact-active:hover {
  background-color: var(--sidebar-hover);
  color: var(--sidebar-text);
}

.nav-item.active, .nav-item.router-link-exact-active {
  background-color: var(--sidebar-active);
  color: #ffffff;
  font-weight: 500;
  border: 2px solid #06b6d4;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2);
}

.icon-bf1942 {
  background-image: url('../assets/bf1942.png');
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.icon-fh2 {
  background-image: url('../assets/fh2.png');
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.icon-players {
  background-image: url('../assets/players.png');
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Round icons */
.icon-players,
.icon-bf1942,
.icon-fh2 {
  border-radius: 50%;
  overflow: hidden;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .sidebar {
    width: 50px;
  }
  
  .nav-item {
    width: 36px;
    height: 36px;
    padding: 8px 6px;
  }
}

/* Style theme-toggle nav-item inside sidebar */
.theme-toggle-item {
  margin-top: auto;
}
.theme-toggle-item .toggle-icon {
  font-size: 1.2rem;
  user-select: none;
}
</style> 