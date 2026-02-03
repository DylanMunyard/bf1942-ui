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
    class="modal-mobile-safe fixed inset-0 z-[60] flex items-center justify-center p-4 portal-modal-overlay" 
    @click.self="$emit('close')"
  >
    <div class="portal-modal portal-modal--large">
      <!-- Header -->
      <div class="portal-modal-header">
        <h2 class="portal-modal-title portal-modal-title--large">
          Markdown Guide
        </h2>
        <button
          type="button"
          class="portal-modal-close"
          @click="$emit('close')"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="portal-modal-content">
        <!-- Headings -->
        <div class="portal-modal-section">
          <h3 class="portal-modal-section-title">Headings</h3>
          <div class="portal-modal-examples">
            <div class="portal-modal-example">
              <code class="portal-code"># Main Heading</code>
              <p class="portal-modal-example-desc">Creates the largest heading</p>
            </div>
            <div class="portal-modal-example">
              <code class="portal-code">## Subheading</code>
              <p class="portal-modal-example-desc">Creates a smaller heading</p>
            </div>
            <div class="portal-modal-example">
              <code class="portal-code">### Even Smaller</code>
              <p class="portal-modal-example-desc">And so on...</p>
            </div>
          </div>
        </div>

        <!-- Text Formatting -->
        <div class="portal-modal-section">
          <h3 class="portal-modal-section-title">Text Formatting</h3>
          <div class="portal-modal-examples">
            <div class="portal-modal-example">
              <code class="portal-code">**bold text**</code>
              <p class="portal-modal-example-desc">Makes text <strong>bold</strong></p>
            </div>
            <div class="portal-modal-example">
              <code class="portal-code">*italic text*</code>
              <p class="portal-modal-example-desc">Makes text <em>italic</em></p>
            </div>
            <div class="portal-modal-example">
              <code class="portal-code">`code`</code>
              <p class="portal-modal-example-desc">Highlights inline code</p>
            </div>
          </div>
        </div>

        <!-- Lists -->
        <div class="portal-modal-section">
          <h3 class="portal-modal-section-title">Lists</h3>
          <div class="portal-modal-examples">
            <div class="portal-modal-example">
              <p class="portal-modal-example-label">Bullet List:</p>
              <code class="portal-code portal-code--block">- Item one
- Item two
- Item three</code>
            </div>
            <div class="portal-modal-example">
              <p class="portal-modal-example-label">Numbered List:</p>
              <code class="portal-code portal-code--block">1. First item
2. Second item
3. Third item</code>
            </div>
          </div>
        </div>

        <!-- Links -->
        <div class="portal-modal-section">
          <h3 class="portal-modal-section-title">Links</h3>
          <div class="portal-modal-examples">
            <div class="portal-modal-example">
              <code class="portal-code">[link text](https://example.com)</code>
              <p class="portal-modal-example-desc">Creates a clickable link</p>
            </div>
          </div>
        </div>

        <!-- Blockquotes -->
        <div class="portal-modal-section">
          <h3 class="portal-modal-section-title">Blockquotes</h3>
          <div class="portal-modal-examples">
            <div class="portal-modal-example">
              <code class="portal-code">> Important note</code>
              <p class="portal-modal-example-desc">Creates a highlighted blockquote</p>
            </div>
          </div>
        </div>

        <!-- Example -->
        <div class="portal-modal-section">
          <h3 class="portal-modal-section-title">Example</h3>
          <div class="portal-modal-examples">
            <p class="portal-modal-example-label">This markdown:</p>
            <code class="portal-code portal-code--block portal-code--example"># Tournament Rules

## General Rules
- All players must be registered
- Respect all referees
- No cheating allowed

## Map Selection
Winners choose first map for next round.</code>
            <p class="portal-modal-example-desc">Will display nicely formatted rules with sections and lists.</p>
          </div>
        </div>
      </div>

      <!-- Close Button -->
      <div class="portal-modal-footer">
        <button
          type="button"
          class="portal-btn portal-btn--primary"
          @click="$emit('close')"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
</template>
