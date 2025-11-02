<template>
  <!-- Markdown Help Modal (separate from tournament modal) -->
  <div v-if="showMarkdownHelp" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="showMarkdownHelp = false">
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Markdown Guide
        </h2>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-200 transition-colors"
          @click="showMarkdownHelp = false"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Headings -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Headings</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400"># Main Heading</code>
              <p class="text-slate-400 mt-1">Creates the largest heading</p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">## Subheading</code>
              <p class="text-slate-400 mt-1">Creates a smaller heading</p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">### Even Smaller</code>
              <p class="text-slate-400 mt-1">And so on...</p>
            </div>
          </div>
        </div>

        <!-- Text Formatting -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Text Formatting</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">**bold text**</code>
              <p class="text-slate-400 mt-1">Makes text <strong>bold</strong></p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">*italic text*</code>
              <p class="text-slate-400 mt-1">Makes text <em>italic</em></p>
            </div>
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">`code`</code>
              <p class="text-slate-400 mt-1">Highlights inline code</p>
            </div>
          </div>
        </div>

        <!-- Lists -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Lists</h3>
          <div class="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div>
              <p class="text-sm font-medium text-slate-300 mb-2">Bullet List:</p>
              <code class="block bg-slate-900 px-3 py-2 rounded text-amber-400 text-xs whitespace-pre-wrap">- Item one
- Item two
- Item three</code>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-300 mb-2">Numbered List:</p>
              <code class="block bg-slate-900 px-3 py-2 rounded text-amber-400 text-xs whitespace-pre-wrap">1. First item
2. Second item
3. Third item</code>
            </div>
          </div>
        </div>

        <!-- Links -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Links</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">[link text](https://example.com)</code>
              <p class="text-slate-400 mt-1">Creates a clickable link</p>
            </div>
          </div>
        </div>

        <!-- Blockquotes -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Blockquotes</h3>
          <div class="space-y-2 bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div class="text-sm">
              <code class="bg-slate-900 px-2 py-1 rounded text-amber-400">> Important note</code>
              <p class="text-slate-400 mt-1">Creates a highlighted blockquote</p>
            </div>
          </div>
        </div>

        <!-- Example -->
        <div>
          <h3 class="text-lg font-semibold text-slate-200 mb-3">Example</h3>
          <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <p class="text-slate-300 text-sm mb-3">This markdown:</p>
            <code class="block bg-slate-900 px-3 py-2 rounded text-amber-400 text-xs whitespace-pre-wrap mb-3"># Tournament Rules

## General Rules
- All players must be registered
- Respect all referees
- No cheating allowed

## Map Selection
Winners choose first map for next round.</code>
            <p class="text-slate-300 text-sm">Will display nicely formatted rules with sections and lists.</p>
          </div>
        </div>
      </div>

      <!-- Close Button -->
      <div class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6">
        <button
          type="button"
          class="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
          @click="showMarkdownHelp = false"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>

  <!-- Add Tournament Modal -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {{ editMode ? 'Edit Tournament' : 'Create Tournament' }}
          </h2>
          <button
            class="text-slate-400 hover:text-slate-200 transition-colors"
            @click="$emit('close')"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Tournament Name -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Tournament Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            placeholder="e.g., Summer Championship 2025"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
        </div>

        <!-- Organizer (with player search) -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Organizer <span class="text-red-400">*</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div class="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <span class="text-slate-900 text-xs font-bold">👤</span>
              </div>
            </div>

            <input
              v-model="formData.organizer"
              type="text"
              required
              placeholder="Search for player..."
              class="w-full pl-14 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              @input="onOrganizerInput"
              @focus="onSearchFocus"
              @blur="onSearchBlur"
            >

            <!-- Loading Spinner -->
            <div
              v-if="isSearchLoading"
              class="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <div class="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>

            <!-- Player Suggestions Dropdown -->
            <div
              v-if="showPlayerDropdown"
              class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto shadow-2xl z-50"
            >
              <div
                v-for="player in playerSuggestions"
                :key="player.playerName"
                class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0"
                @mousedown.prevent="selectPlayer(player)"
              >
                <div class="font-medium text-slate-200 text-sm">
                  {{ player.playerName }}
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  {{ formatPlayTime(player.totalPlayTimeMinutes) }} playtime
                </div>
              </div>
              <div
                v-if="playerSuggestions.length === 0 && !isSearchLoading && formData.organizer.length >= 2"
                class="p-3 text-center text-slate-400 text-sm"
              >
                No players found
              </div>
            </div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Search for an existing player
          </p>
        </div>

        <!-- Game Selection -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Game <span class="text-red-400">*</span>
          </label>
          <div class="flex items-center gap-2">
            <button
              v-for="game in [{id: 'bf1942', name: 'BF1942', icon: bf1942Icon}, {id: 'fh2', name: 'FH2', icon: fh2Icon}, {id: 'bfvietnam', name: 'BF Vietnam', icon: bfvIcon}]"
              :key="game.id"
              type="button"
              :class="[
                'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 flex-1',
                formData.game === game.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 ring-2 ring-cyan-500/30'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
              ]"
              @click="formData.game = game.id as 'bf1942' | 'fh2' | 'bfvietnam'"
            >
              <div
                class="w-6 h-6 rounded bg-cover bg-center"
                :style="{ backgroundImage: `url('${game.icon}')` }"
              />
              <span class="text-sm font-medium">{{ game.name }}</span>
            </button>
          </div>
        </div>

        <!-- Server Selection (Optional) -->
        <div class="relative z-40">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Tournament Server <span class="text-slate-500">(Optional)</span>
          </label>

          <!-- Selected Server Display -->
          <div v-if="selectedServer" class="mb-3">
            <div class="flex items-center justify-between gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-cyan-400 text-sm">🖥️</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-200 text-sm truncate">
                    {{ selectedServer.serverName }}
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    {{ selectedServer.serverIp }}:{{ selectedServer.serverPort }}
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="clearServerSelection"
                title="Change server"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Server Search Input (only show when no server selected) -->
          <div v-else class="relative">
            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <span class="text-slate-500 text-sm">🖥️</span>
            </div>
            <input
              v-model="serverSearchQuery"
              type="text"
              placeholder="Search for server..."
              class="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              @input="onServerSearchInput"
              @focus="onServerSearchFocus"
              @blur="onServerSearchBlur"
            >

            <!-- Server Suggestions Dropdown -->
            <div
              v-if="showServerDropdown"
              class="absolute top-full mt-2 left-0 right-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto shadow-2xl z-50"
            >
              <div
                v-for="server in serverSuggestions"
                :key="server.serverGuid"
                class="p-3 border-b border-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all last:border-b-0"
                @mousedown.prevent="selectServer(server)"
              >
                <div class="font-medium text-slate-200 text-sm">
                  {{ server.serverName }}
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  {{ server.serverIp }}:{{ server.serverPort }}
                </div>
              </div>
              <div
                v-if="serverSuggestions.length === 0 && !isServerSearchLoading && serverSearchQuery.length >= 2"
                class="p-3 text-center text-slate-400 text-sm"
              >
                No servers found
              </div>
            </div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Optionally specify which server this tournament will be played on
          </p>
        </div>

        <!-- Anticipated Round Count -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            # Matches
          </label>
          <input
            v-model.number="formData.anticipatedRoundCount"
            type="number"
            min="1"
            placeholder="e.g., 5"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
          <p class="mt-1 text-xs text-slate-500">
            How many matches do you expect in this tournament?
          </p>
        </div>

        <!-- Discord URL -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Discord URL <span class="text-slate-500">(Optional)</span>
          </label>
          <input
            v-model="formData.discordUrl"
            type="url"
            placeholder="https://discord.gg/..."
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
          <p class="mt-1 text-xs text-slate-500">
            Link to your tournament Discord server
          </p>
        </div>

        <!-- Forum URL -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Forum URL <span class="text-slate-500">(Optional)</span>
          </label>
          <input
            v-model="formData.forumUrl"
            type="url"
            placeholder="https://..."
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
          <p class="mt-1 text-xs text-slate-500">
            Link to your tournament forum or discussion page
          </p>
        </div>

        <!-- Hero Image Upload -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Hero Image <span class="text-slate-500">(Optional)</span>
          </label>

          <!-- Image Preview -->
          <div
            v-if="imagePreview"
            class="relative mb-3 rounded-lg overflow-hidden border border-slate-700/50"
          >
            <img
              :src="imagePreview"
              alt="Tournament hero image"
              class="w-full h-48 object-cover"
            >
            <button
              type="button"
              class="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
              @click="removeImage"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Upload Button -->
          <div
            class="relative border-2 border-dashed border-slate-700/50 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            :class="{ 'border-cyan-500/50 bg-cyan-500/5': isDragging }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              class="hidden"
              @change="handleFileSelect"
            >
            <div class="text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm font-medium">
                {{ imagePreview ? 'Change Image' : 'Upload Hero Image' }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                Click or drag & drop (Max 4MB, JPEG/PNG/GIF/WEBP)
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <p v-if="imageError" class="mt-2 text-xs text-red-400">
            {{ imageError }}
          </p>
        </div>

        <!-- Community Logo Upload -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Community Logo <span class="text-slate-500">(Optional)</span>
          </label>

          <!-- Logo Preview -->
          <div
            v-if="logoPreview"
            class="relative mb-3 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800/30 p-4 flex items-center justify-center h-32"
          >
            <img
              :src="logoPreview"
              alt="Community logo"
              class="max-h-28 max-w-full object-contain"
            >
            <button
              type="button"
              class="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
              @click="removeLogo"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Upload Button -->
          <div
            class="relative border-2 border-dashed border-slate-700/50 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
            @click="triggerLogoFileInput"
            @dragover.prevent="isDraggingLogo = true"
            @dragleave.prevent="isDraggingLogo = false"
            @drop.prevent="handleLogoDrop"
            :class="{ 'border-cyan-500/50 bg-cyan-500/5': isDraggingLogo }"
          >
            <input
              ref="logoFileInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              class="hidden"
              @change="handleLogoFileSelect"
            >
            <div class="text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm font-medium">
                {{ logoPreview ? 'Change Logo' : 'Upload Community Logo' }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                Click or drag & drop (Max 4MB, JPEG/PNG/GIF/WEBP)
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <p v-if="logoError" class="mt-2 text-xs text-red-400">
            {{ logoError }}
          </p>
        </div>

        <!-- Tournament Rules (Markdown) -->
        <div>
          <div class="flex items-center justify-between gap-4 mb-2">
            <label class="block text-sm font-medium text-slate-300">
              Tournament Rules <span class="text-slate-500">(Optional)</span>
            </label>
            <button
              type="button"
              @click="showMarkdownHelp = true"
              class="text-xs px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-200 rounded transition-colors"
              title="Show markdown syntax help"
            >
              ? Help
            </button>
          </div>

          <textarea
            v-model="formData.rules"
            placeholder="# Tournament Rules&#10;&#10;Write your tournament rules in markdown..."
            class="w-full h-64 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
          />

          <!-- Preview Toggle and Display -->
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              @click="showRulesPreview = !showRulesPreview"
              class="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-slate-200 rounded transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ showRulesPreview ? 'Hide' : 'Show' }} Preview
            </button>
          </div>

          <!-- Markdown Preview (Below Editor) -->
          <div v-if="showRulesPreview && (formData.rules && formData.rules.trim())" class="mt-4 bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 overflow-y-auto max-h-64">
            <div class="prose prose-invert prose-sm max-w-none">
              <div
                v-html="renderedMarkdown"
                class="text-slate-300 markdown-content"
              />
            </div>
          </div>
        </div>

        <!-- Theme Colors -->
        <div class="border-t border-slate-700/30 pt-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-lg">🎨</span>
            <label class="block text-sm font-medium text-slate-300">
              Theme Colors <span class="text-slate-500">(Optional)</span>
            </label>
          </div>

          <p class="text-xs text-slate-400 mb-4">
            Customize the color scheme of your tournament page. Colors are completely optional - the page will use default colors if not specified.
          </p>

          <!-- Primary Color -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Primary Color
            </label>
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <input
                  :value="formData.primaryColour || '#000000'"
                  type="color"
                  class="w-full h-12 rounded-lg cursor-pointer border border-slate-700/50"
                  @change="(e) => {
                    formData.primaryColour = (e.target as HTMLInputElement).value;
                    primaryColorInput.value = formData.primaryColour;
                    if (!formData.secondaryColour) {
                      formData.secondaryColour = getDefaultSecondaryColor();
                      secondaryColorInput.value = formData.secondaryColour;
                    }
                  }"
                >
              </div>
              <input
                v-model="primaryColorInput"
                type="text"
                placeholder="#FF6B35"
                class="w-32 px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                @blur="onPrimaryColorInputChange"
                title="Paste or type hex color (e.g., #FF6B35)"
              >
              <button
                v-if="formData.primaryColour"
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="formData.primaryColour = ''; primaryColorInput = ''"
                title="Clear color"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Used for hero section, headers, and accents. Paste or type hex color (e.g., #FF6B35). The secondary color will be auto-generated from this.
            </p>
          </div>

          <!-- Secondary Color -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Secondary Color
            </label>
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <input
                  :value="formData.secondaryColour || '#9333ea'"
                  type="color"
                  class="w-full h-12 rounded-lg cursor-pointer border border-slate-700/50"
                  @change="(e) => {
                    formData.secondaryColour = (e.target as HTMLInputElement).value;
                    secondaryColorInput.value = formData.secondaryColour;
                  }"
                >
              </div>
              <input
                v-model="secondaryColorInput"
                type="text"
                placeholder="#9333EA"
                class="w-32 px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                @blur="onSecondaryColorInputChange"
                title="Paste or type hex color (e.g., #9333EA)"
              >
              <button
                v-if="formData.secondaryColour"
                type="button"
                class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                @click="formData.secondaryColour = ''; secondaryColorInput = ''"
                title="Clear color"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Complements the primary color. Auto-generated if left empty. Paste or type hex color (e.g., #9333EA). <a href="https://coolors.co" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300">Need inspiration?</a>
            </p>
          </div>

          <!-- Color Preview -->
          <div v-if="formData.primaryColour" class="mt-4 p-4 rounded-lg border border-slate-700/50 bg-slate-800/30">
            <p class="text-xs text-slate-400 mb-3 font-medium">PREVIEW:</p>
            <div class="space-y-2">
              <!-- Hero preview -->
              <div
                class="h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors"
                :style="{ backgroundColor: formData.primaryColour }"
              >
                Hero Section
              </div>
              <!-- Section title preview -->
              <div
                class="h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-colors"
                :style="{
                  background: `linear-gradient(to right, ${formData.primaryColour}, ${formData.secondaryColour || getDefaultSecondaryColor()})`
                }"
              >
                Section Title
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4">
          <button
            type="button"
            class="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Saving...' : (editMode ? 'Update Tournament' : 'Create Tournament') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { marked } from 'marked';
import { adminTournamentService, type CreateTournamentRequest, type TournamentDetail } from '@/services/adminTournamentService';
import { generateComplementaryColor, isValidHex } from '@/utils/colorUtils';
import bf1942Icon from '@/assets/bf1942.webp';
import fh2Icon from '@/assets/fh2.webp';
import bfvIcon from '@/assets/bfv.webp';

interface PlayerSearchResult {
  playerName: string;
  totalPlayTimeMinutes: number;
  lastSeen: string;
  isActive: boolean;
}

interface ServerSearchResult {
  serverGuid: string;
  serverName: string;
  serverIp: string;
  serverPort: number;
  gameType: string;
}

interface Props {
  tournament?: TournamentDetail | any;
  defaultOrganizer?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  added: [tournamentId?: number];
}>();

const editMode = ref(!!props.tournament);

const formData = ref({
  name: '',
  organizer: '',
  game: 'bf1942' as 'bf1942' | 'fh2' | 'bfvietnam',
  anticipatedRoundCount: undefined as number | undefined,
  serverGuid: undefined as string | undefined,
  discordUrl: '',
  forumUrl: '',
  rules: '',
  primaryColour: '',
  secondaryColour: '',
});

const loading = ref(false);
const error = ref<string | null>(null);

// Player search state
const playerSuggestions = ref<PlayerSearchResult[]>([]);
const isSearchLoading = ref(false);
const showPlayerDropdown = ref(false);
let searchTimeout: number | null = null;
let blurTimeout: number | null = null;

// Server search state
const serverSearchQuery = ref('');
const serverSuggestions = ref<ServerSearchResult[]>([]);
const selectedServer = ref<ServerSearchResult | null>(null);
const isServerSearchLoading = ref(false);
const showServerDropdown = ref(false);
let serverSearchTimeout: number | null = null;
let serverBlurTimeout: number | null = null;

// Image upload state
const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(null);
const imageFile = ref<File | null>(null);
const imageError = ref<string | null>(null);
const isDragging = ref(false);
const removeHeroImage = ref(false);

// Logo upload state
const logoFileInput = ref<HTMLInputElement | null>(null);
const logoPreview = ref<string | null>(null);
const logoFile = ref<File | null>(null);
const logoError = ref<string | null>(null);
const isDraggingLogo = ref(false);
const removeCommunityLogo = ref(false);

// Rules editor state
const showRulesPreview = ref(false);
const showMarkdownHelp = ref(false);

// Color input state
const primaryColorInput = ref('');
const secondaryColorInput = ref('');

// Markdown preview
const renderedMarkdown = computed(() => {
  if (!formData.value.rules || !formData.value.rules.trim()) {
    return '';
  }
  try {
    return marked(formData.value.rules, { breaks: true });
  } catch {
    return '<p class="text-red-400">Invalid markdown</p>';
  }
});

// Load hero image from API
const loadHeroImage = async (tournamentId: number) => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/image`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      imagePreview.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    // Silently fail - hero image is optional
    console.debug('No hero image available');
  }
};

// Load logo image from API
const loadLogoImage = async (tournamentId: number) => {
  try {
    const { authService } = await import('@/services/authService');
    await authService.ensureValidToken();
    const token = localStorage.getItem('authToken');

    const response = await fetch(`/stats/admin/tournaments/${tournamentId}/logo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      logoPreview.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    // Silently fail - logo image is optional
    console.debug('No logo image available');
  }
};

onMounted(() => {
  if (props.tournament) {
    // Edit mode - populate form
    formData.value = {
      name: props.tournament.name,
      organizer: props.tournament.organizer,
      game: props.tournament.game,
      anticipatedRoundCount: props.tournament.anticipatedRoundCount,
      serverGuid: props.tournament.serverGuid,
      discordUrl: props.tournament.discordUrl || '',
      forumUrl: props.tournament.forumUrl || '',
      rules: props.tournament.rules || '',
      primaryColour: props.tournament.primaryColour || '',
      secondaryColour: props.tournament.secondaryColour || '',
    };

    // Populate color input fields
    if (props.tournament.primaryColour) {
      primaryColorInput.value = props.tournament.primaryColour;
    }
    if (props.tournament.secondaryColour) {
      secondaryColorInput.value = props.tournament.secondaryColour;
    }

    // Populate server selection if available
    if (props.tournament.serverGuid && props.tournament.serverName) {
      selectedServer.value = {
        serverGuid: props.tournament.serverGuid,
        serverName: props.tournament.serverName,
        serverIp: '',
        serverPort: 0,
        gameType: props.tournament.game,
      };
      serverSearchQuery.value = props.tournament.serverName;
    }

    // Reset remove flags for edit mode
    removeHeroImage.value = false;
    removeCommunityLogo.value = false;

    // Load existing images using the new API structure
    if (props.tournament.hasHeroImage && props.tournament.id) {
      loadHeroImage(props.tournament.id).catch(err => console.debug('Failed to load hero image:', err));
    }

    if (props.tournament.hasCommunityLogo && props.tournament.id) {
      loadLogoImage(props.tournament.id).catch(err => console.debug('Failed to load logo image:', err));
    }
  } else if (props.defaultOrganizer) {
    // Create mode with default organizer
    formData.value.organizer = props.defaultOrganizer;
  }
});

// Watchers removed - color inputs now handle their own syncing via event handlers

const searchPlayers = async (query: string) => {
  if (!query || query.length < 2) {
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
    return;
  }

  isSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/Players/search?query=${encodeURIComponent(query)}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search players');
    }

    const data = await response.json();
    playerSuggestions.value = data.items;
    showPlayerDropdown.value = data.items.length > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching players:', error);
    playerSuggestions.value = [];
    showPlayerDropdown.value = false;
  } finally {
    isSearchLoading.value = false;
  }
};

const onOrganizerInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    searchPlayers(formData.value.organizer);
  }, 300) as unknown as number;
};

const onSearchFocus = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }
  if (formData.value.organizer.length >= 2) {
    searchPlayers(formData.value.organizer);
  }
};

const onSearchBlur = () => {
  blurTimeout = setTimeout(() => {
    showPlayerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectPlayer = (player: PlayerSearchResult) => {
  formData.value.organizer = player.playerName;
  playerSuggestions.value = [];
  showPlayerDropdown.value = false;
};

const formatPlayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

// Server search functions
const searchServers = async (query: string) => {
  if (!query || query.length < 2) {
    serverSuggestions.value = [];
    showServerDropdown.value = false;
    return;
  }

  isServerSearchLoading.value = true;

  try {
    const response = await fetch(`/stats/servers/search?query=${encodeURIComponent(query)}&game=${formData.value.game}&pageSize=10`);
    if (!response.ok) {
      throw new Error('Failed to search servers');
    }

    const data = await response.json();
    serverSuggestions.value = data.items || [];
    showServerDropdown.value = (data.items?.length || 0) > 0 || query.length >= 2;
  } catch (error) {
    console.error('Error searching servers:', error);
    serverSuggestions.value = [];
    showServerDropdown.value = false;
  } finally {
    isServerSearchLoading.value = false;
  }
};

const onServerSearchInput = () => {
  selectedServer.value = null;
  formData.value.serverGuid = undefined;

  if (serverSearchTimeout) {
    clearTimeout(serverSearchTimeout);
  }

  serverSearchTimeout = setTimeout(() => {
    searchServers(serverSearchQuery.value);
  }, 300) as unknown as number;
};

const onServerSearchFocus = () => {
  if (serverBlurTimeout) {
    clearTimeout(serverBlurTimeout);
  }
  if (serverSearchQuery.value.length >= 2) {
    searchServers(serverSearchQuery.value);
  }
};

const onServerSearchBlur = () => {
  serverBlurTimeout = setTimeout(() => {
    showServerDropdown.value = false;
  }, 200) as unknown as number;
};

const selectServer = (server: ServerSearchResult) => {
  selectedServer.value = server;
  serverSearchQuery.value = server.serverName;
  formData.value.serverGuid = server.serverGuid;
  serverSuggestions.value = [];
  showServerDropdown.value = false;
};

const clearServerSelection = () => {
  selectedServer.value = null;
  serverSearchQuery.value = '';
  formData.value.serverGuid = undefined;
};

// Hero image functions
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processImageFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processImageFile(file);
  }
};

const processImageFile = (file: File) => {
  imageError.value = null;

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    imageError.value = 'Invalid file type. Please use JPEG, PNG, GIF, or WEBP.';
    return;
  }

  if (file.size > 4 * 1024 * 1024) {
    imageError.value = 'File size must be less than 4MB.';
    return;
  }

  imageFile.value = file;
  removeHeroImage.value = false; // Clear remove flag when uploading new image

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  imageFile.value = null;
  imagePreview.value = null;
  imageError.value = null;
  removeHeroImage.value = true;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Community logo functions
const triggerLogoFileInput = () => {
  logoFileInput.value?.click();
};

const handleLogoFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processLogoFile(file);
  }
};

const handleLogoDrop = (event: DragEvent) => {
  isDraggingLogo.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processLogoFile(file);
  }
};

const processLogoFile = (file: File) => {
  logoError.value = null;

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    logoError.value = 'Invalid file type. Please use JPEG, PNG, GIF, or WEBP.';
    return;
  }

  if (file.size > 4 * 1024 * 1024) {
    logoError.value = 'File size must be less than 4MB.';
    return;
  }

  logoFile.value = file;
  removeCommunityLogo.value = false; // Clear remove flag when uploading new image

  const reader = new FileReader();
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const removeLogo = () => {
  logoFile.value = null;
  logoPreview.value = null;
  logoError.value = null;
  removeCommunityLogo.value = true;
  if (logoFileInput.value) {
    logoFileInput.value.value = '';
  }
};

// Color picker functions
const getDefaultSecondaryColor = (): string => {
  if (!formData.value.primaryColour || !isValidHex(formData.value.primaryColour)) {
    return '#9333ea'; // Default fallback
  }
  return generateComplementaryColor(formData.value.primaryColour);
};

const onPrimaryColorChange = () => {
  // Auto-generate secondary color if primary color changes and secondary is empty
  if (formData.value.primaryColour && !formData.value.secondaryColour) {
    formData.value.secondaryColour = getDefaultSecondaryColor();
  }
  // Sync the text input
  primaryColorInput.value = formData.value.primaryColour;
};

const onPrimaryColorInputChange = () => {
  let input = primaryColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    formData.value.primaryColour = input;
    primaryColorInput.value = input;
    console.debug('Primary color validated and set:', input);

    // Auto-generate secondary color if empty
    if (!formData.value.secondaryColour) {
      formData.value.secondaryColour = getDefaultSecondaryColor();
      secondaryColorInput.value = formData.value.secondaryColour;
    }
  } else if (input === '') {
    // Allow clearing the field
    formData.value.primaryColour = '';
    primaryColorInput.value = '';
    console.debug('Primary color cleared');
  } else {
    console.debug('Primary color validation failed for:', input);
  }
};

const onSecondaryColorInputChange = () => {
  let input = secondaryColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    formData.value.secondaryColour = input;
    secondaryColorInput.value = input;
  } else if (input === '') {
    // Allow clearing the field
    formData.value.secondaryColour = '';
    secondaryColorInput.value = '';
  }
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Ensure color inputs are synced before submitting
    // This handles the case where a user pastes a value without triggering blur
    console.debug('Before sync - primaryColorInput:', primaryColorInput.value, 'formData.primaryColour:', formData.value.primaryColour);
    if (primaryColorInput.value.trim()) {
      onPrimaryColorInputChange();
    }
    if (secondaryColorInput.value.trim()) {
      onSecondaryColorInputChange();
    }
    console.debug('After sync - formData.primaryColour:', formData.value.primaryColour, 'formData.secondaryColour:', formData.value.secondaryColour);

    const request: CreateTournamentRequest = {
      name: formData.value.name.trim(),
      organizer: formData.value.organizer.trim(),
      game: formData.value.game,
    };

    if (formData.value.anticipatedRoundCount) {
      request.anticipatedRoundCount = formData.value.anticipatedRoundCount;
    }

    if (formData.value.serverGuid) {
      request.serverGuid = formData.value.serverGuid;
    }

    if (formData.value.discordUrl?.trim()) {
      request.discordUrl = formData.value.discordUrl.trim();
    }

    if (formData.value.forumUrl?.trim()) {
      request.forumUrl = formData.value.forumUrl.trim();
    }

    if (formData.value.rules?.trim()) {
      request.rules = formData.value.rules.trim();
    }

    if (formData.value.primaryColour?.trim()) {
      request.primaryColour = formData.value.primaryColour.trim();
    }

    if (formData.value.secondaryColour?.trim()) {
      request.secondaryColour = formData.value.secondaryColour.trim();
    }

    console.debug('Tournament request colors:', { primaryColour: request.primaryColour, secondaryColour: request.secondaryColour });

    // Handle hero image: only include base64 if uploading new image, or remove flag if removing
    if (imageFile.value) {
      const imageData = await adminTournamentService.imageToBase64(imageFile.value);
      request.heroImageBase64 = imageData.base64;
      request.heroImageContentType = imageData.contentType;
      // Clear the remove flag since we're uploading a new image
      removeHeroImage.value = false;
    } else if (removeHeroImage.value) {
      // Only include remove flag if explicitly removing
      (request as any).RemoveHeroImage = true;
    }

    // Handle community logo: only include base64 if uploading new image, or remove flag if removing
    if (logoFile.value) {
      const logoData = await adminTournamentService.imageToBase64(logoFile.value);
      request.communityLogoBase64 = logoData.base64;
      request.communityLogoContentType = logoData.contentType;
      // Clear the remove flag since we're uploading a new image
      removeCommunityLogo.value = false;
    } else if (removeCommunityLogo.value) {
      // Only include remove flag if explicitly removing
      (request as any).RemoveCommunityLogo = true;
    }

    let tournamentId: number | undefined;

    if (editMode.value && props.tournament) {
      await adminTournamentService.updateTournament(props.tournament.id, request);
      tournamentId = props.tournament.id;
    } else {
      const result = await adminTournamentService.createTournament(request);
      tournamentId = result.id;
    }

    emit('added', tournamentId);
    emit('close');
  } catch (err) {
    console.error('Error saving tournament:', err);
    error.value = err instanceof Error ? err.message : 'Failed to save tournament';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #cbd5e1;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #e0f2fe;
}

.markdown-content :deep(em) {
  color: #cbd5e1;
  font-style: italic;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
  color: #cbd5e1;
  margin-left: 1rem;
}

.markdown-content :deep(code) {
  background-color: rgba(71, 85, 105, 0.5);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: #fbbf24;
  font-family: monospace;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid #475569;
  padding-left: 1rem;
  margin-left: 0;
  color: #94a3b8;
}

.markdown-content :deep(a) {
  color: #06b6d4;
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: #22d3ee;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 0.5rem;
  overflow: hidden;
}

.markdown-content :deep(thead) {
  background: linear-gradient(to right, rgba(51, 65, 85, 0.95), rgba(15, 23, 42, 0.95));
  backdrop-filter: blur(0.5rem);
}

.markdown-content :deep(th) {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(71, 85, 105, 0.5);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.markdown-content :deep(td) {
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
}

.markdown-content :deep(tbody tr) {
  background-color: rgba(30, 41, 59, 0.3);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.markdown-content :deep(tbody tr:nth-child(even)) {
  background-color: rgba(15, 23, 42, 0.4);
}

.markdown-content :deep(tbody tr:hover) {
  background-color: rgba(51, 65, 85, 0.4);
  box-shadow: inset 0 0 12px rgba(6, 182, 212, 0.1);
}
</style>
