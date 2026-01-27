<script setup lang="ts">
interface Props {
  isVisible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'close': [];
}>();
</script>

<template>
  <div 
    v-if="isVisible" 
    class="modal-mobile-safe fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" 
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Markdown Guide
        </h2>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-200 transition-colors"
          @click="$emit('close')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Headings -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Headings</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400"># Main Heading</code>
              <p class="text-slate-400 mt-1">Creates the largest heading</p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">## Subheading</code>
              <p class="text-slate-400 mt-1">Creates a smaller heading</p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">### Even Smaller</code>
              <p class="text-slate-400 mt-1">And so on...</p>
            </div>
          </div>
        </div>

        <!-- Text Formatting -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Text Formatting</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">**bold text**</code>
              <p class="text-slate-400 mt-1">Makes text <strong>bold</strong></p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">*italic text*</code>
              <p class="text-slate-400 mt-1">Makes text <em>italic</em></p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">`code`</code>
              <p class="text-slate-400 mt-1">Highlights inline code</p>
            </div>
          </div>
        </div>

        <!-- Lists -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Lists</h3>
          <div class="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div>
              <p class="text-sm font-medium text-slate-300 mb-2">Bullet List:</p>
              <code class="block bg-slate-900 px-3 py-2 rounded text-amber-400 text-xs whitespace-pre-wrap">- Item one
- Item two
- Item three</code>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-300 mb-2">Numbered List:</p>
              <code class="block bg-slate-900 px-3 py-2 rounded text-amber-400 text-xs whitespace-pre-wrap">1. First item
2. Second item
3. Third item</code>
            </div>
          </div>
        </div>

        <!-- Links -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Links</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">[link text](https://example.com)</code>
              <p class="text-slate-400 mt-1">Creates a clickable link</p>
            </div>
          </div>
        </div>

        <!-- Blockquotes -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Blockquotes</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">> Important note</code>
              <p class="text-slate-400 mt-1">Creates a highlighted blockquote</p>
            </div>
          </div>
        </div>

        <!-- Example -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Example</h3>
          <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <p class="text-slate-300 text-sm mb-3">This markdown:</p>
            <code class="block bg-slate-900 px-3 py-2 rounded text-amber-400 text-xs whitespace-pre-wrap mb-3"># Tournament Rules

## General Rules
- All players must be registered
- Respect all referees
- No cheating allowed

## Map Selection
Winners choose first map for next round.</code>
            <p class="text-slate-300 text-sm">Will display nicely formatted rules with sections and lists.</p>
          </div>
        </div>
      </div>

      <!-- Close Button -->
      <div class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6">
        <button
          type="button"
          class="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
          @click="$emit('close')"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
</template>
