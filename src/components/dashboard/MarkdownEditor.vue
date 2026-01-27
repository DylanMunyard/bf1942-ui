<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';

interface Props {
  modelValue: string;
  label: string;
  placeholder: string;
  height?: string;
  showHelpButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: 'h-64',
  showHelpButton: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'show-help': [];
}>();

const showPreview = ref(false);

const renderedMarkdown = computed(() => {
  if (!props.modelValue || !props.modelValue.trim()) {
    return '';
  }
  try {
    return marked(props.modelValue, { breaks: true });
  } catch {
    return '<p class="text-red-400">Invalid markdown</p>';
  }
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-4 mb-2">
      <label class="block text-sm font-medium text-slate-300">
        {{ label }}
      </label>
      <button
        v-if="showHelpButton"
        type="button"
        @click="$emit('show-help')"
        class="text-xs px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-200 rounded transition-colors"
        title="Show markdown syntax help"
      >
        ? Help
      </button>
    </div>

    <textarea
      :model-value="modelValue"
      :placeholder="placeholder"
      :class="['w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none', height]"
      @input="(e) => $emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
    />

    <!-- Preview Toggle and Display -->
    <div class="mt-3 flex items-center gap-2">
      <button
        type="button"
        @click="showPreview = !showPreview"
        class="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-200 rounded transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {{ showPreview ? 'Hide' : 'Show' }} Preview
      </button>
    </div>

    <!-- Markdown Preview -->
    <div v-if="showPreview && (modelValue && modelValue.trim())" class="mt-4 bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 overflow-y-auto max-h-64">
      <div class="prose prose-invert prose-sm max-w-none">
        <div
          v-html="renderedMarkdown"
          class="text-slate-300 markdown-content"
        />
      </div>
    </div>
  </div>
</template>

<style scoped src="../dashboard/AddTournamentModal.vue.css"></style>
