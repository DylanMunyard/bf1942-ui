<template>
  <div class="login-container">
    <div v-if="!isAuthenticated" class="auth-dropdown" @click="toggleDropdown" ref="dropdownRef">
      <button class="profile-icon-btn">
        <svg class="profile-icon" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </button>
      
      <div v-if="isDropdownOpen" class="dropdown-menu">
        <button 
          @click="handleLogin"
          class="google-login-btn"
          :disabled="isLoading"
        >
          <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ isLoading ? 'Signing in...' : 'Sign in with Google' }}
        </button>
      </div>
    </div>
    
    <div v-else class="user-dropdown" @click="toggleDropdown" ref="dropdownRef">
      <button class="user-avatar-btn">
        <div class="user-avatar-placeholder">
          U
        </div>
        <svg class="dropdown-arrow" :class="{ 'open': isDropdownOpen }" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7 10l5 5 5-5z"/>
        </svg>
      </button>
      
      <div v-if="isDropdownOpen" class="dropdown-menu">
        <div class="user-email">Authenticated</div>
        <button @click="handleLogout" class="logout-btn">
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { isAuthenticated, login, logout } = useAuth();
const isLoading = ref(false);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

const handleLogin = async () => {
  if (isLoading.value) return;
  
  try {
    isLoading.value = true;
    await login();
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  isDropdownOpen.value = false;
  logout();
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-dropdown {
  position: relative;
  display: inline-block;
}

.profile-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-icon-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.profile-icon {
  color: var(--color-text-2);
}

.google-login-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: white;
  color: #333;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-login-btn:hover:not(:disabled) {
  box-shadow: 0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15);
  border-color: #dadce0;
}

.google-login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  flex-shrink: 0;
}

.user-dropdown {
  position: relative;
  display: inline-block;
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-avatar-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.user-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  color: var(--color-text-2);
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
}

.user-email {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  word-break: break-all;
}

.logout-btn {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  color: var(--color-text-2);
  border: none;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

@media (max-width: 768px) {
  .profile-icon-btn {
    width: 32px;
    height: 32px;
  }
  
  .auth-dropdown .dropdown-menu {
    min-width: 200px;
    left: 0;
    right: auto;
  }
  
  .google-login-btn {
    font-size: 13px;
    padding: 10px 12px;
  }
  
  .user-dropdown .dropdown-menu {
    min-width: 180px;
    left: 0;
    right: auto;
  }
  
  .user-email {
    font-size: 13px;
    padding: 10px 12px;
  }
  
  .logout-btn {
    font-size: 13px;
    padding: 10px 12px;
  }
}
</style>