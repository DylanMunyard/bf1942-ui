<template>
  <div class="empty-state">
    <div class="empty-content">
      <div class="ascii-art">
        <span class="icon-text">{{ icon }}</span>
      </div>
      <div class="terminal-output">
        <div class="output-line">
          <span class="prompt">&gt;</span>
          <span class="command">query {{ title.toLowerCase().replace(/_/g, ' ') }}</span>
        </div>
        <div class="output-line result">
          <span class="response"># {{ title }}</span>
        </div>
      </div>
      <p class="description">
        {{ description }}
      </p>
      <button
        v-if="actionText"
        class="action-btn"
        @click="$emit('action')"
      >
        {{ actionText }}
      </button>
    </div>
    <div class="corner-brackets">
      <span class="corner tl">[</span>
      <span class="corner tr">]</span>
      <span class="corner bl">[</span>
      <span class="corner br">]</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  actionText?: string;
  icon: string;
}>();

defineEmits<{
  action: [];
}>();
</script>

<style scoped>
.empty-state {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 2rem 1.5rem;
  text-align: center;
  border: 1px dashed #30363d;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.8) 0%, rgba(22, 27, 34, 0.4) 100%);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  transition: all 0.3s ease;
}

.empty-state:hover {
  border-color: rgba(0, 255, 242, 0.3);
  background: linear-gradient(135deg, rgba(0, 255, 242, 0.02) 0%, rgba(13, 17, 23, 0.8) 100%);
}

.empty-content {
  position: relative;
  z-index: 1;
  max-width: 280px;
}

/* ASCII Art Icon */
.ascii-art {
  margin-bottom: 1rem;
}

.icon-text {
  font-size: 2rem;
  font-weight: 700;
  color: #6e7681;
  text-shadow: 0 0 20px rgba(0, 255, 242, 0.2);
}

/* Terminal Output Style */
.terminal-output {
  margin-bottom: 0.75rem;
  text-align: left;
}

.output-line {
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  line-height: 1.6;
}

.prompt {
  color: #39ff14;
  flex-shrink: 0;
}

.command {
  color: #8b949e;
}

.result .response {
  color: #00fff2;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Description */
.description {
  color: #6e7681;
  margin: 0 0 1.25rem 0;
  font-size: 0.75rem;
  line-height: 1.6;
}

/* Action Button */
.action-btn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(0, 255, 242, 0.4);
  border-radius: 4px;
  color: #00fff2;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 255, 242, 0.1);
  border-color: #00fff2;
  box-shadow: 0 0 20px rgba(0, 255, 242, 0.2);
  transform: translateY(-1px);
}

/* Corner Brackets */
.corner-brackets {
  position: absolute;
  inset: 8px;
  pointer-events: none;
}

.corner {
  position: absolute;
  font-size: 1rem;
  color: #30363d;
  transition: color 0.3s ease;
}

.empty-state:hover .corner {
  color: rgba(0, 255, 242, 0.3);
}

.corner.tl { top: 0; left: 0; }
.corner.tr { top: 0; right: 0; }
.corner.bl { bottom: 0; left: 0; }
.corner.br { bottom: 0; right: 0; }

/* Mobile */
@media (max-width: 480px) {
  .empty-state {
    min-height: 150px;
    padding: 1.5rem 1rem;
  }

  .icon-text {
    font-size: 1.5rem;
  }

  .output-line {
    font-size: 0.65rem;
  }

  .description {
    font-size: 0.7rem;
  }

  .action-btn {
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
  }
}
</style>
