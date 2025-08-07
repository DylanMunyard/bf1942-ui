<template>
  <div
    class="modal-overlay"
    @click="$emit('cancel')"
  >
    <div
      class="confirmation-modal"
      @click.stop
    >
      <div class="modal-body">
        <p>{{ message }}?</p>
      </div>
      <div class="modal-actions">
        <button
          class="cancel-btn"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="confirm-btn"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
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
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confirmation-modal {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 320px;
  width: 90%;
  overflow: hidden;
}

.modal-body {
  padding: 20px 24px 16px;
}

.modal-body p {
  color: var(--color-text);
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px 20px;
  background-color: rgba(var(--color-accent-rgb), 0.05);
  border-top: 1px solid var(--color-border);
}

.cancel-btn,
.confirm-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.cancel-btn {
  background-color: transparent;
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.cancel-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}

.confirm-btn {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.confirm-btn:hover {
  background-color: #c82333;
  border-color: #c82333;
}

@media (max-width: 480px) {
  .confirmation-modal {
    max-width: 280px;
    width: 95%;
  }
  
  .modal-body {
    padding: 16px 20px 12px;
  }
  
  .modal-actions {
    padding: 12px 20px 16px;
  }
  
  .cancel-btn,
  .confirm-btn {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
}
</style>