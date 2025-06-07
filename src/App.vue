<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DashboardLayout from './layouts/DashboardLayout.vue';

const router = useRouter();
const route = useRoute();

// Dark mode state
const isDarkMode = ref(false);

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
onMounted(() => {
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
</script>

<template>
  <DashboardLayout />
</template>

<style>
/* Global styles */
:root {
  --color-primary: #3498db;
  --color-primary-hover: #2980b9;
  --color-accent: #e67e22;
  --color-accent-hover: #d35400;
  --color-background: #ffffff;
  --color-background-soft: #f8f9f9;
  --color-background-mute: #e5e8e8;
  --color-border: #d7dbdd;
  --color-text: #2c3e50;
  --color-text-muted: #7f8c8d;
  --color-heading: #2c3e50;
  --color-primary-rgb: 52, 152, 219;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

#app {
  width: 100%;
  height: 100%;
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

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.theme-toggle-button {
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.theme-toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.toggle-icon {
  font-size: 20px;
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
