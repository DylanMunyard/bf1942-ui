<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { ServerInfo } from '../types/server';
import TimeDisplay from './TimeDisplay.vue';
import { queryAI } from '../services/aiService';
import { marked } from 'marked';

// Router
const router = useRouter();
const route = useRoute();

// Props from router
interface Props {
  initialMode?: 'FH2' | '42';
}

const props = defineProps<Props>();

// Function to format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const servers = ref<ServerInfo[]>([]);
const loading = ref(true);
const updating = ref(false);
const tabSwitchLoading = ref(false);
const error = ref<string | null>(null);
const refreshTimer = ref<number | null>(null);
const serverMode = ref<'42' | 'FH2'>(props.initialMode || '42');

// AI Chat state
const showAIChatModal = ref(false);
const aiQuestion = ref('');
const aiResponse = ref('');
const aiLoading = ref(false);
const lastQuestion = ref('');

watch(() => props.initialMode, (newMode) => {
  if (newMode) {
    if (serverMode.value !== newMode) {
      serverMode.value = newMode;
      fetchServerData();
    }
  }
}, { immediate: true });


const fetchServerData = async () => {
  if (servers.value.length > 0) {
    updating.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;
  tabSwitchLoading.value = true;

  try {
    const apiUrl = serverMode.value === '42'
      ? 'https://api.bflist.io/bf1942/v1/servers/1?perPage=100'
      : 'https://api.bflist.io/fh2/v1/servers/1?perPage=100';

    const response = await axios.get<ServerInfo[]>(apiUrl);
    servers.value = response.data;
    servers.value.sort((a, b) => b.numPlayers - a.numPlayers);
  } catch (err) {
    error.value = 'Failed to fetch server data. Please try again.';
    console.error(err);
  } finally {
    loading.value = false;
    updating.value = false;
    tabSwitchLoading.value = false;
  }
};

const joinServer = (server: ServerInfo) => {
  const newWindow = window.open(server.joinLink, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.blur();
    window.focus();
  }
};

onMounted(() => {
  fetchServerData();
  refreshTimer.value = window.setInterval(() => {
    fetchServerData();
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
          BF1942
        </router-link>
        <router-link
          to="/servers/fh2"
          class="tab"
          active-class="active"
        >
          FH2
        </router-link>
      </div>
      <div class="header-right">
        <TimeDisplay />
        <button @click="openAIChatModal" class="ai-chat-button">
          <span>Metrics Chat</span>
        </button>
        <button @click="fetchServerData" class="update-button">
          <span v-if="!updating">Update</span>
          <span v-else class="spinner"></span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading server data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="servers.length > 0" class="server-info">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Server Name</th>
              <th>Players</th>
              <th>Map</th>
              <th>Game Type</th>
              <th>Join</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in servers" :key="server.guid">
              <td>
                <router-link :to="`/servers/${encodeURIComponent(server.name)}`" class="server-name-link">
                  {{ server.name }}
                </router-link>
                ({{ formatTime(server.roundTimeRemain) }} | {{ server.tickets1 }} | {{ server.tickets2 }})
              </td>
              <td>
                {{ server.numPlayers }} / {{ server.maxPlayers }}
              </td>
              <td>{{ server.mapName }}</td>
              <td>{{ server.gameType }}</td>
              <td>
                <a href="#" @click.prevent="joinServer(server)" class="join-link">Join Server</a>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="tabSwitchLoading" class="table-loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading data...</div>
        </div>
      </div>
    </div>

    <!-- Metrics Chat Modal -->
    <div v-if="showAIChatModal" class="modal-overlay" @click="closeAIChatModal">
      <div class="modal-content ai-chat-modal" @click.stop>
        <div class="modal-header">
          <h2>Metrics Chat</h2>
          <button @click="closeAIChatModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="ai-chat-container">
            <div class="ai-response-container">
              <div v-if="aiResponse" class="ai-response">
                <div class="ai-question">
                  <strong>Question:</strong> {{ lastQuestion }}
                </div>
                <div class="ai-answer">
                  <strong>Answer:</strong> <span v-html="renderMarkdown(aiResponse)"></span>
                </div>
              </div>
              <div v-else class="ai-response-placeholder">
                Ask me anything about server metrics!
              </div>
            </div>
            <div class="ai-input-container">
              <input
                v-model="aiQuestion"
                @keyup.enter="submitAIQuestion"
                placeholder="Ask a question about metrics..."
                class="ai-input"
                :disabled="aiLoading"
              />
              <button
                @click="submitAIQuestion"
                class="ai-submit-button"
                :disabled="aiLoading || !aiQuestion.trim()"
              >
                <span v-if="!aiLoading">Ask</span>
                <span v-else class="spinner"></span>
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
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tabs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
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

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
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

.loading, .error {
  padding: 20px;
  text-align: center;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  background-color: var(--color-background-mute);
}

.server-name-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.join-link {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 4px;
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

.table-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(var(--color-primary-rgb, 33, 150, 243), 0.3);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
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
