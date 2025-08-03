<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerComparison } from '@/composables/usePlayerComparison';

interface Props {
  name: string;
  source?: string;
  serverGuid?: string;
  clickable?: boolean;
  showCompareIcon?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showCompareIcon: true,
  class: '',
  serverGuid: undefined
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
    addPlayer(props.name, props.source, props.serverGuid);
  }
};

const handleCompareClick = (event: MouseEvent) => {
  if (!props.clickable) return;
  
  // Prevent event from bubbling up to parent link
  event.preventDefault();
  event.stopPropagation();
  
  if (canSelect.value) {
    addPlayer(props.name, props.source, props.serverGuid);
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
  
  if (isSelected.value) {
    classes.push('selected');
  }
  
  return classes.join(' ');
});
</script>

<template>
  <span 
    :class="containerClass"
    :title="getTooltipText()"
  >
    <span class="player-name-text">{{ name }}</span>
    <span 
      v-if="showCompareIcon && clickable" 
      class="compare-icon"
      :class="{ 'visible': canSelect || isSelected }"
      :title="canSelect ? 'Click to add to player comparison' : (isSelected ? 'Already selected for comparison' : 'Maximum 2 players can be selected')"
      @click="handleCompareClick"
    >
      <span v-if="isSelected">✓</span>
      <span
        v-else
        class="fencer-pair"
      >
        <span class="fencer flipped">🤺</span>
        <span class="fencer">🤺</span>
      </span>
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


.player-name-container.selected {
  color: var(--color-primary);
  font-weight: 600;
  background: rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
}

.compare-icon {
  font-size: 1.3rem;
  opacity: 0;
  transition: all 0.2s ease;
  color: var(--color-primary);
  cursor: pointer;
}

.fencer-pair {
  display: inline-flex;
  gap: 2px;
}

.fencer {
  font-size: 1rem;
}

.fencer.flipped {
  transform: scaleX(-1);
}

.compare-icon.visible {
  opacity: 1;
}

.player-name-container.selected .compare-icon {
  opacity: 1;
  color: var(--color-primary);
}

.compare-icon:hover {
  opacity: 1 !important;
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
</style>