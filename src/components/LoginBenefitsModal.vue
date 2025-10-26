<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click="close"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-150"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style="box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(6, 182, 212, 0.2)"
            @click.stop
          >
            <!-- Close Button -->
            <button
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-white transition-all duration-200"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Header -->
            <div class="relative p-8 pb-6 border-b border-slate-700/50">
              <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-50" />
              <div class="relative">
                <h2 class="text-3xl font-bold text-slate-200 mb-2">
                  What you get with an account
                </h2>
                <p class="text-slate-400">
                  Sign in to track your stats and save your preferences
                </p>
              </div>
            </div>

            <!-- Features Grid -->
            <div class="p-8 space-y-4">
              <!-- Feature 1: Player Profiles -->
              <div class="flex gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div class="flex-shrink-0 w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-lg">
                  👤
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-200 mb-1">Link your player names</h3>
                  <p class="text-slate-400 text-sm">
                    Connect your in-game names to see your stats and match history in one place.
                  </p>
                </div>
              </div>

              <!-- Feature 2: Favorite Servers -->
              <div class="flex gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div class="flex-shrink-0 w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-lg">
                  ⭐
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-200 mb-1">Bookmark servers</h3>
                  <p class="text-slate-400 text-sm">
                    Save your favorite servers so you can find them quickly next time.
                  </p>
                </div>
              </div>

              <!-- Feature 3: Squad Management -->
              <div class="flex gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div class="flex-shrink-0 w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-lg">
                  👥
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-200 mb-1">Organize squads</h3>
                  <p class="text-slate-400 text-sm">
                    Group players together and compare stats with your regular teammates.
                  </p>
                </div>
              </div>

              <!-- Feature 4: Personal Dashboard -->
              <div class="flex gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div class="flex-shrink-0 w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-lg">
                  📊
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-200 mb-1">Personal dashboard</h3>
                  <p class="text-slate-400 text-sm">
                    View your recent matches and stats without having to search for them.
                  </p>
                </div>
              </div>
            </div>

            <!-- CTA Footer -->
            <div class="p-8 pt-6 border-t border-slate-700/50 bg-slate-800/30">
              <div class="flex justify-end">
                <button
                  class="flex items-center gap-2 px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors duration-200"
                  @click="handleSignIn"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Sign in with Discord
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  signIn: [];
}>();

const close = () => {
  emit('close');
};

const handleSignIn = () => {
  emit('signIn');
  emit('close');
};
</script>
