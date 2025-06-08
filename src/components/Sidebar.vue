<template>
  <div class="sidebar">
    <div class="nav-menu">
      <div class="nav-group">
        <div :class="{ 'nav-item': true, 'active-parent': $route.path.startsWith('/servers') }">
          <i class="icon-server"></i>
          <i class="icon-arrow" :class="{ 'open': $route.path.startsWith('/servers') }"></i>
        </div>
        <div class="submenu" v-if="$route.path.startsWith('/servers')">
          <router-link to="/servers/bf1942" active-class="active" class="submenu-item">
            <i class="icon-bf1942"></i>
            <span class="nav-text">42</span>
          </router-link>
          <router-link to="/servers/fh2" active-class="active" class="submenu-item">
            <i class="icon-fh2"></i>
            <span class="nav-text">FH2</span>
          </router-link>
        </div>
      </div>
      <router-link to="/players" active-class="active" class="nav-item">
        <div class="icon-placeholder">
          <!-- Icon will be provided shortly -->
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
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

.nav-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
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

.nav-item.active, .nav-item.router-link-exact-active, .nav-item.active-parent {
  background-color: var(--sidebar-active);
  color: #ffffff;
  font-weight: 500;
  border: 2px solid #06b6d4;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2);
}

.icon-server, .icon-players, .icon-arrow {
  width: 20px;
  height: 20px;
  margin-bottom: 2px;
}

.icon-arrow {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  transition: transform 0.3s;
  margin: 0;
}

.icon-arrow.open {
  transform: rotate(90deg);
}

.icon-placeholder {
  width: 20px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.3);
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submenu {
  position: absolute;
  right: 60px;
  top: 0;
  background-color: var(--sidebar-submenu);
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--sidebar-border);
  min-width: 80px;
}

.submenu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  color: var(--sidebar-text-muted);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.7rem;
  font-weight: 600;
}

.submenu-item:hover {
  background-color: var(--sidebar-hover);
  color: #e2e8f0;
}

.submenu-item.active {
  color: #06b6d4;
  font-weight: 500;
  background-color: rgba(6, 182, 212, 0.1);
}

.submenu-item i {
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
  margin-bottom: 4px;
}

.nav-text {
  font-size: 0.7rem;
  text-align: center;
  line-height: 1;
}

.icon-bf1942 {
  background-image: url('../assets/bf1942.png');
}

.icon-fh2 {
  background-image: url('../assets/fh2.png');
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
  
  .submenu {
    right: 50px;
    min-width: 70px;
  }
  
  .nav-text {
    font-size: 0.6rem;
  }
}
</style> 