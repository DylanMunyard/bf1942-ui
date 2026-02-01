<template>
  <div class="portal-page flex items-center justify-center min-h-screen">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner flex items-center justify-center">
    <div class="text-center">
      <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md">
        <h2 class="text-xl font-bold text-red-400 mb-2">Authentication Failed</h2>
        <p class="text-neutral-300">{{ error }}</p>
        <button
          @click="redirectToHome"
          class="mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
        >
          Return Home
        </button>
      </div>
      <div v-else class="bg-neutral-800/60 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6">
        <div class="flex items-center justify-center mb-4">
          <svg class="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-neutral-200">Signing in with Discord...</h2>
        <p class="text-neutral-400 mt-2">Please wait while we complete your authentication</p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/authService';

const router = useRouter();
const error = ref<string | null>(null);

onMounted(async () => {
  // Get the authorization code from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const errorParam = urlParams.get('error');

  if (errorParam) {
    error.value = `Discord authorization was denied or failed: ${errorParam}`;
    return;
  }

  if (!code) {
    error.value = 'No authorization code received from Discord';
    return;
  }

  try {
    // Handle the Discord callback
    await authService.handleDiscordCallback(code);

    // Get the return path (or default to dashboard)
    const returnPath = localStorage.getItem('discord_auth_return_path') || '/dashboard';
    localStorage.removeItem('discord_auth_return_path');

    // Redirect to the return path
    router.push(returnPath);
  } catch (err) {
    console.error('Discord callback error:', err);
    error.value = err instanceof Error ? err.message : 'An unknown error occurred during Discord authentication';
  }
});

const redirectToHome = () => {
  router.push('/');
};
</script>

<style src="./portal-layout.css"></style>
