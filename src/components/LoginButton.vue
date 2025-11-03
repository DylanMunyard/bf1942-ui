<template>
  <div class="flex items-center gap-3">
    <div
      v-if="!isAuthenticated"
      ref="dropdownRef"
      class="relative inline-block"
      @click="toggleDropdown"
    >
      <button class="flex items-center justify-center w-9 h-9 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full cursor-pointer transition-all duration-200 hover:bg-slate-700/70 hover:border-slate-600/50" style="box-shadow: 0 0 8px rgba(88, 101, 242, 0.3)">
        <svg
          class="text-[#5865F2]"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </button>
      
      <div
        v-if="isDropdownOpen"
        class="absolute top-full right-0 md:right-0 left-0 md:left-auto mt-2 bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-xl min-w-[220px] z-[1000] overflow-hidden"
        style="box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.1)"
      >
        <button
          class="flex items-center gap-2 w-full px-4 py-3 bg-slate-900/80 backdrop-blur-sm text-white border border-slate-700 rounded-t text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-700/60 hover:border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="handleDiscordLogin"
        >
          <svg
            class="flex-shrink-0"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              fill="#5865F2"
              d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
            />
          </svg>
          {{ isLoading ? 'Signing in...' : 'Sign in with Discord' }}
        </button>
        <button
          class="flex items-center gap-2 w-full px-4 py-3 bg-slate-800/60 backdrop-blur-sm text-cyan-400 border border-slate-700 border-t-0 rounded-b text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-700/60 hover:text-cyan-300"
          @click="showBenefitsModal"
        >
          <svg class="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Why should I sign in?
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

    <!-- Benefits Modal -->
    <LoginBenefitsModal
      :is-open="showBenefits"
      @close="closeBenefitsModal"
      @sign-in="handleBenefitsSignIn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';
import { useAuth } from '@/composables/useAuth';
import LoginBenefitsModal from './LoginBenefitsModal.vue';

const { isAuthenticated, user, loginWithDiscord, logout } = useAuth();

const isLoading = ref(false);
const isDropdownOpen = ref(false);
const showBenefits = ref(false);
const dropdownRef = ref<HTMLElement>();

const handleDiscordLogin = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    isDropdownOpen.value = false;
    await loginWithDiscord();
  } catch (error) {
    alert('Discord login failed. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

const showBenefitsModal = () => {
  isDropdownOpen.value = false;
  showBenefits.value = true;
};

const closeBenefitsModal = () => {
  showBenefits.value = false;
};

const handleBenefitsSignIn = async () => {
  await handleDiscordLogin();
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

