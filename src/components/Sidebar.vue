<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <router-link to="/" class="logo">Dashboard</router-link>
    </div>
    <ul class="nav-menu">
      <li>
        <div :class="{ 'active-parent': $route.path.startsWith('/servers') }">
          <i class="icon-server"></i>
          <span>Servers</span>
          <i class="icon-arrow open"></i>
        </div>
        <ul class="submenu">
          <li>
            <router-link to="/servers/bf1942" active-class="active">
              <i class="icon-bf1942"></i>
              <span>BF1942</span>
            </router-link>
          </li>
          <li>
            <router-link to="/servers/fh2" active-class="active">
              <i class="icon-fh2"></i>
              <span>FH2</span>
            </router-link>
          </li>
        </ul>
      </li>
      <li>
        <router-link to="/players" active-class="active">
          <i class="icon-players"></i>
          <span>Players</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import bf1942Icon from '../assets/bf1942.png';
import fh2Icon from '../assets/fh2.png';

const route = useRoute();
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.logo {
  color: #ecf0f1;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.nav-menu {
  list-style: none;
  padding: 20px 0;
  margin: 0;
  flex-grow: 1;
}

.nav-menu > li > a, .nav-menu > li > div, .nav-menu > li > .router-link-exact-active {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: background-color 0.3s, color 0.3s;
}

.nav-menu > li > a, .nav-menu > li > .router-link-exact-active {
  cursor: pointer;
}

.nav-menu > li > a:hover, .nav-menu > li > .router-link-exact-active:hover {
  background-color: #34495e;
  color: #ecf0f1;
}

.nav-menu > li > a.active, .nav-menu > li > .router-link-exact-active, .nav-menu > li > div.active-parent {
  background-color: #34495e;
  color: #ffffff;
  font-weight: 500;
}

.nav-menu .icon-server, .nav-menu .icon-players, .nav-menu .icon-arrow {
  margin-right: 15px;
}

.icon-arrow {
  margin-left: auto;
  transition: transform 0.3s;
}

.icon-arrow.open {
  transform: rotate(90deg);
}

.submenu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #212f3d;
}

.submenu li a {
  display: flex;
  align-items: center;
  padding: 12px 20px 12px 40px;
  color: #bdc3c7;
  text-decoration: none;
  transition: background-color 0.3s;
}

.submenu li a:hover {
  background-color: #34495e;
  color: #ecf0f1;
}

.submenu li a.active {
  background-color: #1a5276;
  color: #ffffff;
  font-weight: 500;
}

.submenu li a i {
  margin-right: 12px;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  border-radius: 50%;
}

.icon-bf1942 {
  background-image: url('../assets/bf1942.png');
}

.icon-fh2 {
  background-image: url('../assets/fh2.png');
}
</style> 