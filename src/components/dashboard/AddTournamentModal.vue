<template>
  <!-- Markdown Help Modal -->
  <MarkdownHelpModal
    :is-visible="showMarkdownHelp"
    @close="showMarkdownHelp = false"
  />

  <!-- Add Tournament Modal -->
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
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
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6 flex-1 overflow-y-auto">
        <!-- Row 1: Tournament Name + Round Count -->
        <div class="grid grid-cols-3 gap-4">
          <!-- Tournament Name -->
          <div class="col-span-2">
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

          <!-- Anticipated Round Count -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Rounds <span class="text-slate-500">(Optional)</span>
            </label>
            <input
              v-model.number="formData.anticipatedRoundCount"
              type="number"
              min="1"
              placeholder="e.g., 5"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            >
          </div>
        </div>

        <!-- URL Slug -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            URL Slug <span class="text-slate-500">(Optional)</span>
          </label>
          <input
            v-model="formData.slug"
            type="text"
            placeholder="e.g., summer-league-2024"
            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            @input="onSlugInput"
          >
          <p class="mt-1 text-xs text-slate-500">
            A short, memorable identifier for URLs. Use lowercase letters, numbers, and hyphens only. Leave blank to use the tournament ID.
          </p>
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
        <GameSelector
          v-model="formData.game"
        />

        <!-- Server Selection (Optional) -->
        <ServerSelector
          v-model="formData.serverGuid"
          :game="formData.game"
          :selected-server="selectedServer"
          @select="selectServer"
          @clear="clearServerSelection"
        />

        <!-- Row 2: Social Media Links -->
        <SocialMediaLinks
          :discord-url="formData.discordUrl"
          :you-tube-url="formData.youTubeUrl"
          :twitch-url="formData.twitchUrl"
          :forum-url="formData.forumUrl"
          @update:discord-url="formData.discordUrl = $event"
          @update:you-tube-url="formData.youTubeUrl = $event"
          @update:twitch-url="formData.twitchUrl = $event"
          @update:forum-url="formData.forumUrl = $event"
        />

        <!-- Promo Video URL -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Promo Video URL <span class="text-slate-500">(Optional)</span>
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <input
              v-model="formData.promoVideoUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              class="w-full pl-14 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            >
          </div>
          <p class="mt-1 text-xs text-slate-500">
            YouTube video URL to embed on tournament page. Supports youtube.com/watch, youtu.be, shorts, and embed formats.
          </p>
        </div>

        <!-- Row 3: Hero Image + Community Logo -->
        <div class="grid grid-cols-2 gap-4">
          <ImageUpload
            v-model:model-value="imageFile"
            v-model:preview="imagePreview"
            label="Hero Image"
            aspect-ratio="hero"
            @remove="removeHeroImage = true"
          />
          <ImageUpload
            v-model:model-value="logoFile"
            v-model:preview="logoPreview"
            label="Community Logo"
            aspect-ratio="logo"
            @remove="removeCommunityLogo = true"
          />
        </div>

        <!-- Tournament Rules (Markdown) -->
        <MarkdownEditor
          v-model="formData.rules"
          label="Tournament Rules"
          placeholder="# Tournament Rules&#10;&#10;Write your tournament rules in markdown..."
          height="h-64"
          @show-help="showMarkdownHelp = true"
        />

        <!-- Registration Rules (Markdown) -->
        <div>
          <p class="text-xs text-slate-500 mb-2">
            Shown to users when they register for the tournament
          </p>
          <MarkdownEditor
            v-model="formData.registrationRules"
            label="Registration Rules"
            placeholder="# Registration Info&#10;&#10;Write registration instructions in markdown..."
            height="h-48"
            @show-help="showMarkdownHelp = true"
          />
        </div>

        <!-- Status & Game Mode -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Status Dropdown -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Status <span class="text-amber-400">*</span>
            </label>
            <select
              v-model="formData.status"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            >
              <option value="draft">Draft</option>
              <option value="registration">Registration</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <p class="mt-1 text-xs text-slate-500">
              Default: Draft. Set tournament status (registration, open, or closed when ready)
            </p>
          </div>

          <!-- Game Mode -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Game Mode <span class="text-slate-500">(Optional)</span>
            </label>
            <select
              v-model="formData.gameMode"
              class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            >
              <option value="Conquest">Conquest</option>
              <option value="CTF">CTF</option>
            </select>
            <p class="mt-1 text-xs text-slate-500">
              Game mode for this tournament
            </p>
          </div>
        </div>

        <!-- Week Dates Panel -->
        <div class="border-t border-slate-700/30 pt-6">
          <!-- Collapsible Panel Header -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all group"
            @click="expandedPanels.scheduleAndRules = !expandedPanels.scheduleAndRules"
          >
            <span class="text-lg">📅</span>
            <span class="text-sm font-medium text-slate-300 flex-1 text-left">
              Tournament Weeks <span class="text-slate-500">(Optional)</span>
            </span>
            <span v-if="formData.weekDates.length > 0" class="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-1 rounded">
              {{ formData.weekDates.length }} week{{ formData.weekDates.length !== 1 ? 's' : '' }}
            </span>
            <svg
              class="w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:text-slate-300"
              :class="expandedPanels.scheduleAndRules ? 'rotate-0' : '-rotate-90'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <!-- Panel Content -->
          <div v-if="expandedPanels.scheduleAndRules" class="space-y-4">
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
          <div v-if="formData.weekDates.length > 0" class="space-y-2 mb-4">
            <div
              v-for="(week, index) in formData.weekDates"
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

        <!-- Files Manager Panel -->
        <div class="border-t border-slate-700/30 pt-6">
          <!-- Collapsible Panel Header -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all group"
            @click="expandedPanels.filesAndLinks = !expandedPanels.filesAndLinks"
          >
            <span class="text-lg">📄</span>
            <span class="text-sm font-medium text-slate-300 flex-1 text-left">
              Tournament Files <span class="text-slate-500">(Optional)</span>
            </span>
            <span v-if="formData.files.length > 0" class="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">
              {{ formData.files.length }} file{{ formData.files.length !== 1 ? 's' : '' }}
            </span>
            <svg
              class="w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:text-slate-300"
              :class="expandedPanels.filesAndLinks ? 'rotate-0' : '-rotate-90'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <!-- Panel Content -->
          <div v-if="expandedPanels.filesAndLinks" class="space-y-4">
            <p class="text-xs text-slate-500">
              Manage tournament-related files (rules, maps, guides, etc.)
            </p>
            <button
              type="button"
              @click="addFile"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              + Add File
            </button>

            <!-- Files List -->
          <div v-if="formData.files.length > 0" class="space-y-2 mb-4">
            <div
              v-for="(file, index) in formData.files"
              :key="index"
              class="flex items-center justify-between gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg"
            >
              <div class="flex-1">
                <div class="text-sm font-medium text-slate-200">{{ file.name }}</div>
                <div class="text-xs text-slate-400 mt-1">
                  {{ file.url }}
                  <span v-if="file.category" class="text-slate-500"> • {{ file.category }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="editFile(index)"
                  class="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                  title="Edit file"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="deleteFile(index)"
                  class="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  title="Delete file"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- File Form Modal -->
          <div v-if="showFileForm" class="mb-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">File Name</label>
              <input
                v-model="editingFileData.name"
                type="text"
                placeholder="e.g., Tournament Rules"
                class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">File URL</label>
              <input
                v-model="editingFileData.url"
                type="url"
                placeholder="https://..."
                class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <input
                v-model="editingFileData.category"
                type="text"
                placeholder="e.g., Rules, Maps"
                class="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="saveFile"
                class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
              >
                Save File
              </button>
              <button
                type="button"
                @click="showFileForm = false"
                class="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
            </div>
        </div>

        <!-- Theme Colors Panel -->
        <div class="border-t border-slate-700/30 pt-6">
          <!-- Collapsible Panel Header -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/40 transition-all group"
            @click="expandedPanels.theme = !expandedPanels.theme"
          >
            <span class="text-lg">🎨</span>
            <span class="text-sm font-medium text-slate-300 flex-1 text-left">
              Theme Configuration <span class="text-slate-500">(Optional)</span>
            </span>
            <svg
              class="w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:text-slate-300"
              :class="expandedPanels.theme ? 'rotate-0' : '-rotate-90'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <!-- Panel Content -->
          <div v-if="expandedPanels.theme" class="space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <button
                v-if="!showThemePreview"
                type="button"
                class="ml-auto text-xs px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded transition-all"
                @click="showThemePreview = true"
                title="Show live preview"
              >
                👁️ Preview
              </button>
              <button
                v-else
                type="button"
                class="ml-auto text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-all"
                @click="showThemePreview = false"
                title="Hide preview"
              >
                ✕ Close
              </button>
            </div>

          <p class="text-xs text-slate-400 mb-6">
            Customize 3 core colors to create your unique tournament look. The page will intelligently derive lighter/darker variants.
          </p>

          <div :class="['space-y-6', showThemePreview && 'grid grid-cols-1 lg:grid-cols-2 lg:gap-6 lg:space-y-0']">
            <!-- Color Pickers -->
            <div class="space-y-6">
              <!-- Background Color -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">
                  Background Color
                </label>
                <div class="flex items-center gap-3">
                  <div class="relative flex-1">
                    <input
                      :value="formData.theme?.backgroundColour || '#000000'"
                      type="color"
                      class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                      @change="(e) => {
                        if (!formData.theme) formData.theme = { backgroundColour: '', textColour: '', accentColour: '' };
                        formData.theme.backgroundColour = (e.target as HTMLInputElement).value;
                        bgColorInput = formData.theme.backgroundColour;
                      }"
                    >
                  </div>
                  <input
                    v-model="bgColorInput"
                    type="text"
                    placeholder="#000000"
                    class="w-24 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    @blur="onBgColorChange"
                    title="Paste or type hex color"
                  >
                  <button
                    v-if="formData.theme?.backgroundColour"
                    type="button"
                    class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                    @click="() => { if (formData.theme) formData.theme.backgroundColour = ''; bgColorInput = '#000000'; }"
                    title="Reset to default"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p class="mt-1 text-xs text-slate-500">
                  Main page background. Default: Black (#000000)
                </p>
              </div>

              <!-- Text Color -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">
                  Text Color
                </label>
                <div class="flex items-center gap-3">
                  <div class="relative flex-1">
                    <input
                      :value="formData.theme?.textColour || '#FFFFFF'"
                      type="color"
                      class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                      @change="(e) => {
                        if (!formData.theme) formData.theme = { backgroundColour: '', textColour: '', accentColour: '' };
                        formData.theme.textColour = (e.target as HTMLInputElement).value;
                        textColorInput = formData.theme.textColour;
                      }"
                    >
                  </div>
                  <input
                    v-model="textColorInput"
                    type="text"
                    placeholder="#FFFFFF"
                    class="w-24 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    @blur="onTextColorChange"
                    title="Paste or type hex color"
                  >
                  <button
                    v-if="formData.theme?.textColour"
                    type="button"
                    class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                    @click="() => { if (formData.theme) formData.theme.textColour = ''; textColorInput = '#FFFFFF'; }"
                    title="Reset to default"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p class="mt-1 text-xs text-slate-500">
                  Main text and headings. Default: White (#FFFFFF)
                </p>
              </div>

              <!-- Accent Color -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">
                  Accent Color
                </label>
                <div class="flex items-center gap-3">
                  <div class="relative flex-1">
                    <input
                      :value="formData.theme?.accentColour || '#FFD700'"
                      type="color"
                      class="w-full h-10 rounded-lg cursor-pointer border border-slate-700/50"
                      @change="(e) => {
                        if (!formData.theme) formData.theme = { backgroundColour: '', textColour: '', accentColour: '' };
                        formData.theme.accentColour = (e.target as HTMLInputElement).value;
                        accentColorInput = formData.theme.accentColour;
                      }"
                    >
                  </div>
                  <input
                    v-model="accentColorInput"
                    type="text"
                    placeholder="#FFD700"
                    class="w-24 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    @blur="onAccentColorChange"
                    title="Paste or type hex color"
                  >
                  <button
                    v-if="formData.theme?.accentColour"
                    type="button"
                    class="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                    @click="() => { if (formData.theme) formData.theme.accentColour = ''; accentColorInput = '#FFD700'; }"
                    title="Reset to default"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p class="mt-1 text-xs text-slate-500">
                  Borders, buttons, highlights. Default: Golden (#FFD700)
                </p>
              </div>

              <!-- Quick Presets -->
              <div class="pt-4 border-t border-slate-700/30">
                <p class="text-xs text-slate-400 mb-3 font-medium">Quick Presets:</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                    @click="applyPreset('dark')"
                    title="Black background, white text, golden accents"
                  >
                    🌙 Dark Mode
                  </button>
                  <button
                    type="button"
                    class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                    @click="applyPreset('light')"
                    title="White background, black text, blue accents"
                  >
                    ☀️ Light Mode
                  </button>
                  <button
                    type="button"
                    class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                    @click="applyPreset('cyberpunk')"
                    title="Dark background, white text, neon pink/cyan"
                  >
                    ⚡ Cyberpunk
                  </button>
                  <button
                    type="button"
                    class="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition-all"
                    @click="applyPreset('ocean')"
                    title="Dark blue background, white text, cyan accents"
                  >
                    🌊 Ocean
                  </button>
                </div>
              </div>
            </div>

            <!-- Live Preview -->
            <div v-if="showThemePreview" class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
              <div class="text-xs text-slate-400 mb-3 font-medium">Live Preview:</div>
              <div
                class="rounded-lg overflow-hidden border-2 shadow-xl"
                :style="{
                  borderColor: formData.theme?.accentColour || '#FFD700',
                  backgroundColor: formData.theme?.backgroundColour || '#000000'
                }"
              >
                <!-- Mock Tournament Page -->
                <div class="p-6 space-y-4">
                  <!-- Header -->
                  <div
                    class="rounded-lg p-4"
                    :style="{ backgroundColor: formData.theme?.backgroundColour ? `${formData.theme.backgroundColour}20` : 'rgba(255,215,0,0.1)' }"
                  >
                    <div :style="{ color: formData.theme?.accentColour || '#FFD700' }" class="text-lg font-bold mb-2">Sample Tournament</div>
                    <div :style="{ color: formData.theme?.textColour || '#FFFFFF' }" class="text-xs">Organizer: Demo Player</div>
                  </div>

                  <!-- Match Table -->
                  <div class="border-2 rounded-lg overflow-hidden" :style="{ borderColor: formData.theme?.accentColour || '#FFD700' }">
                    <div
                      class="px-3 py-2"
                      :style="{ backgroundColor: formData.theme?.backgroundColour ? `${formData.theme.backgroundColour}40` : 'rgba(255,215,0,0.15)' }"
                    >
                      <div :style="{ color: formData.theme?.textColour || '#FFFFFF' }" class="text-xs font-bold">Matches</div>
                    </div>
                    <div class="space-y-0 border-t" :style="{ borderColor: formData.theme?.accentColour || '#FFD700' }">
                      <div
                        class="px-3 py-2 border-b text-xs flex justify-between"
                        :style="{
                          borderColor: formData.theme?.accentColour || '#FFD700',
                          backgroundColor: formData.theme?.backgroundColour ? `${formData.theme.backgroundColour}20` : 'rgba(0,0,0,0.3)',
                          color: formData.theme?.textColour || '#FFFFFF'
                        }"
                      >
                        <span>Team A vs Team B</span>
                        <button
                          type="button"
                          class="px-2 py-0.5 rounded text-xs transition-colors"
                          :style="{
                            backgroundColor: formData.theme?.accentColour ? `${formData.theme.accentColour}33` : 'rgba(255,215,0,0.2)',
                            color: formData.theme?.accentColour || '#FFD700',
                            border: `1px solid ${formData.theme?.accentColour || '#FFD700'}`
                          }"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Map List -->
                  <div class="space-y-2">
                    <div :style="{ color: formData.theme?.textColour || '#FFFFFF' }" class="text-xs font-medium">Maps:</div>
                    <div
                      v-for="i in 2"
                      :key="i"
                      class="text-xs px-3 py-1.5 rounded flex justify-between"
                      :style="{
                        backgroundColor: formData.theme?.backgroundColour ? `${formData.theme.backgroundColour}30` : 'rgba(45,45,45,1)',
                        color: formData.theme?.accentColour || '#FFD700'
                      }"
                    >
                      <span>Map {{ String.fromCharCode(64 + i) }}</span>
                      <span style="opacity: 0.7;">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <div v-if="typeof error === 'string'" class="text-sm text-red-400">
            {{ error }}
          </div>
          <div v-else-if="error && typeof error === 'object' && 'validationErrors' in error" class="space-y-3">
            <p class="text-sm font-medium text-red-400 mb-2">{{ error.message }}</p>
            <ul class="space-y-2">
              <li
                v-for="(fieldErrors, fieldName) in error.validationErrors"
                :key="fieldName"
                class="text-sm"
              >
                <div class="font-medium text-red-300 mb-1">
                  {{ formatFieldName(fieldName) }}:
                </div>
                <ul class="ml-4 space-y-1">
                  <li
                    v-for="(errorMsg, index) in fieldErrors"
                    :key="index"
                    class="text-red-400"
                  >
                    • {{ errorMsg }}
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

      <!-- Actions -->
      <div class="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6 flex items-center gap-3">
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
import { ref, onMounted, watch } from 'vue';
import { adminTournamentService, type CreateTournamentRequest, type TournamentDetail, ValidationError } from '@/services/adminTournamentService';
import { isValidHex } from '@/utils/colorUtils';
import MarkdownHelpModal from './MarkdownHelpModal.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import GameSelector from './GameSelector.vue';
import ServerSelector from './ServerSelector.vue';
import SocialMediaLinks from './SocialMediaLinks.vue';
import ImageUpload from './ImageUpload.vue';

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
  slug: '',
  organizer: '',
  game: 'bf1942' as 'bf1942' | 'fh2' | 'bfvietnam',
  anticipatedRoundCount: undefined as number | undefined,
  serverGuid: undefined as string | undefined,
  discordUrl: '',
  youTubeUrl: '',
  twitchUrl: '',
  forumUrl: '',
  promoVideoUrl: '',
  rules: '',
  registrationRules: '',
  status: 'draft' as 'draft' | 'registration' | 'open' | 'closed',
  gameMode: 'Conquest',
  weekDates: [] as Array<{ id?: number; week: string; startDate: string; endDate: string }>,
  files: [] as Array<{ id?: number; name: string; url: string; category?: string; uploadedAt?: string }>,
  theme: {
    backgroundColour: '#000000',
    textColour: '#FFFFFF',
    accentColour: '#FFD700',
  },
});

const loading = ref(false);
const error = ref<string | { message: string; validationErrors: Record<string, string[]> } | null>(null);

// Track if user has manually edited the slug
const slugManuallyEdited = ref(false);

// Generate slug from tournament name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Watch for name changes and auto-populate slug (only in create mode and if not manually edited)
watch(() => formData.value.name, (newName) => {
  if (!editMode.value && !slugManuallyEdited.value) {
    formData.value.slug = generateSlug(newName);
  }
});

// Track manual slug edits
function onSlugInput() {
  slugManuallyEdited.value = true;
}

// Panel collapse states
const expandedPanels = ref({
  basicInfo: true,
  scheduleAndRules: false,
  filesAndLinks: false,
  theme: false
});

// Week Dates management
const editingWeekIndex = ref<number | null>(null);
const editingWeekData = ref({ week: '', startDate: '', endDate: '' });
const showWeekForm = ref(false);

// Files management
const editingFileIndex = ref<number | null>(null);
const editingFileData = ref({ name: '', url: '', category: '' });
const showFileForm = ref(false);

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
const showMarkdownHelp = ref(false);

// Theme color input state
const bgColorInput = ref('#000000');
const textColorInput = ref('#FFFFFF');
const accentColorInput = ref('#FFD700');
const showThemePreview = ref(false);


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
      slug: props.tournament.slug || '',
      organizer: props.tournament.organizer,
      game: props.tournament.game,
      anticipatedRoundCount: props.tournament.anticipatedRoundCount,
      serverGuid: props.tournament.serverGuid,
      discordUrl: props.tournament.discordUrl || '',
      youTubeUrl: props.tournament.youTubeUrl || '',
      twitchUrl: props.tournament.twitchUrl || '',
      forumUrl: props.tournament.forumUrl || '',
      promoVideoUrl: props.tournament.promoVideoUrl || '',
      rules: props.tournament.rules || '',
      registrationRules: props.tournament.registrationRules || '',
      status: props.tournament.status || undefined,
      gameMode: props.tournament.gameMode || '',
      weekDates: props.tournament.weekDates ? [...props.tournament.weekDates] : [],
      files: props.tournament.files ? [...props.tournament.files] : [],
      theme: props.tournament.theme,
    };

    // Populate theme color inputs
    if (props.tournament.theme) {
      bgColorInput.value = props.tournament.theme.backgroundColour || '#000000';
      textColorInput.value = props.tournament.theme.textColour || '#FFFFFF';
      accentColorInput.value = props.tournament.theme.accentColour || '#FFD700';
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

// Theme system methods
const onBgColorChange = () => {
  let input = bgColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    if (!formData.value.theme) {
      formData.value.theme = { backgroundColour: '', textColour: '', accentColour: '' };
    }
    formData.value.theme.backgroundColour = input;
    bgColorInput.value = input;
  } else if (input === '') {
    // Allow clearing the field
    if (formData.value.theme) {
      formData.value.theme.backgroundColour = '';
    }
    bgColorInput.value = '#000000';
  }
};

const onTextColorChange = () => {
  let input = textColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    if (!formData.value.theme) {
      formData.value.theme = { backgroundColour: '', textColour: '', accentColour: '' };
    }
    formData.value.theme.textColour = input;
    textColorInput.value = input;
  } else if (input === '') {
    // Allow clearing the field
    if (formData.value.theme) {
      formData.value.theme.textColour = '';
    }
    textColorInput.value = '#FFFFFF';
  }
};

const onAccentColorChange = () => {
  let input = accentColorInput.value.trim();

  // Add # if missing
  if (input && !input.startsWith('#')) {
    input = '#' + input;
  }

  // Validate and update
  if (input && isValidHex(input)) {
    if (!formData.value.theme) {
      formData.value.theme = { backgroundColour: '', textColour: '', accentColour: '' };
    }
    formData.value.theme.accentColour = input;
    accentColorInput.value = input;
  } else if (input === '') {
    // Allow clearing the field
    if (formData.value.theme) {
      formData.value.theme.accentColour = '';
    }
    accentColorInput.value = '#FFD700';
  }
};

const applyPreset = (presetName: string) => {
  if (!formData.value.theme) {
    formData.value.theme = { backgroundColour: '', textColour: '', accentColour: '' };
  }

  const presets: Record<string, { backgroundColour: string; textColour: string; accentColour: string }> = {
    dark: {
      backgroundColour: '#000000',
      textColour: '#FFFFFF',
      accentColour: '#FFD700',
    },
    light: {
      backgroundColour: '#FFFFFF',
      textColour: '#000000',
      accentColour: '#0066CC',
    },
    cyberpunk: {
      backgroundColour: '#0a0e27',
      textColour: '#FFFFFF',
      accentColour: '#FF00FF',
    },
    ocean: {
      backgroundColour: '#0f2c5c',
      textColour: '#FFFFFF',
      accentColour: '#00FFFF',
    },
  };

  const preset = presets[presetName];
  if (preset) {
    formData.value.theme = { ...preset };
    bgColorInput.value = preset.backgroundColour;
    textColorInput.value = preset.textColour;
    accentColorInput.value = preset.accentColour;
  }
};

// Week Dates management functions
const addWeek = () => {
  editingWeekIndex.value = null;
  editingWeekData.value = { week: '', startDate: '', endDate: '' };
  showWeekForm.value = true;
};

const editWeek = (index: number) => {
  editingWeekIndex.value = index;
  const week = formData.value.weekDates[index];
  editingWeekData.value = {
    week: week.week,
    startDate: week.startDate,
    endDate: week.endDate
  };
  showWeekForm.value = true;
};

const deleteWeek = (index: number) => {
  formData.value.weekDates.splice(index, 1);
};

const saveWeek = () => {
  if (!editingWeekData.value.week || !editingWeekData.value.startDate || !editingWeekData.value.endDate) {
    error.value = 'Please fill in all week fields';
    return;
  }

  if (editingWeekIndex.value !== null) {
    // Update existing week
    formData.value.weekDates[editingWeekIndex.value] = { ...editingWeekData.value };
  } else {
    // Add new week
    formData.value.weekDates.push({ ...editingWeekData.value });
  }

  showWeekForm.value = false;
  editingWeekIndex.value = null;
  editingWeekData.value = { week: '', startDate: '', endDate: '' };
};

// Files management functions
const addFile = () => {
  editingFileIndex.value = null;
  editingFileData.value = { name: '', url: '', category: '' };
  showFileForm.value = true;
};

const editFile = (index: number) => {
  editingFileIndex.value = index;
  const file = formData.value.files[index];
  editingFileData.value = {
    name: file.name,
    url: file.url,
    category: file.category || ''
  };
  showFileForm.value = true;
};

const deleteFile = (index: number) => {
  formData.value.files.splice(index, 1);
};

const saveFile = () => {
  if (!editingFileData.value.name || !editingFileData.value.url) {
    error.value = 'Please fill in name and URL fields';
    return;
  }

  if (editingFileIndex.value !== null) {
    // Update existing file
    formData.value.files[editingFileIndex.value] = { ...editingFileData.value };
  } else {
    // Add new file
    formData.value.files.push({ ...editingFileData.value });
  }

  showFileForm.value = false;
  editingFileIndex.value = null;
  editingFileData.value = { name: '', url: '', category: '' };
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    const request: CreateTournamentRequest = {
      name: formData.value.name.trim(),
      organizer: formData.value.organizer.trim(),
      game: formData.value.game,
      theme: {
        backgroundColour: formData.value.theme?.backgroundColour || '#000000',
        textColour: formData.value.theme?.textColour || '#FFFFFF',
        accentColour: formData.value.theme?.accentColour || '#FFD700',
      },
    };

    if (formData.value.anticipatedRoundCount) {
      request.anticipatedRoundCount = formData.value.anticipatedRoundCount;
    }

    if (formData.value.serverGuid) {
      request.serverGuid = formData.value.serverGuid;
    }

    if (formData.value.slug?.trim()) {
      request.slug = formData.value.slug.trim();
    }

    if (formData.value.discordUrl?.trim()) {
      request.discordUrl = formData.value.discordUrl.trim();
    }

    if (formData.value.youTubeUrl?.trim()) {
      request.youTubeUrl = formData.value.youTubeUrl.trim();
    }

    if (formData.value.twitchUrl?.trim()) {
      request.twitchUrl = formData.value.twitchUrl.trim();
    }

    if (formData.value.forumUrl?.trim()) {
      request.forumUrl = formData.value.forumUrl.trim();
    }

    if (formData.value.promoVideoUrl?.trim()) {
      request.promoVideoUrl = formData.value.promoVideoUrl.trim();
    }

    if (formData.value.rules?.trim()) {
      request.rules = formData.value.rules.trim();
    }

    if (formData.value.registrationRules?.trim()) {
      request.registrationRules = formData.value.registrationRules.trim();
    }

    if (formData.value.status) {
      request.status = formData.value.status;
    }

    if (formData.value.gameMode?.trim()) {
      request.gameMode = formData.value.gameMode.trim();
    }

    if (formData.value.weekDates.length > 0) {
      request.weekDates = formData.value.weekDates;
    }

    if (formData.value.files.length > 0) {
      request.files = formData.value.files.map(f => ({
        name: f.name,
        url: f.url,
        category: f.category
      }));
    }

    console.debug('Tournament request theme:', request.theme);

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
    if (err instanceof ValidationError) {
      error.value = {
        message: err.message,
        validationErrors: err.errors
      };
    } else {
      error.value = err instanceof Error ? err.message : 'Failed to save tournament';
    }
  } finally {
    loading.value = false;
  }
};

// Helper function to format field names for display
const formatFieldName = (fieldName: string): string => {
  // Handle JSON path notation (e.g., "$.weekDates[0].startDate")
  if (fieldName.startsWith('$.')) {
    fieldName = fieldName.substring(2);
  }
  
  // Handle array notation (e.g., "weekDates[0].startDate")
  fieldName = fieldName.replace(/\[\d+\]/g, '');
  
  // Split by dots and format each part
  const parts = fieldName.split('.');
  const formattedParts = parts.map(part => {
    // Convert camelCase to Title Case
    return part
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  });
  
  return formattedParts.join(' > ');
};
</script>

<style scoped src="./AddTournamentModal.vue.css"></style>
