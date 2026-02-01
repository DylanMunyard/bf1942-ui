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
            <div class="drawer-header-row">
              <h3 class="drawer-title">AI Assistant</h3>
              <button
                v-if="messages.length > 0"
                type="button"
                class="btn-clear"
                aria-label="Clear conversation"
                @click="clearConversation"
              >
                Clear conversation
              </button>
            </div>
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
              <p v-if="context.playerName || context.serverGuid" class="context-hint">
                <span v-if="context.playerName">Current player: <strong>{{ context.playerName }}</strong></span>
                <span v-if="context.serverGuid">Current server: <strong>{{ context.serverName || context.serverGuid }}</strong></span>
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
                <span
                  class="message-text"
                  :class="{ 'markdown-rules': msg.role === 'assistant' }"
                  v-html="formatMessage(msg.content, msg.role)"
                />
              </div>
            </div>

            <div v-if="isLoading" class="message assistant loading">
              <div class="message-content">
                <span class="message-role">$</span>
                <span
                  class="message-text markdown-rules"
                  v-html="formatMessage(streamingContent || 'Thinking...', 'assistant')"
                />
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
              <div class="tip-box tip-inside-input">
                <strong>Tip:</strong> Type <code>@</code> to search for players or <code>#</code> to search for servers
              </div>
              <div class="input-row">
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
import { marked } from 'marked';
import { streamChat, stripQualityMarker, type ChatMessage, type PageContext } from '@/services/aiChatService';
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

// Pin page context for the whole conversation so we don't lose server/player context
const conversationContext = ref<PageContext>({});

function clearConversation() {
  messages.value = [];
  streamingContent.value = '';
  error.value = '';
  mentionRegistry.clear();
  inputMessage.value = '';
  conversationContext.value = { ...props.context };
}

// Focus input and pin current page context when drawer opens (so first message uses up-to-date context)
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    conversationContext.value = { ...props.context };
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Delimited player/server names from AI: «player:name» and «server:name» (allows spaces, pipes, etc.) */
const DELIM_PLAYER = /«player:([^»]*)»/g;
const DELIM_SERVER = /«server:([^»]*)»/g;

function applyMentionBadges(html: string): string {
  return html
    .replace(DELIM_PLAYER, (_, name) => `<span class="mention-badge mention-player"><span class="mention-icon">👤</span><span class="mention-text">${escapeHtml(name.trim())}</span></span>`)
    .replace(DELIM_SERVER, (_, name) => `<span class="mention-badge mention-server"><span class="mention-icon">🖥</span><span class="mention-text">${escapeHtml(name.trim())}</span></span>`)
    .replace(/@([^\s@#]+)/g, (_, name) => `<span class="mention-badge mention-player"><span class="mention-icon">👤</span><span class="mention-text">${escapeHtml(name)}</span></span>`)
    .replace(/#(?!\d)([^\s@#]+)/g, (_, name) => `<span class="mention-badge mention-server"><span class="mention-icon">🖥</span><span class="mention-text">${escapeHtml(name)}</span></span>`);
}

function formatMessage(content: string, role?: 'user' | 'assistant'): string {
  if (!content.trim()) return '';

  if (role === 'assistant') {
    let html = marked(content.trim(), { breaks: true }) as string;
    // Wrap tables so they can scroll horizontally on mobile without affecting text wrap
    html = html.replace(/<table/g, '<div class="table-scroll-wrap"><table');
    html = html.replace(/<\/table>/g, '</table></div>');
    return applyMentionBadges(html);
  }

  // User message: escape HTML, then apply mentions and newlines
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  formatted = applyMentionBadges(formatted);
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

async function sendMessage() {
  const message = inputMessage.value.trim();
  if (!message) return;
  if (isLoading.value) return;

  error.value = '';
  inputMessage.value = '';

  // Pin context when starting a new conversation so we keep server/player context for the whole chat
  if (messages.value.length === 0) {
    conversationContext.value = { ...props.context };
  }

  // Add user message
  messages.value.push({ role: 'user', content: message });

  // Extract mentions from message and build enhanced context (use pinned conversation context)
  const enhancedContext = { ...conversationContext.value };

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
  const serverMentions = message.match(/#(?!\d)([^\s@#]+)/g);
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

    // Strip quality assessment marker before storing (it's logged server-side)
    const cleanedResponse = stripQualityMarker(fullResponse);
    messages.value.push({ role: 'assistant', content: cleanedResponse });
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
  max-width: 960px;
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

.drawer-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.drawer-title {
  font-size: 1rem;
  font-weight: 700;
  color: #e6edf3;
  margin: 0;
}

.btn-clear {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid #30363d;
  color: #8b949e;
  font-family: inherit;
  font-size: 0.7rem;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.btn-clear:hover {
  color: #e6edf3;
  border-color: #484f58;
  background: rgba(255, 255, 255, 0.05);
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

.tip-inside-input {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  border: none;
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
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

/* Chat theme vars for markdown-rules (same pattern as PublicTournamentRules.vue) */
.message.assistant .message-content {
  --color-text: #e6edf3;
  --color-text-muted: #8b949e;
  --rule-primary: #00fff2;
  --rule-secondary: #00fff2;
}

/* Markdown rules styling (same as PublicTournamentRules.vue) */
.message-text.markdown-rules :deep(h1),
.message-text.markdown-rules :deep(h2),
.message-text.markdown-rules :deep(h3),
.message-text.markdown-rules :deep(h4),
.message-text.markdown-rules :deep(h5),
.message-text.markdown-rules :deep(h6) {
  color: var(--color-text);
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

/* First block in response: no top margin so it aligns with the $ prompt */
.message-text.markdown-rules :deep(h1:first-child),
.message-text.markdown-rules :deep(h2:first-child),
.message-text.markdown-rules :deep(h3:first-child),
.message-text.markdown-rules :deep(h4:first-child),
.message-text.markdown-rules :deep(h5:first-child),
.message-text.markdown-rules :deep(h6:first-child),
.message-text.markdown-rules :deep(p:first-child) {
  margin-top: 0;
}

.message-text.markdown-rules :deep(p) {
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.message-text.markdown-rules :deep(strong) {
  font-weight: 700;
  color: var(--color-text);
}

.message-text.markdown-rules :deep(em) {
  color: var(--rule-secondary);
  font-style: italic;
}

.message-text.markdown-rules :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.message-text.markdown-rules :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  padding-left: 0;
}

.message-text.markdown-rules :deep(li) {
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  margin-left: 1rem;
}

.message-text.markdown-rules :deep(code) {
  background: linear-gradient(135deg, var(--rule-primary)15, var(--rule-secondary)10);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--color-text);
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  border: 1px solid var(--rule-primary);
}

.message-text.markdown-rules :deep(blockquote) {
  border-left: 4px solid var(--rule-primary);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
  background: linear-gradient(to right, var(--rule-primary)08, transparent);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}

.message-text.markdown-rules :deep(a) {
  color: var(--color-text);
  text-decoration: underline;
  font-weight: 600;
  transition: all 0.2s ease;
}

.message-text.markdown-rules :deep(a:hover) {
  color: var(--color-text);
  text-decoration: none;
}

/* Wrapper for tables: horizontal scroll on narrow viewports, text elsewhere stays wrapped */
.message-text.markdown-rules :deep(.table-scroll-wrap) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.5rem 0;
  max-width: 100%;
}

.message-text.markdown-rules :deep(.table-scroll-wrap table) {
  min-width: max-content;
  width: 100%;
}

.message-text.markdown-rules :deep(table) {
  border-collapse: collapse;
  margin: 0;
  border: 2px solid var(--rule-primary);
  border-radius: 0.5rem;
  overflow: hidden;
}

.message-text.markdown-rules :deep(thead) {
  background: linear-gradient(to right, var(--rule-primary)30, var(--rule-secondary)20);
  backdrop-filter: blur(0.5rem);
}

.message-text.markdown-rules :deep(th) {
  padding: 1rem;
  text-align: left;
  font-weight: 700;
  color: var(--color-text);
  border-bottom: 2px solid var(--rule-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.message-text.markdown-rules :deep(td) {
  padding: 0.75rem 1rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--rule-primary)20;
}

.message-text.markdown-rules :deep(tbody tr) {
  background-color: transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.message-text.markdown-rules :deep(tbody tr:nth-child(even)) {
  background-color: var(--rule-primary)08;
}

.message-text.markdown-rules :deep(tbody tr:hover) {
  background-color: var(--rule-primary)15;
  box-shadow: inset 0 0 16px var(--rule-primary)15;
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
  flex-direction: column;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #00fff2;
  box-shadow: 0 0 0 2px rgba(0, 255, 242, 0.1);
}

.input-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
}

.input-prompt {
  color: #00fff2;
  font-weight: 700;
  flex-shrink: 0;
  padding-top: 0.35rem;
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
@media (max-width: 768px) {
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
