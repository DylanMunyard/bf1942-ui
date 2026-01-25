<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-md w-full shadow-2xl overflow-hidden"
      @click.stop
    >
      <div class="p-6 border-b border-slate-700/50">
        <h2 class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          {{ mode === 'set' ? 'Set 6-digit PIN' : 'Enter PIN' }}
        </h2>
        <p class="text-slate-400 text-sm mt-1">
          {{ mode === 'set' ? 'Create a PIN required before any destructive actions.' : 'Verify your PIN to continue.' }}
        </p>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">PIN (6 digits)</label>
          <input
            v-model="pin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="••••••"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            :disabled="loading"
            @keydown.enter="onSubmit"
          />
        </div>

        <div v-if="mode === 'set'">
          <label class="block text-sm font-medium text-slate-300 mb-1">Confirm PIN</label>
          <input
            v-model="confirmPin"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="••••••"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            :disabled="loading"
            @keydown.enter="onSubmit"
          />
        </div>

        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-3 px-6 py-4 bg-slate-800/20 border-t border-slate-700/50">
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-transparent text-slate-400 border border-slate-700/50 font-medium text-sm hover:bg-slate-700/50 hover:text-white transition-colors"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading || !canSubmit"
          @click="onSubmit"
        >
          {{ loading ? '...' : (mode === 'set' ? 'Set PIN' : 'Verify') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    mode: 'set' | 'verify';
    loading?: boolean;
    error?: string | null;
  }>(),
  { loading: false, error: null }
);

const emit = defineEmits<{
  submit: [pin: string];
  cancel: [];
}>();

const pin = ref('');
const confirmPin = ref('');

const canSubmit = computed(() => {
  if (props.mode === 'set') {
    return pin.value.length === 6 && confirmPin.value === pin.value;
  }
  return pin.value.length === 6;
});

function onSubmit() {
  if (!canSubmit.value || props.loading) return;
  if (props.mode === 'set' && pin.value !== confirmPin.value) return;
  emit('submit', pin.value);
}

// Restrict to digits
watch(pin, (v) => {
  pin.value = v.replace(/\D/g, '').slice(0, 6);
});
watch(confirmPin, (v) => {
  confirmPin.value = v.replace(/\D/g, '').slice(0, 6);
});
</script>
