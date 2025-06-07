<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <router-link to="/" class="logo">
        <img src="../assets/sitelogo-pro.png" alt="Site Logo" class="logo-image" />
        <div class="logo-text">bf.stats</div>
      </router-link>
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
              <span>Battlefield 1942</span>
            </router-link>
          </li>
          <li>
            <router-link to="/servers/fh2" active-class="active">
              <i class="icon-fh2"></i>
              <span>Forgotten Hope 2</span>
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
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.4);
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #334155;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.logo {
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
}

.logo-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  transition: transform 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.logo:hover .logo-image {
  transform: scale(1.05);
}

.logo-text {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 300;
  color: #94a3b8;
  letter-spacing: 0.5px;
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
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 0 25px 25px 0;
  margin-right: 8px;
}

.nav-menu > li > a, .nav-menu > li > .router-link-exact-active {
  cursor: pointer;
}

.nav-menu > li > a:hover, .nav-menu > li > .router-link-exact-active:hover {
  background-color: #1e293b;
  color: #f8fafc;
  transform: translateX(4px);
}

.nav-menu > li > a.active, .nav-menu > li > .router-link-exact-active, .nav-menu > li > div.active-parent {
  background-color: #475569;
  color: #ffffff;
  font-weight: 500;
  border-left: 3px solid #06b6d4;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2);
  border-radius: 0;
  margin-right: 0;
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
  background-color: #020617;
}

.submenu li a {
  display: flex;
  align-items: center;
  padding: 12px 20px 12px 40px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 0 20px 20px 0;
  margin-right: 12px;
}

.submenu li a:hover {
  background-color: #0f172a;
  color: #e2e8f0;
  transform: translateX(4px);
}

.submenu li a.active {
  color: #06b6d4;
  font-weight: 500;
  position: relative;
}

.submenu li a.active::before {
  content: "▸";
  position: absolute;
  left: 20px;
  color: #06b6d4;
  font-size: 12px;
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