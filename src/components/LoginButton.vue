<template>
  <div class="flex items-center gap-3">
    <div
      v-if="!isAuthenticated"
      ref="dropdownRef"
      class="relative inline-block"
      @click="toggleDropdown"
    >
      <button class="flex items-center justify-center w-9 h-9 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full cursor-pointer transition-all duration-200 hover:bg-slate-700/70 hover:border-slate-600/50">
        <svg
          class="text-slate-300 flex items-center justify-center"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </button>
      
      <div
        v-if="isDropdownOpen"
        class="absolute top-full right-0 md:right-0 left-0 md:left-auto mt-2 bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-xl min-w-[220px] z-[1000] overflow-hidden"
        style="box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.1)"
      >
        <button 
          class="flex items-center gap-2 w-full px-4 py-3 bg-slate-900/80 backdrop-blur-sm text-white border border-slate-700 rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-700/60 hover:border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="handleLogin"
        >
          <svg
            class="flex-shrink-0"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {{ isLoading ? 'Signing in...' : 'Sign in with Google' }}
        </button>
      </div>
    </div>
    
    <div
      v-else
      ref="dropdownRef"
      class="relative inline-block"
      @click="toggleDropdown"
    >
      <button
        class="flex items-center justify-center w-11 h-11 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full cursor-pointer transition-all duration-300 hover:bg-slate-700/70 hover:border-cyan-500/50 hover:-translate-y-0.5"
        style="box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15)"
      >
        <div class="flex-shrink-0 relative w-9 h-9 flex items-center justify-center">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 p-0.5 transition-all duration-300 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 hover:scale-105">
            <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <div
                class="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 text-slate-900 flex items-center justify-center text-xs font-bold"
                style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)"
              >
                {{ getUserInitial() }}
              </div>
            </div>
          </div>
        </div>
      </button>
      
      <div
        v-if="isDropdownOpen"
        class="absolute top-full right-0 md:right-0 left-0 md:left-auto mt-2 bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl min-w-[220px] z-[1000] overflow-hidden"
        style="box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.1)"
      >
        <div class="px-4 py-4 border-b border-slate-700/30 bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
          <div class="text-xs text-slate-400 font-medium break-all">
            {{ user?.email || 'Authenticated' }}
          </div>
        </div>
        <button
          class="w-full px-4 py-3.5 bg-transparent text-slate-300 border-none text-left text-sm font-medium cursor-pointer transition-all duration-300 relative overflow-hidden hover:bg-slate-800/70 hover:text-cyan-400 hover:translate-x-1 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-cyan-500/10 before:to-transparent before:transition-all before:duration-300 hover:before:left-full"
          @click="handleLogout"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { isAuthenticated, user, login, logout } = useAuth();

const isLoading = ref(false);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

// Debug logging to see user data
watchEffect(() => {
  console.log('LoginButton - isAuthenticated:', isAuthenticated.value);
  console.log('LoginButton - user:', user.value);
});

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

const getUserInitial = (): string => {
  if (user.value?.name) {
    return user.value.name.charAt(0).toUpperCase();
  }
  if (user.value?.email) {
    return user.value.email.charAt(0).toUpperCase();
  }
  return 'U';
};


onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

