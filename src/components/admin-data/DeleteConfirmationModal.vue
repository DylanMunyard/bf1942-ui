<template>
  <div class="delete-modal-backdrop" @click.self="$emit('cancel')">
    <div class="delete-modal" @click.stop>
      <div class="delete-modal-head">
        <span class="delete-modal-label">[ CONFIRM DESTRUCTION ]</span>
        <h2 class="delete-modal-title">Delete Round</h2>
        <p class="delete-modal-desc">
          This will permanently delete the round and all related data. This cannot be undone.
        </p>
      </div>

      <div class="delete-modal-body">
        <div class="delete-modal-impact">
          <span class="delete-modal-impact-label">impact</span>
          <ul class="delete-modal-impact-list">
            <li><span class="delete-modal-impact-n">{{ impact.achievementCountToDelete }}</span> achievements</li>
            <li v-if="impact.observationCountToDelete != null"><span class="delete-modal-impact-n">{{ impact.observationCountToDelete }}</span> observations</li>
            <li v-if="impact.sessionCountToDelete != null"><span class="delete-modal-impact-n">{{ impact.sessionCountToDelete }}</span> sessions</li>
            <li><span class="delete-modal-impact-n">{{ impact.playerCount }}</span> players in round</li>
          </ul>
        </div>

        <p v-if="error" class="delete-modal-err">{{ error }}</p>
      </div>

      <div class="delete-modal-foot">
        <button
          type="button"
          class="delete-modal-btn delete-modal-btn--ghost"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          cancel
        </button>
        <button
          type="button"
          class="delete-modal-btn delete-modal-btn--danger"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ loading ? 'deleting...' : 'delete round' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  impact: {
    achievementCountToDelete: number;
    observationCountToDelete?: number;
    sessionCountToDelete?: number;
    playerCount: number;
  };
  loading?: boolean;
  error?: string | null;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<style scoped>
.delete-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
}
.delete-modal {
  --dm-bg: #0a0a0f;
  --dm-border: #1a1a24;
  --dm-accent: #00e5a0;
  --dm-danger: #ef4444;
  --dm-danger-glow: rgba(239, 68, 68, 0.2);
  --dm-text: #9ca3af;
  --dm-text-bright: #e5e7eb;
  width: 100%;
  max-width: 24rem;
  background: var(--dm-bg);
  border: 1px solid var(--dm-border);
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--dm-border), 0 24px 48px rgba(0, 0, 0, 0.5);
}
.delete-modal-head {
  padding: 1.25rem 1.25rem 0;
  border-bottom: 1px solid var(--dm-border);
  padding-bottom: 1rem;
}
.delete-modal-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--dm-danger);
  margin-bottom: 0.35rem;
  font-family: ui-monospace, monospace;
}
.delete-modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--dm-text-bright);
  margin: 0 0 0.35rem;
}
.delete-modal-desc {
  font-size: 0.8rem;
  color: var(--dm-text);
  margin: 0;
  line-height: 1.4;
}
.delete-modal-body {
  padding: 1rem 1.25rem;
}
.delete-modal-impact {
  background: rgba(17, 17, 24, 0.8);
  border: 1px solid var(--dm-border);
  border-radius: 2px;
  padding: 0.75rem 1rem;
}
.delete-modal-impact-label {
  display: block;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--dm-accent);
  margin-bottom: 0.5rem;
  font-family: ui-monospace, monospace;
}
.delete-modal-impact-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8rem;
  color: var(--dm-text-bright);
  line-height: 1.6;
}
.delete-modal-impact-n {
  font-family: ui-monospace, monospace;
  color: var(--dm-accent);
  font-weight: 600;
  margin-right: 0.25rem;
}
.delete-modal-err {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: var(--dm-danger);
}
.delete-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--dm-border);
  background: rgba(17, 17, 24, 0.4);
}
.delete-modal-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
  border: 1px solid transparent;
}
.delete-modal-btn--ghost {
  background: transparent;
  color: var(--dm-text);
  border-color: var(--dm-border);
}
.delete-modal-btn--ghost:hover:not(:disabled) {
  color: var(--dm-text-bright);
  background: rgba(0, 229, 160, 0.08);
  border-color: rgba(0, 229, 160, 0.25);
}
.delete-modal-btn--danger {
  background: rgba(239, 68, 68, 0.2);
  color: var(--dm-danger);
  border-color: rgba(239, 68, 68, 0.5);
}
.delete-modal-btn--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 16px var(--dm-danger-glow);
}
.delete-modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
