<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ServerSummary } from '../types/server';
import { fetchAllServers } from '../services/serverDetailsService';
import TimeDisplay from './TimeDisplay.vue';
import { queryAI } from '../services/aiService';
import { marked } from 'marked';

// Router
const router = useRouter();
const route = useRoute();

// Props from router
interface Props {
  initialMode?: 'FH2' | '42' | 'BFV';
}

const props = defineProps<Props>();

// Define emits
const emit = defineEmits<{
  'show-players': [server: ServerSummary]
}>();

// Function to format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const servers = ref<ServerSummary[]>([]);
const loading = ref(true);
const updating = ref(false);
const tabSwitchLoading = ref(false);
const error = ref<string | null>(null);
const refreshTimer = ref<number | null>(null);
const serverMode = ref<'42' | 'FH2' | 'BFV'>(props.initialMode || '42');

// AI Chat state
const showAIChatModal = ref(false);
const aiQuestion = ref('');
const aiResponse = ref('');
const aiLoading = ref(false);
const lastQuestion = ref('');

// Server filter state
const serverFilter = ref('');

// Computed property for filtered servers
const filteredServers = computed(() => {
  if (!serverFilter.value.trim()) {
    return servers.value;
  }
  return servers.value.filter(server => 
    server.name.toLowerCase().includes(serverFilter.value.toLowerCase())
  );
});

watch(() => props.initialMode, (newMode) => {
  if (newMode) {
    if (serverMode.value !== newMode) {
      serverMode.value = newMode;
      fetchServerData(true); // Tab switch is considered manual
    }
  }
}, { immediate: true });


const fetchServerData = async (isManualRefresh: boolean = false) => {
  if (servers.value.length > 0 && isManualRefresh) {
    updating.value = true;
  } else if (servers.value.length === 0) {
    loading.value = true;
  }
  error.value = null;
  if (isManualRefresh) {
    tabSwitchLoading.value = true;
  }

  try {
    const game = serverMode.value === '42' ? 'bf1942' : serverMode.value === 'FH2' ? 'fh2' : 'bfvietnam';
    servers.value = await fetchAllServers(game);
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.';
    console.error(err);
  } finally {
    loading.value = false;
    updating.value = false;
    tabSwitchLoading.value = false;
  }
};

const joinServer = (server: ServerSummary) => {
  const newWindow = window.open(server.joinLink, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.blur();
    window.focus();
  }
};

const showPlayers = (server: ServerSummary) => {
  emit('show-players', server);
};

onMounted(() => {
  fetchServerData(true); // Initial load is considered manual
  refreshTimer.value = window.setInterval(() => {
    fetchServerData(false); // Auto-refresh is not manual
  }, 15000);
});

const renderMarkdown = (text: string): string => {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  return marked(text) as string;
};

// AI Chat functions
const openAIChatModal = () => {
  showAIChatModal.value = true;
};

const closeAIChatModal = () => {
  showAIChatModal.value = false;
};

const submitAIQuestion = async () => {
  if (!aiQuestion.value.trim()) return;

  aiLoading.value = true;
  try {
    lastQuestion.value = aiQuestion.value;
    aiResponse.value = await queryAI(aiQuestion.value);
    aiQuestion.value = '';
  } catch (error) {
    aiResponse.value = 'Sorry, I encountered an error while processing your question.';
    console.error('AI query error:', error);
  } finally {
    aiLoading.value = false;
  }
};

onUnmounted(() => {
  if (refreshTimer.value !== null) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
});
</script>

<template>
  <div class="server-table-container">
    <div class="tabs-container">
      <div class="tabs">
        <router-link
          to="/servers/bf1942"
          class="tab"
          active-class="active"
        >
          <div class="tab-content">
            <i class="tab-icon icon-bf1942" />
            <span>BF1942</span>
          </div>
        </router-link>
        <router-link
          to="/servers/fh2"
          class="tab"
          active-class="active"
        >
          <div class="tab-content">
            <i class="tab-icon icon-fh2" />
            <span>FH2</span>
          </div>
        </router-link>
        <router-link
          to="/servers/bfv"
          class="tab"
          active-class="active"
        >
          <div class="tab-content">
            <i class="tab-icon icon-bfv" />
            <span>BFV</span>
          </div>
        </router-link>
      </div>
      <div class="header-right">
        <TimeDisplay />
        <button
          class="ai-chat-button"
          @click="openAIChatModal"
        >
          <span>Metrics Chat</span>
        </button>
        <button
          class="update-button"
          @click="() => fetchServerData(true)"
        >
          <span v-if="!updating">Update</span>
          <span
            v-else
            class="spinner"
          />
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      Loading server data...
    </div>
    <div
      v-else-if="error"
      class="error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="servers.length > 0"
      class="server-info"
    >
      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-container">
          <input
            v-model="serverFilter"
            placeholder="Filter servers..."
            class="server-filter-input"
          >
          <button
            v-if="serverFilter"
            class="clear-filter-button"
            title="Clear filter"
            @click="serverFilter = ''"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Compact server list -->
      <div class="server-list-container">
        <div
          v-for="server in filteredServers"
          :key="server.guid"
          class="server-row"
        >
          <div class="server-main-info">
            <router-link
              :to="`/servers/${encodeURIComponent(server.name)}`"
              class="server-name"
            >
              {{ server.name }}
            </router-link>
            <div class="server-metrics">
              <span class="time-remaining">{{ formatTime(server.roundTimeRemain) }}</span>
              <span class="tickets">{{ server.tickets1 }} | {{ server.tickets2 }}</span>
            </div>
          </div>
          
          <div class="server-details-row">
            <div class="detail-group players-group" @click="showPlayers(server)">
              <span class="detail-label">Players</span>
              <span class="detail-value players-value">{{ server.numPlayers }}/{{ server.maxPlayers }}</span>
            </div>
            
            <div class="detail-group map-group">
              <span class="detail-label">Map</span>
              <span class="detail-value map-value">{{ server.mapName }}</span>
            </div>
            
            <div class="detail-group connection-group">
              <span class="detail-label">Connect</span>
              <span class="detail-value connection-value">{{ server.ip }}:{{ server.port }}</span>
            </div>
            
            <div class="detail-group gametype-group">
              <span class="detail-label">Mode</span>
              <span class="detail-value gametype-value">{{ server.gameType }}</span>
            </div>
          </div>
          
          <div class="server-actions">
            <button
              class="join-button"
              @click="joinServer(server)"
            >
              Join
            </button>
          </div>
        </div>
        
        <div
          v-if="tabSwitchLoading"
          class="loading-overlay"
        >
          <div class="loading-spinner" />
          <div class="loading-text">
            Loading data...
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Chat Modal -->
    <div
      v-if="showAIChatModal"
      class="modal-overlay"
      @click="closeAIChatModal"
    >
      <div
        class="modal-content ai-chat-modal"
        @click.stop
      >
        <div class="modal-header">
          <h2>Metrics Chat</h2>
          <button
            class="close-button"
            @click="closeAIChatModal"
          >
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="ai-chat-container">
            <div class="ai-response-container">
              <div
                v-if="aiResponse"
                class="ai-response"
              >
                <div class="ai-question">
                  <strong>Question:</strong> {{ lastQuestion }}
                </div>
                <div class="ai-answer">
                  <strong>Answer:</strong> <span v-html="renderMarkdown(aiResponse)" />
                </div>
              </div>
              <div
                v-else
                class="ai-response-placeholder"
              >
                Ask me anything about server metrics!
              </div>
            </div>
            <div class="ai-input-container">
              <input
                v-model="aiQuestion"
                placeholder="Ask a question about metrics..."
                class="ai-input"
                :disabled="aiLoading"
                @keyup.enter="submitAIQuestion"
              >
              <button
                class="ai-submit-button"
                :disabled="aiLoading || !aiQuestion.trim()"
                @click="submitAIQuestion"
              >
                <span v-if="!aiLoading">Ask</span>
                <span
                  v-else
                  class="spinner"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-table-container {
  background: var(--color-background);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .server-table-container {
    padding: 8px;
    margin-right: -8px;
    margin-left: -8px;
    border-radius: 0;
  }
}

.tabs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .tabs-container {
    margin-bottom: 12px;
  }
}

.tabs {
  display: flex;
  gap: 2px;
}

.tab {
  padding: 12px 24px;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  border: 1px solid var(--color-border);
  border-bottom: none;
  transition: all 0.2s ease;
  text-decoration: none;
}

@media (max-width: 768px) {
  .tab {
    padding: 8px 16px;
    font-size: 14px;
  }
}

.tab:hover {
  background-color: var(--color-background-mute);
}

.tab.active {
  background-color: var(--color-background);
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  position: relative;
  z-index: 1;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
  overflow: hidden;
}

.icon-bf1942 {
  background-image: url('../assets/bf1942.jpg');
}

.icon-fh2 {
  background-image: url('../assets/fh2.jpg');
}
.icon-bfv {
  background-image: url('../assets/bfv.jpg');
}

@media (max-width: 768px) {
  .tab-icon {
    width: 16px;
    height: 16px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-right {
    gap: 8px;
  }
}

.ai-chat-button {
  padding: 8px 16px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-weight: bold;
  border: 2px solid var(--color-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.update-button {
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

@media (max-width: 768px) {
  .ai-chat-button,
  .update-button {
    padding: 6px 12px;
    font-size: 14px;
  }
  
  .ai-chat-button span,
  .update-button span {
    display: none;
  }
  
  .ai-chat-button::after {
    content: "💬";
  }
  
  .update-button::after {
    content: "🔄";
  }
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

/* Filter bar styles */
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.filter-container {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 300px;
}

.server-filter-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s ease;
  padding-right: 32px;
}

.clear-filter-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-filter-button:hover {
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.server-filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.server-filter-input::placeholder {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .filter-container {
    max-width: 100%;
  }
  
  .server-filter-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* Compact server list styles */
.server-list-container {
  position: relative;
}

.server-row {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.server-row:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .server-row {
    padding: 10px;
    margin-bottom: 6px;
  }
}

.server-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .server-main-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 6px;
  }
}

.server-name {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: color 0.2s ease;
}

.server-name:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .server-name {
    font-size: 14px;
  }
}

.server-metrics {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .server-metrics {
    gap: 8px;
    font-size: 12px;
  }
}

.time-remaining {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.tickets {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.server-details-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .server-details-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 6px;
  }
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .detail-label {
    font-size: 10px;
  }
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .detail-value {
    font-size: 13px;
  }
}

/* Color-coded detail values */
.players-group {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
}

.players-group:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.players-value {
  color: #4CAF50;
  font-weight: 600;
}

.map-value {
  color: #FF9800;
  font-weight: 500;
}

.connection-value {
  color: #2196F3;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

@media (max-width: 768px) {
  .connection-value {
    font-size: 11px;
  }
}

.gametype-value {
  color: #9C27B0;
  font-weight: 500;
}

.server-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .server-actions {
    margin-top: 8px;
  }
}

.join-button {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.join-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
}

.join-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .join-button {
    padding: 6px 12px;
    font-size: 12px;
    width: 100%;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--color-primary-rgb), 0.1);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 8px;
}

.loading-text {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-background);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: var(--color-text);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.ai-chat-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-response-container {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 15px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

.ai-input-container {
  display: flex;
  gap: 10px;
}

.ai-input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.ai-submit-button {
  padding: 10px 20px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
