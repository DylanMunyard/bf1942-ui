<template>
  <div class="sidebar">
    <div class="nav-menu">
      <router-link to="/servers/bf1942" active-class="active" class="nav-item" data-tooltip="true">
        <i class="icon-bf1942"></i>
        <div class="tooltip">
          <div class="tooltip-icon icon-bf1942"></div>
          <div class="tooltip-text">Find a BF1942 server. Thanks to <a href="https://github.com/cetteup" target="_blank" rel="noopener">@cetteup</a> for providing these APIs</div>
        </div>
      </router-link>
      <router-link to="/servers/fh2" active-class="active" class="nav-item" data-tooltip="true">
        <i class="icon-fh2"></i>
        <div class="tooltip">
          <div class="tooltip-icon icon-fh2"></div>
          <div class="tooltip-text">Find a FH2 server. Thanks to <a href="https://github.com/cetteup" target="_blank" rel="noopener">@cetteup</a> for providing these APIs</div>
        </div>
      </router-link>
      <router-link to="/players" active-class="active" class="nav-item" data-tooltip="true">
        <i class="icon-players"></i>
        <div class="tooltip">
          <div class="tooltip-icon icon-players"></div>
          <div class="tooltip-text">See who is online, search for a player</div>
        </div>
      </router-link>
      <router-link to="/players/compare" active-class="active" class="nav-item" data-tooltip="true">
        <i class="icon-player-comparison"></i>
        <div class="tooltip">
          <div class="tooltip-icon icon-player-comparison"></div>
          <div class="tooltip-text">Compare two players' performance statistics side-by-side</div>
        </div>
      </router-link>
      <router-link to="/tk-livewire" active-class="active" class="nav-item" data-tooltip="true">
        <i class="icon-tk-livewire"></i>
        <div class="tooltip">
          <div class="tooltip-icon icon-tk-livewire"></div>
          <div class="tooltip-text">Real time monitoring of players whose score is decreasing</div>
        </div>
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
  width: 120px;
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
  padding: 16px 12px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 12px;
  width: 68px;
  height: 68px;
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
  background-image: url('../assets/bf1942.jpg');
  display: inline-block;
  width: 36px;
  height: 36px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.icon-fh2 {
  background-image: url('../assets/fh2.jpg');
  display: inline-block;
  width: 36px;
  height: 36px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.icon-players {
  background-image: url('../assets/players.jpg');
  display: inline-block;
  width: 36px;
  height: 36px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.icon-tk-livewire {
  background-image: url('../assets/team_killers.jpg');
  display: inline-block;
  width: 36px;
  height: 36px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
  overflow: hidden;
}

.icon-player-comparison {
  background-image: url('../assets/player_vs_player.png');
  display: inline-block;
  width: 36px;
  height: 36px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Round icons */
.icon-players,
.icon-bf1942,
.icon-fh2,
.icon-player-comparison {
  border-radius: 50%;
  overflow: hidden;
}

/* Desktop-specific styles */
@media (min-width: 769px) {
  .theme-toggle-item {
    margin-top: auto;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .sidebar {
    width: 100vw;
    height: 60px;
    position: fixed;
    top: 0;
    left: 0;
    right: auto;
    flex-direction: row;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
    border-left: none;
    border-bottom: 1px solid var(--sidebar-border);
    align-items: center;
  }
  
  .nav-menu {
    padding: 0 20px;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
    width: 100%;
    gap: 15px;
  }
  
  .nav-item {
    width: 44px;
    height: 44px;
    padding: 10px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }
  
  .theme-toggle-item {
    margin: 0 !important;
    margin-left: auto !important;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
  }
}

/* Style theme-toggle nav-item inside sidebar */
.theme-toggle-item .toggle-icon {
  font-size: 1.2rem;
  user-select: none;
}

/* Tooltip styles */
.tooltip {
  display: none;
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--sidebar-bg);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  width: 300px;
  border: 1px solid var(--sidebar-border);
  margin-right: 15px;
  z-index: 1000;
}

/* Adjust position for first nav item to prevent cut-off */
.nav-menu > :first-child .tooltip {
  top: 0;
  transform: translateY(0);
}

.nav-item[data-tooltip="true"]:hover .tooltip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.tooltip::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 10px 0 10px 10px;
  border-style: solid;
  border-color: transparent transparent transparent var(--sidebar-bg);
}

/* Adjust arrow for first nav item */
.nav-menu > :first-child .tooltip::after {
  top: 34px;
}

.tooltip-icon {
  width: 128px !important;
  height: 128px !important;
  image-rendering: pixelated;
}

.tooltip-text {
  color: var(--sidebar-text);
  font-size: 0.95rem;
  text-align: center;
  line-height: 1.5;
  padding: 0 10px;
}

.tooltip-text a {
  color: inherit;
  text-decoration: underline;
  text-decoration-style: dotted;
}

.tooltip-text a:hover {
  text-decoration-style: solid;
}

/* Hide tooltips completely on mobile to prevent sticky hover behavior */
@media (max-width: 768px) {
  .nav-item[data-tooltip="true"]:hover .tooltip {
    display: none !important;
  }
}
</style> 