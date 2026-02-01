<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="ai-drawer-backdrop"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="ai-drawer" @click.stop>
          <!-- Terminal Bar -->
          <div class="terminal-bar">
            <div class="terminal-dots">
              <span class="dot dot-red" />
              <span class="dot dot-yellow" />
              <span class="dot dot-green" />
            </div>
            <span class="terminal-title">bfstats-ai</span>
            <button
              type="button"
              class="btn-close"
              aria-label="Close chat"
              @click="$emit('update:modelValue', false)"
            >
              [x]
            </button>
          </div>

          <!-- Header -->
          <div class="drawer-header">
            <h3 class="drawer-title">AI Assistant</h3>
            <p class="drawer-subtitle">// Type @ for players, # for servers</p>
          </div>

          <!-- Messages -->
          <div ref="messagesContainer" class="messages-container">
            <div v-if="messages.length === 0" class="welcome-message">
              <p>Hello! I can help you with:</p>
              <ul>
                <li>Player statistics and comparisons</li>
                <li>Server activity and leaderboards</li>
                <li>Finding when games happen</li>
                <li>Understanding your performance</li>
              </ul>
              <div class="tip-box">
                <strong>Tip:</strong> Type <code>@</code> to search for players or <code>#</code> to search for servers
              </div>
              <p v-if="context.playerName || context.serverGuid" class="context-hint">
                <span v-if="context.playerName">Current player: <strong>{{ context.playerName }}</strong></span>
                <span v-if="context.serverGuid">Current server: <strong>{{ context.serverGuid }}</strong></span>
              </p>
            </div>

            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message"
              :class="msg.role"
            >
              <div class="message-content">
                <span class="message-role">{{ msg.role === 'user' ? '>' : '$' }}</span>
                <span class="message-text" v-html="formatMessage(msg.content)" />
              </div>
            </div>

            <div v-if="isLoading" class="message assistant loading">
              <div class="message-content">
                <span class="message-role">$</span>
                <span class="message-text">{{ streamingContent || 'Thinking...' }}</span>
                <span class="cursor" />
              </div>
            </div>
          </div>

          <!-- Autocomplete Dropdown -->
          <div v-if="showAutocomplete" class="autocomplete-container">
            <div class="autocomplete-header">
              {{ autocompleteType === 'player' ? 'Players' : 'Servers' }}
              <span v-if="isSearching" class="searching-indicator">searching...</span>
            </div>
            <div class="autocomplete-list">
              <div
                v-for="(item, index) in autocompleteResults"
                :key="item.id"
                class="autocomplete-item"
                :class="{ selected: index === selectedAutocompleteIndex }"
                @click="selectAutocompleteItem(item)"
                @mouseenter="selectedAutocompleteIndex = index"
              >
                <span class="item-icon">{{ autocompleteType === 'player' ? '@' : '#' }}</span>
                <span class="item-name">{{ item.name }}</span>
                <span v-if="item.detail" class="item-detail">{{ item.detail }}</span>
              </div>
              <div v-if="autocompleteResults.length === 0 && !isSearching" class="autocomplete-empty">
                No results found
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="input-container">
            <div class="input-wrapper">
              <span class="input-prompt">></span>
              <input
                ref="inputRef"
                v-model="inputMessage"
                type="text"
                placeholder="Ask a question... (@ for players, # for servers)"
                :disabled="isLoading"
                @keydown="handleKeydown"
                @input="handleInput"
              />
              <button
                class="send-button"
                :disabled="isLoading || !canSend"
                @click="sendMessage"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p v-if="error" class="error-message">{{ error }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { streamChat, type ChatMessage, type PageContext } from '@/services/aiChatService';
import { searchPlayersForMention, searchServersForMention, type MentionResult } from '@/services/aiChatService';

interface MentionData {
  type: 'player' | 'server';
  name: string;
  id: string;
}

// Store mention data keyed by name for lookup when sending
const mentionRegistry = new Map<string, MentionData>();

interface Props {
  modelValue: boolean;
  context?: PageContext;
}

const props = withDefaults(defineProps<Props>(), {
  context: () => ({}),
});

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const inputMessage = ref('');
const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);
const streamingContent = ref('');
const error = ref('');

// Autocomplete state
const showAutocomplete = ref(false);
const autocompleteType = ref<'player' | 'server'>('player');
const autocompleteResults = ref<MentionResult[]>([]);
const selectedAutocompleteIndex = ref(0);
const isSearching = ref(false);
const mentionStartIndex = ref(-1);
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const canSend = computed(() => {
  return inputMessage.value.trim().length > 0;
});

// Focus input when drawer opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// Scroll to bottom when messages change
watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

watch(streamingContent, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function handleInput() {
  const input = inputMessage.value;
  const cursorPos = inputRef.value?.selectionStart ?? input.length;

  // Check for @ or # trigger
  const lastAt = input.lastIndexOf('@', cursorPos - 1);
  const lastHash = input.lastIndexOf('#', cursorPos - 1);

  const triggerIndex = Math.max(lastAt, lastHash);

  if (triggerIndex >= 0) {
    const textAfterTrigger = input.slice(triggerIndex + 1, cursorPos);
    // Only show autocomplete if there's no space before cursor in the query
    if (!textAfterTrigger.includes(' ')) {
      mentionStartIndex.value = triggerIndex;
      autocompleteType.value = input[triggerIndex] === '@' ? 'player' : 'server';
      showAutocomplete.value = true;
      selectedAutocompleteIndex.value = 0;

      // Debounce search
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      if (textAfterTrigger.length >= 2) {
        isSearching.value = true;
        searchDebounceTimer = setTimeout(() => {
          performSearch(textAfterTrigger);
        }, 200);
      } else {
        autocompleteResults.value = [];
        isSearching.value = false;
      }
      return;
    }
  }

  showAutocomplete.value = false;
  autocompleteResults.value = [];
}

async function performSearch(query: string) {
  try {
    if (autocompleteType.value === 'player') {
      autocompleteResults.value = await searchPlayersForMention(query);
    } else {
      autocompleteResults.value = await searchServersForMention(query);
    }
  } catch (err) {
    console.error('Search error:', err);
    autocompleteResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (showAutocomplete.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedAutocompleteIndex.value = Math.min(
        selectedAutocompleteIndex.value + 1,
        autocompleteResults.value.length - 1
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedAutocompleteIndex.value = Math.max(selectedAutocompleteIndex.value - 1, 0);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (autocompleteResults.value.length > 0) {
        e.preventDefault();
        selectAutocompleteItem(autocompleteResults.value[selectedAutocompleteIndex.value]);
        return;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      showAutocomplete.value = false;
      return;
    }
  }

  if (e.key === 'Enter' && !showAutocomplete.value) {
    e.preventDefault();
    sendMessage();
  }
}

function selectAutocompleteItem(item: MentionResult) {
  const prefix = autocompleteType.value === 'player' ? '@' : '#';
  const mentionText = `${prefix}${item.name} `;

  // Store mention data in registry for lookup when sending
  mentionRegistry.set(item.name, {
    type: autocompleteType.value,
    name: item.name,
    id: item.id
  });

  // Replace the @query or #query with the full mention
  const beforeMention = inputMessage.value.slice(0, mentionStartIndex.value);
  const afterCursor = inputMessage.value.slice(inputRef.value?.selectionStart ?? inputMessage.value.length);
  inputMessage.value = beforeMention + mentionText + afterCursor;

  showAutocomplete.value = false;
  autocompleteResults.value = [];

  nextTick(() => {
    inputRef.value?.focus();
    // Position cursor after the inserted mention
    const newCursorPos = mentionStartIndex.value + mentionText.length;
    inputRef.value?.setSelectionRange(newCursorPos, newCursorPos);
  });
}

function formatMessage(content: string): string {
  // Escape HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight @mentions (players) with badge style
  formatted = formatted.replace(/@([^\s@#]+)/g, '<span class="mention-badge mention-player"><span class="mention-icon">👤</span><span class="mention-text">$1</span></span>');

  // Highlight #mentions (servers) with badge style
  formatted = formatted.replace(/#([^\s@#]+)/g, '<span class="mention-badge mention-server"><span class="mention-icon">🖥</span><span class="mention-text">$1</span></span>');

  // Convert newlines
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

async function sendMessage() {
  const message = inputMessage.value.trim();
  if (!message) return;
  if (isLoading.value) return;

  error.value = '';
  inputMessage.value = '';

  // Add user message
  messages.value.push({ role: 'user', content: message });

  // Extract mentions from message and build enhanced context
  const enhancedContext = { ...props.context };

  // Find @player mentions
  const playerMentions = message.match(/@([^\s@#]+)/g);
  if (playerMentions) {
    for (const mention of playerMentions) {
      const name = mention.slice(1); // Remove @
      const data = mentionRegistry.get(name);
      if (data && data.type === 'player') {
        enhancedContext.playerName = data.name;
      } else {
        // Even if not in registry, use the name directly
        enhancedContext.playerName = name;
      }
    }
  }

  // Find #server mentions
  const serverMentions = message.match(/#([^\s@#]+)/g);
  if (serverMentions) {
    for (const mention of serverMentions) {
      const name = mention.slice(1); // Remove #
      const data = mentionRegistry.get(name);
      if (data && data.type === 'server') {
        enhancedContext.serverGuid = data.id;
      }
    }
  }

  isLoading.value = true;
  streamingContent.value = '';

  try {
    const request = {
      message: message,
      context: enhancedContext,
      conversationHistory: messages.value.slice(0, -1),
    };

    let fullResponse = '';
    for await (const chunk of streamChat(request)) {
      fullResponse += chunk;
      streamingContent.value = fullResponse;
    }

    messages.value.push({ role: 'assistant', content: fullResponse });
  } catch (err) {
    console.error('Chat error:', err);
    error.value = err instanceof Error ? err.message : 'Failed to get response';
  } finally {
    isLoading.value = false;
    streamingContent.value = '';
  }
}
</script>

<style scoped>
.ai-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1001;
  display: flex;
  justify-content: flex-end;
}

.ai-drawer {
  width: 100%;
  max-width: 600px;
  height: 100%;
  background: #0d1117;
  border-left: 1px solid #30363d;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
}

/* Terminal Bar */
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, #1a1f26 0%, #0d1117 100%);
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
}

.terminal-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.terminal-title {
  flex: 1;
  font-size: 0.7rem;
  color: #8b949e;
  text-transform: lowercase;
}

.btn-close {
  background: transparent;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #ff3131;
  background: rgba(255, 49, 49, 0.1);
}

/* Header */
.drawer-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #30363d;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 1rem;
  font-weight: 700;
  color: #e6edf3;
  margin: 0;
}

.drawer-subtitle {
  font-size: 0.7rem;
  color: #6e7681;
  margin: 0.25rem 0 0 0;
  font-style: italic;
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  color: #8b949e;
  font-size: 0.85rem;
  line-height: 1.6;
}

.welcome-message p {
  margin: 0 0 0.5rem 0;
}

.welcome-message ul {
  margin: 0;
  padding-left: 1.25rem;
}

.welcome-message li {
  margin-bottom: 0.25rem;
}

.tip-box {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 6px;
  font-size: 0.8rem;
}

.tip-box code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  color: #00fff2;
}

.context-hint {
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(0, 255, 242, 0.05);
  border: 1px solid rgba(0, 255, 242, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
}

.context-hint strong {
  color: #00fff2;
}

.message {
  font-size: 0.9rem;
  line-height: 1.6;
}

.message-content {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.message-role {
  color: #00fff2;
  font-weight: 700;
  flex-shrink: 0;
}

.message.user .message-role {
  color: #60a5fa;
}

.message-text {
  color: #e6edf3;
  word-break: break-word;
}

.message.user .message-text {
  color: #c9d1d9;
}

/* Mention badges */
.message-text :deep(.mention-badge) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem 0.15rem 0.35rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85em;
  vertical-align: baseline;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.message-text :deep(.mention-icon) {
  font-size: 0.8em;
  line-height: 1;
}

.message-text :deep(.mention-text) {
  line-height: 1.2;
}

.message-text :deep(.mention-player) {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
  color: #60a5fa;
}

.message-text :deep(.mention-player:hover) {
  background: rgba(96, 165, 250, 0.25);
  border-color: rgba(96, 165, 250, 0.6);
}

.message-text :deep(.mention-server) {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
}

.message-text :deep(.mention-server:hover) {
  background: rgba(52, 211, 153, 0.25);
  border-color: rgba(52, 211, 153, 0.6);
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 1em;
  background: #00fff2;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Autocomplete */
.autocomplete-container {
  position: relative;
  background: #1c2128;
  border-top: 1px solid #30363d;
  max-height: 250px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.autocomplete-header {
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #161b22;
  border-bottom: 1px solid #30363d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.searching-indicator {
  font-weight: normal;
  text-transform: none;
  color: #00fff2;
}

.autocomplete-list {
  overflow-y: auto;
  flex: 1;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: background 0.1s ease;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
  background: #30363d;
}

.item-icon {
  color: #00fff2;
  font-weight: 700;
  width: 1rem;
  text-align: center;
}

.item-name {
  color: #e6edf3;
  font-weight: 500;
}

.item-detail {
  color: #6e7681;
  font-size: 0.75rem;
  margin-left: auto;
}

.autocomplete-empty {
  padding: 1rem;
  color: #6e7681;
  text-align: center;
  font-size: 0.85rem;
}

/* Input */
.input-container {
  padding: 1rem;
  border-top: 1px solid #30363d;
  background: #0d1117;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #00fff2;
  box-shadow: 0 0 0 2px rgba(0, 255, 242, 0.1);
}

.input-prompt {
  color: #00fff2;
  font-weight: 700;
  flex-shrink: 0;
}

.input-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  color: #e6edf3;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.input-wrapper input::placeholder {
  color: #6e7681;
}

.input-wrapper input:disabled {
  color: #6e7681;
}

.send-button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(135deg, #00fff2 0%, #60a5fa 100%);
  color: #0d1117;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(0, 255, 242, 0.3);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button svg {
  width: 16px;
  height: 16px;
}

.error-message {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: #f85149;
}

/* Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .ai-drawer,
.drawer-leave-active .ai-drawer {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .ai-drawer,
.drawer-leave-to .ai-drawer {
  transform: translateX(100%);
}

/* Mobile */
@media (max-width: 640px) {
  .ai-drawer {
    max-width: 100%;
  }

  .drawer-header {
    padding: 0.75rem 1rem;
  }

  .messages-container {
    padding: 0.75rem 1rem;
  }

  .input-container {
    padding: 0.75rem;
  }
}
</style>
