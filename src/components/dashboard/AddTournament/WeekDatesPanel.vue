<template>
  <!-- Week Dates Panel -->
  <div class="border-t border-slate-700/30 pt-6">
    <!-- Collapsible Panel Header -->
    <button
      type="button"
      class="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all group"
      @click="isExpanded = !isExpanded"
    >
      <span class="text-lg">📅</span>
      <span class="text-sm font-medium text-slate-300 flex-1 text-left">
        Tournament Weeks <span class="text-slate-500">(Optional)</span>
      </span>
      <span v-if="modelValue.length > 0" class="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-1 rounded">
        {{ modelValue.length }} week{{ modelValue.length !== 1 ? 's' : '' }}
      </span>
      <svg
        class="w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:text-slate-300"
        :class="isExpanded ? 'rotate-0' : '-rotate-90'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>

    <!-- Panel Content -->
    <div v-if="isExpanded" class="space-y-4">
      <p class="text-xs text-slate-500">
        Add week dates to organize your tournament schedule
      </p>
      <button
        type="button"
        @click="addWeek"
        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-colors"
      >
        + Add Week
      </button>

      <!-- Week Dates List -->
      <div v-if="modelValue.length > 0" class="space-y-2 mb-4">
        <div
          v-for="(week, index) in modelValue"
          :key="index"
          class="flex items-center justify-between gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg"
        >
          <div class="flex-1">
            <div class="text-sm font-medium text-slate-200">{{ week.week }}</div>
            <div class="text-xs text-slate-400 mt-1">
              {{ week.startDate }} to {{ week.endDate }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="editWeek(index)"
              class="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
              title="Edit week"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              @click="deleteWeek(index)"
              class="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
              title="Delete week"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Week Form Modal -->
      <div v-if="showWeekForm" class="mb-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Week Name</label>
          <input
            v-model="editingWeekData.week"
            type="text"
            placeholder="e.g., Week 1"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
            <input
              v-model="editingWeekData.startDate"
              type="date"
              class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">End Date</label>
            <input
              v-model="editingWeekData.endDate"
              type="date"
              class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="saveWeek"
            class="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-colors"
          >
            Save Week
          </button>
          <button
            type="button"
            @click="showWeekForm = false"
            class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface WeekDate {
  id?: number;
  week: string;
  startDate: string;
  endDate: string;
}

interface Props {
  modelValue: WeekDate[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: WeekDate[]];
}>();

// Panel state
const isExpanded = ref(false);

// Week form state
const showWeekForm = ref(false);
const editingWeekIndex = ref<number | null>(null);
const editingWeekData = ref<{ week: string; startDate: string; endDate: string }>({
  week: '',
  startDate: '',
  endDate: ''
});

// Week management functions
const addWeek = () => {
  editingWeekIndex.value = null;
  editingWeekData.value = { week: '', startDate: '', endDate: '' };
  showWeekForm.value = true;
};

const editWeek = (index: number) => {
  editingWeekIndex.value = index;
  const week = props.modelValue[index];
  editingWeekData.value = {
    week: week.week,
    startDate: week.startDate,
    endDate: week.endDate
  };
  showWeekForm.value = true;
};

const deleteWeek = (index: number) => {
  const updatedWeeks = [...props.modelValue];
  updatedWeeks.splice(index, 1);
  emit('update:modelValue', updatedWeeks);
};

const saveWeek = () => {
  if (!editingWeekData.value.week || !editingWeekData.value.startDate || !editingWeekData.value.endDate) {
    // Simple validation - could emit an error event if needed
    return;
  }

  const updatedWeeks = [...props.modelValue];

  if (editingWeekIndex.value !== null) {
    // Update existing week
    updatedWeeks[editingWeekIndex.value] = { ...editingWeekData.value };
  } else {
    // Add new week
    updatedWeeks.push({ ...editingWeekData.value });
  }

  emit('update:modelValue', updatedWeeks);

  // Reset form
  showWeekForm.value = false;
  editingWeekIndex.value = null;
  editingWeekData.value = { week: '', startDate: '', endDate: '' };
};
</script>
