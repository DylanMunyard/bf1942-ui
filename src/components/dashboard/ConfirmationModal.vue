<template>
  <div
    class="modal-mobile-safe modal-backdrop"
    @click="$emit('cancel')"
  >
    <div class="modal-container" @click.stop>
      <!-- Terminal Bar -->
      <div class="terminal-bar">
        <div class="terminal-dots">
          <span class="dot dot-red" />
          <span class="dot dot-yellow" />
          <span class="dot dot-green" />
        </div>
        <span class="terminal-title">confirm_action</span>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <div class="warning-icon">[!]</div>
        <div class="terminal-output">
          <div class="output-line">
            <span class="prompt">&gt;</span>
            <span class="command">{{ message }}?</span>
          </div>
        </div>
        <p class="warning-text">// This action cannot be undone</p>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button class="btn-action btn-cancel" @click="$emit('cancel')">
          [CANCEL]
        </button>
        <button class="btn-action btn-confirm" @click="$emit('confirm')">
          [{{ confirmText.toUpperCase() }}]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string;
  confirmText?: string;
}

withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm'
});

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
}

.modal-container {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  max-width: 380px;
  width: 100%;
  overflow: hidden;
  box-shadow:
    0 0 40px rgba(255, 49, 49, 0.1),
    0 25px 50px -12px rgba(0, 0, 0, 0.5);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  animation: modal-in 0.2s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Terminal Bar */
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, #1a1f26 0%, #0d1117 100%);
  border-bottom: 1px solid #30363d;
}

.terminal-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-title {
  font-size: 0.7rem;
  color: #8b949e;
  text-transform: lowercase;
}

/* Content */
.modal-content {
  padding: 1.5rem;
  text-align: center;
}

.warning-icon {
  font-size: 2rem;
  font-weight: 700;
  color: #ff3131;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(255, 49, 49, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.terminal-output {
  margin-bottom: 0.5rem;
}

.output-line {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.prompt {
  color: #ff3131;
  flex-shrink: 0;
}

.command {
  color: #e6edf3;
  font-weight: 600;
}

.warning-text {
  font-size: 0.7rem;
  color: #6e7681;
  margin: 0;
  font-style: italic;
}

/* Actions */
.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
}

.btn-action {
  flex: 1;
  padding: 0.625rem 1rem;
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-cancel {
  color: #8b949e;
}

.btn-cancel:hover {
  background: rgba(139, 148, 158, 0.1);
  border-color: #8b949e;
}

.btn-confirm {
  color: #ff3131;
  border-color: rgba(255, 49, 49, 0.4);
}

.btn-confirm:hover {
  background: rgba(255, 49, 49, 0.15);
  border-color: #ff3131;
  box-shadow: 0 0 15px rgba(255, 49, 49, 0.2);
}

/* Mobile */
@media (max-width: 480px) {
  .modal-container {
    max-width: 320px;
  }

  .modal-content {
    padding: 1.25rem 1rem;
  }

  .warning-icon {
    font-size: 1.5rem;
  }

  .output-line {
    font-size: 0.8rem;
  }

  .modal-actions {
    padding: 0.75rem 1rem 1.25rem;
    gap: 0.5rem;
  }

  .btn-action {
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
  }
}
</style>
