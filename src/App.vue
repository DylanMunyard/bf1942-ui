<script setup lang="ts">
import { ref, onMounted, watch, provide } from 'vue';
import { useRoute } from 'vue-router';
import DashboardLayout from './layouts/DashboardLayout.vue';
import AIChatButton from './components/AIChatButton.vue';
import AIChatDrawer from './components/AIChatDrawer.vue';
import { initializeBadgeDefinitions } from './services/badgeService';
import { useSignalR } from '@/composables/useSignalR';
import { useNotifications } from '@/composables/useNotifications';
import { createAIContext } from '@/composables/useAIContext';

const route = useRoute();

// Dark mode state
const isDarkMode = ref(false);

// Initialize SignalR
const { isConnected, connectionId } = useSignalR();

// Initialize notifications
useNotifications();

// Initialize AI context
const { context: aiContext } = createAIContext();

// AI Chat state
const isAIChatOpen = ref(false);

const toggleAIChat = () => {
  isAIChatOpen.value = !isAIChatOpen.value;
};


// Function to toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  // Save preference to localStorage
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false');
  updateTheme();
};

// Function to update theme based on dark mode state
const updateTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
    document.documentElement.classList.add('light-mode');
  }
};

// Initialize dark mode from localStorage or system preference
onMounted(async () => {
  // Initialize badge definitions on app startup
  initializeBadgeDefinitions();

  // Check localStorage first
  const storedDarkMode = localStorage.getItem('darkMode');
  if (storedDarkMode !== null) {
    isDarkMode.value = storedDarkMode === 'true';
  } else {
    // If no localStorage value, check system preference
    isDarkMode.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Apply initial theme
  updateTheme();

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only update if user hasn't set a preference
    if (localStorage.getItem('darkMode') === null) {
      isDarkMode.value = e.matches;
      updateTheme();
    }
  });

});

// Watch for changes to isDarkMode
watch(isDarkMode, () => {
  updateTheme();
});

// Provide dark mode state and toggle function to descendants
provide('isDarkMode', isDarkMode);
provide('toggleDarkMode', toggleDarkMode);
</script>

<template>
  <DashboardLayout />
  <AIChatButton :is-open="isAIChatOpen" @click="toggleAIChat" />
  <AIChatDrawer v-model="isAIChatOpen" :context="aiContext" :key="route.fullPath" />
</template>

<style>
/* Global styles */
:root {
  --color-primary: #3498db;
  --color-primary-hover: #2980b9;
  --color-accent: #e67e22;
  --color-accent-hover: #d35400;
  --color-accent-rgb: 230, 126, 34;
  --color-background: #ffffff;
  --color-background-soft: #f8f9f9;
  --color-background-mute: #e5e8e8;
  --color-border: #d7dbdd;
  --color-border-rgb: 215, 219, 221;
  --color-text: #2c3e50;
  --color-text-muted: #7f8c8d;
  --color-text-secondary: #7f8c8d;
  --color-heading: #2c3e50;
  --color-primary-rgb: 52, 152, 219;
  --color-card-bg: #ffffff;
  --color-card-bg-hover: #f8f9fa;
  --sidebar-bg: #0f172a;
  --sidebar-border: #334155;
  --sidebar-text: #f8fafc;
  --sidebar-text-muted: #94a3b8;
  --sidebar-hover: #1e293b;
  --sidebar-active: #475569;
  --sidebar-submenu: #020617;
}

/* Dark mode styles */
.dark-mode {
  --color-primary: #60a5fa;
  --color-primary-hover: #3b82f6;
  --color-accent: #f59e0b;
  --color-accent-hover: #d97706;
  --color-accent-rgb: 245, 158, 11;
  --color-background: #0f172a;
  --color-background-soft: #1e293b;
  --color-background-mute: #334155;
  --color-border: #475569;
  --color-border-rgb: 71, 85, 105;
  --color-text: #f8fafc;
  --color-text-muted: #cbd5e1;
  --color-text-secondary: #cbd5e1;
  --color-heading: #f1f5f9;
  --color-primary-rgb: 96, 165, 250;
  --color-card-bg: #1e293b;
  --color-card-bg-hover: #334155;
  --sidebar-bg: #020617;
  --sidebar-border: #1e293b;
  --sidebar-text: #f8fafc;
  --sidebar-text-muted: #94a3b8;
  --sidebar-hover: #0f172a;
  --sidebar-active: #334155;
  --sidebar-submenu: #000000;
}

/* Light mode styles (explicit) */
.light-mode {
  --color-primary: #3498db;
  --color-primary-hover: #2980b9;
  --color-accent: #e67e22;
  --color-accent-hover: #d35400;
  --color-accent-rgb: 230, 126, 34;
  --color-background: #ffffff;
  --color-background-soft: #f8f9f9;
  --color-background-mute: #e5e8e8;
  --color-border: #d7dbdd;
  --color-border-rgb: 215, 219, 221;
  --color-text: #2c3e50;
  --color-text-muted: #7f8c8d;
  --color-text-secondary: #7f8c8d;
  --color-heading: #2c3e50;
  --color-primary-rgb: 52, 152, 219;
  --color-card-bg: #ffffff;
  --color-card-bg-hover: #f8f9fa;
  --sidebar-bg: #0f172a;
  --sidebar-border: #334155;
  --sidebar-text: #f8fafc;
  --sidebar-text-muted: #94a3b8;
  --sidebar-hover: #1e293b;
  --sidebar-active: #475569;
  --sidebar-submenu: #020617;
}

/* Removed global transitions for performance - apply transitions selectively on specific elements */
a,
button,
.nav-button,
.clickable,
.interactive {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

html {
  overflow-x: hidden;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #0f172a;
  color: var(--color-text);
  overflow-x: hidden;
}

#app {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

a {
  text-decoration: none;
  color: var(--color-primary);
  transition: color 0.2s ease-in-out;
}

a:hover {
  color: var(--color-primary-hover);
}

.app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text);
  margin-top: 20px;
}

.main-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
}

.nav-button {
  padding: 10px 20px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.nav-button:hover {
  background-color: var(--color-background-mute);
}

.nav-button.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

</style>
