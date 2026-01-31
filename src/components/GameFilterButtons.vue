<script setup lang="ts">
interface GameType {
  id: string;
  name: string;
  iconClass: string;
}

interface Props {
  gameTypes: GameType[];
  activeFilter: string;
  getGameIcon: (iconClass: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:activeFilter': [filterId: string];
}>();

const setActiveFilter = (filterId: string) => {
  emit('update:activeFilter', filterId);
};
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <button
      v-for="game in gameTypes.filter(g => g.id !== 'all')"
      :key="game.id"
      :class="[
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
        activeFilter === game.id
          ? 'bg-neutral-700 border-neutral-600 text-white shadow-md'
          : 'bg-neutral-800/60 border-neutral-700/50 hover:border-neutral-600 text-neutral-300 hover:bg-neutral-800'
      ]"
      @click="setActiveFilter(game.id)"
    >
      <div
        class="w-6 h-6 rounded bg-cover bg-center"
        :style="{ backgroundImage: getGameIcon(game.iconClass) }"
      />
      <div class="text-sm font-medium hidden sm:block">
        {{ game.name }}
      </div>
    </button>
  </div>
</template>
