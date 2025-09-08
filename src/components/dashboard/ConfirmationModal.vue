<template>
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001]"
    @click="$emit('cancel')"
  >
    <div
      class="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl max-w-sm w-[90%] overflow-hidden"
      @click.stop
    >
      <div class="p-6 pb-4">
        <p class="text-white m-0 text-base font-medium text-center">
          {{ message }}?
        </p>
      </div>
      <div class="flex justify-center gap-3 px-6 py-4 bg-slate-800/20 border-t border-slate-700/50">
        <button
          class="px-5 py-2 rounded-lg bg-transparent text-slate-400 border border-slate-700/50 font-medium text-sm cursor-pointer transition-all duration-200 hover:bg-slate-700/50 hover:text-white"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="px-5 py-2 rounded-lg bg-red-600 text-white border border-red-600 font-medium text-sm cursor-pointer transition-all duration-200 hover:bg-red-700 hover:border-red-700"
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
@media (max-width: 480px) {
  .max-w-sm {
    max-width: 280px !important;
    width: 95% !important;
  }
  
  .p-6.pb-4 {
    padding: 16px 20px 12px !important;
  }
  
  .px-6.py-4 {
    padding: 12px 20px 16px !important;
  }
  
  .px-5.py-2 {
    padding: 8px 16px !important;
    font-size: 0.8rem !important;
  }
}
</style>