<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Define timezones for each region
const timezones = {
  france: 'Europe/Paris',
  usEast: 'America/New_York',
  usWest: 'America/Los_Angeles'
};

// Initialize time refs
const franceTime = ref('');
const usEastTime = ref('');
const usWestTime = ref('');

// Timer reference for cleanup
const timer = ref<number | null>(null);

// Function to update all times
const updateTimes = () => {
  const now = new Date();
  
  // Format time for France
  franceTime.value = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezones.france
  }).format(now);
  
  // Format time for US East
  usEastTime.value = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezones.usEast
  }).format(now);
  
  // Format time for US West
  usWestTime.value = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezones.usWest
  }).format(now);
};

// Set up timer on component mount
onMounted(() => {
  // Update times immediately
  updateTimes();
  
  // Update times every minute
  timer.value = window.setInterval(updateTimes, 60000);
});

// Clean up timer on component unmount
onUnmounted(() => {
  if (timer.value !== null) {
    clearInterval(timer.value);
    timer.value = null;
  }
});
</script>

<template>
  <div class="time-display">
    <div class="time-item">
      <span class="icon">🇫🇷</span>
      <span class="time">{{ franceTime }}</span>
    </div>
    <div class="time-item">
      <span class="icon">🇺🇸</span>
      <span class="label">East</span>
      <span class="time">{{ usEastTime }}</span>
    </div>
    <div class="time-item">
      <span class="icon">🇺🇸</span>
      <span class="label">West</span>
      <span class="time">{{ usWestTime }}</span>
    </div>
  </div>
</template>

<style scoped>
.time-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.icon {
  font-size: 16px;
}

.label {
  font-size: 12px;
  color: #666;
}

.time {
  font-weight: bold;
}

@media (max-width: 768px) {
  .time-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>