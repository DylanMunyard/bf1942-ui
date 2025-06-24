<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerComparison } from '@/composables/usePlayerComparison';

interface Props {
  name: string;
  source?: string;
  clickable?: boolean;
  showCompareIcon?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showCompareIcon: true,
  class: ''
});

const { selectedPlayers, canAddPlayer, addPlayer } = usePlayerComparison();

const isSelected = computed(() => 
  selectedPlayers.value.some(p => p.name === props.name)
);

const canSelect = computed(() => 
  props.clickable && canAddPlayer.value && !isSelected.value
);

const handleClick = (event: MouseEvent) => {
  if (!props.clickable) return;
  
  // Prevent default link behavior if this is inside a link
  event.preventDefault();
  event.stopPropagation();
  
  if (canSelect.value) {
    addPlayer(props.name, props.source);
  }
};

const getTooltipText = () => {
  if (!props.clickable) return '';
  if (isSelected.value) return 'Already selected for comparison';
  if (!canAddPlayer.value) return 'Maximum 2 players can be selected';
  return 'Click to add to player comparison';
};

const containerClass = computed(() => {
  const classes = ['player-name-container'];
  
  if (props.class) {
    classes.push(props.class);
  }
  
  if (props.clickable) {
    classes.push('clickable');
  }
  
  if (isSelected.value) {
    classes.push('selected');
  }
  
  if (canSelect.value) {
    classes.push('selectable');
  }
  
  return classes.join(' ');
});
</script>

<template>
  <span 
    :class="containerClass"
    @click="handleClick"
    :title="getTooltipText()"
  >
    <span class="player-name-text">{{ name }}</span>
    <span 
      v-if="showCompareIcon && clickable" 
      class="compare-icon"
      :class="{ 'visible': canSelect || isSelected }"
    >
      {{ isSelected ? '✓' : '⚡' }}
    </span>
  </span>
</template>

<style scoped>
.player-name-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.player-name-text {
  color: inherit;
  font-weight: inherit;
  transition: all 0.2s ease;
}

.player-name-container.clickable {
  cursor: pointer;
  user-select: none;
}

.player-name-container.selectable:hover {
  color: var(--color-primary);
  transform: translateY(-1px);
}

.player-name-container.selectable:hover .player-name-text {
  text-decoration: underline;
}

.player-name-container.selected {
  color: var(--color-primary);
  font-weight: 600;
  background: rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.compare-icon {
  font-size: 0.8rem;
  opacity: 0;
  transition: all 0.2s ease;
  color: var(--color-primary);
}

.compare-icon.visible {
  opacity: 1;
}

.player-name-container.selected .compare-icon {
  opacity: 1;
  color: var(--color-primary);
}

.player-name-container.selectable:hover .compare-icon {
  opacity: 1;
  transform: scale(1.2);
}

/* Animation for selection */
.player-name-container.selected {
  animation: selectPulse 0.3s ease-out;
}

@keyframes selectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Disable selection when max players reached */
.player-name-container:not(.selectable):not(.selected).clickable {
  cursor: not-allowed;
  opacity: 0.6;
}

.player-name-container:not(.selectable):not(.selected).clickable:hover {
  color: var(--color-text-muted);
  transform: none;
}
</style>