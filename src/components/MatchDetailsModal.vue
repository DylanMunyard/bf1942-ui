<template>
  <div
    v-if="match"
    class="modal-mobile-safe fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div
      class="rounded-2xl p-6 w-[95vw] max-w-7xl shadow-2xl max-h-[90vh] overflow-y-auto border-2"
      :style="{
        background: backgroundSoftColor,
        backdropFilter: 'blur(10px)',
        borderColor: accentColor,
        backgroundColor: backgroundSoftColor
      }"
    >
      <!-- Header with Close Button -->
      <div class="flex items-start justify-between mb-8">
        <div class="flex-1">
          <h2 class="text-2xl md:text-4xl font-bold mb-3" :style="{ color: accentColor }">
            {{ match.team1Name }} <span :style="{ color: textMutedColor }">vs</span> {{ match.team2Name }}
          </h2>
          <div class="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm" :style="{ color: textMutedColor }">
            <span>📅 {{ formatMatchDate(match.scheduledDate) }}</span>
            <span v-if="match.serverName">🖥️ {{ match.serverName }}</span>
          </div>
        </div>
        <button
          class="p-2 rounded-lg transition-colors flex-shrink-0"
          :style="{ color: accentColor, backgroundColor: getAccentColorWithOpacity(0.2) }"
          @click="emit('close')"
          @mouseenter="(e) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.35);
            }
          }"
          @mouseleave="(e) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.2);
            }
          }"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Maps Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <template v-for="map in match.maps" :key="map.id">
          <!-- Map Card with Left/Right Layout -->
          <div class="rounded-xl border-2 p-4" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.05) }">
            <!-- Map Title and Selection Info -->
            <div class="mb-4">
              <h3 class="text-xl font-bold" :style="{ color: accentColor }">
                {{ map.mapName }}
              </h3>
              <p v-if="map.teamName" class="text-xs mt-1" :style="{ color: textMutedColor }">
                🎯 Selected by <span class="font-semibold">{{ map.teamName }}</span>
              </p>
            </div>

            <!-- Left/Right Layout: Image on Left, Results on Right -->
            <div class="flex gap-4">
              <!-- Left: Map Image (128px) -->
              <div v-if="getMapImageUrl(map)" class="flex-shrink-0 relative group">
                <div class="rounded-lg overflow-hidden border-2 w-32 h-32 cursor-pointer" :style="{ borderColor: accentColor }" @click="openFullscreenImage(getMapImageUrl(map), map.mapName)" @error="handleImageLoadError">
                  <img :src="getMapImageUrl(map)" :alt="map.mapName" class="w-full h-full object-cover" loading="lazy" @error="handleImageLoadError" />
                  <!-- Magnifying glass overlay -->
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors rounded-lg">
                    <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Right: Round Results -->
              <div class="flex-1">
                <div v-if="map.matchResults && map.matchResults.length > 0" class="space-y-0">
                  <!-- Team Names Header -->
                  <div class="grid grid-cols-2 gap-0 text-xs font-bold mb-2" :style="{ color: accentColor }">
                    <span class="text-center">{{ match.team1Name }}</span>
                    <span class="text-center">{{ match.team2Name }}</span>
                  </div>

                  <!-- Round Results -->
                  <div v-for="result in map.matchResults" :key="`${map.id}-${result.id}`" class="grid grid-cols-2 gap-0 text-xs rounded-lg overflow-hidden mb-1">
                    <!-- Team 1 Score -->
                    <div class="flex flex-col items-center justify-center gap-0.5 py-2 px-2" :style="{ backgroundColor: backgroundMuteColor }">
                      <span class="font-bold" :style="{ color: textColor }">{{ getTeamTickets(result, 'team1') }}</span>
                      <span v-if="result.winningTeamId === getTeamIdForColumn('team1')" class="text-sm animate-pulse">🏆</span>
                    </div>

                    <!-- Team 2 Score -->
                    <div class="flex flex-col items-center justify-center gap-0.5 py-2 px-2" :style="{ backgroundColor: backgroundMuteColor }">
                      <span class="font-bold" :style="{ color: textColor }">{{ getTeamTickets(result, 'team2') }}</span>
                      <span v-if="result.winningTeamId === getTeamIdForColumn('team2')" class="text-sm animate-pulse">🏆</span>
                    </div>
                  </div>

                  <!-- Map Subtotal -->
                  <div class="grid grid-cols-2 gap-0 text-xs rounded-lg overflow-hidden border-t-2 mt-2" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1) }">
                    <!-- Team 1 Total -->
                    <div class="flex flex-col items-center justify-center py-2 px-2 font-bold">
                      <span :style="{ color: accentColor }">{{ calculateMapTotal(map).team1 }}</span>
                    </div>
                    <!-- Team 2 Total -->
                    <div class="flex flex-col items-center justify-center py-2 px-2 font-bold">
                      <span :style="{ color: accentColor }">{{ calculateMapTotal(map).team2 }}</span>
                    </div>
                  </div>
                </div>

                <!-- No Results State -->
                <div v-else class="text-center py-4" :style="{ color: textMutedColor }">
                  <p class="text-xs">Waiting for results</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Match Summary Footer -->
      <div v-if="hasResults" class="rounded-xl p-6 border-4 mb-8" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1) }">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div class="flex-1">
            <h4 class="text-sm font-bold uppercase mb-3" :style="{ color: textMutedColor }">Match Summary</h4>
            <div class="flex flex-col md:flex-row gap-4 md:gap-8">
              <!-- Team 1 Total -->
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold" :style="{ color: textMutedColor }">{{ match.team1Name }}</span>
                <span class="text-3xl md:text-4xl font-bold" :style="{ color: accentColor }">{{ calculateGrandTotal().team1 }}</span>
              </div>

              <!-- Match Winner -->
              <div v-if="getMatchWinner()" class="flex items-center gap-2">
                <span class="text-4xl">🏆</span>
                <span class="text-sm font-bold uppercase" :style="{ color: accentColor }">{{ getMatchWinner() }}</span>
              </div>

              <!-- Team 2 Total -->
              <div class="flex items-center gap-3">
                <span class="text-3xl md:text-4xl font-bold" :style="{ color: accentColor }">{{ calculateGrandTotal().team2 }}</span>
                <span class="text-sm font-bold" :style="{ color: textMutedColor }">{{ match.team2Name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expandable Player Stats Section -->
      <!-- Note: Player stats are not available in the current API schema. This will be added in a future update. -->
      <div class="space-y-4">
        <div v-for="map in match.maps" :key="map.id" class="space-y-2">
          <!-- Player stats unavailable - will be added in future update -->
        </div>
      </div>

      <!-- Expandable Player Stats Table (Disabled until round data available) -->
      <!-- This section is disabled and will be implemented in a future update when player stats are available -->

      <!-- Files and Comments Section - Compact Pro Gamer Design -->
      <div v-if="hasFilesOrComments" class="mt-4 md:mt-6">
        <!-- Compact Toggle Button for Mobile -->
        <button
          class="md:hidden w-full px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-between transition-all duration-300 backdrop-blur-sm border-2 group"
          :style="{
            borderColor: accentColor,
            backgroundColor: getAccentColorWithOpacity(0.08),
            color: accentColor
          }"
          @click="filesCommentsExpanded = !filesCommentsExpanded"
          @mouseenter="(e) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.15);
            }
          }"
          @mouseleave="(e) => {
            if (e.currentTarget) {
              (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.08);
            }
          }"
        >
          <span class="flex items-center gap-1.5 text-base">
            <span class="group-hover:scale-110 transition-transform">📎</span>
            Files & Comments
          </span>
          <svg
            class="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
            :style="{ transform: filesCommentsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <!-- Files and Comments Content (collapsible on mobile) -->
        <div v-if="filesCommentsExpanded" class="space-y-3 mt-3 md:mt-4">
          <!-- Loading State Compact -->
          <div v-if="isLoadingFilesAndComments" class="text-center py-6">
            <div class="inline-flex flex-col items-center gap-2">
              <div class="relative w-8 h-8">
                <svg class="w-full h-full animate-spin" :style="{ color: accentColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p class="text-xs font-medium" :style="{ color: textMutedColor }">Loading...</p>
            </div>
          </div>

          <!-- Files Section Compact -->
          <div v-if="matchFiles.length > 0 && !isLoadingFilesAndComments" class="space-y-2">
            <div class="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 px-1">
              <span class="text-lg md:text-xl">📎</span>
              <h3 class="text-sm md:text-base font-bold" :style="{ color: accentColor }">Recordings</h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :style="{ backgroundColor: getAccentColorWithOpacity(0.2), color: accentColor }">
                {{ matchFiles.length }}
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="file in matchFiles"
                :key="file.id"
                class="group relative rounded-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm"
                :style="{
                  borderColor: accentColor,
                  backgroundColor: getAccentColorWithOpacity(0.04)
                }"
                @mouseenter="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.08);
                  }
                }"
                @mouseleave="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.04);
                  }
                }"
              >
                <!-- Gradient Top Border on Hover -->
                <div
                  class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  :style="{ backgroundImage: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }"
                />

                <div class="p-2.5 md:p-3">
                  <!-- File Name and Link Compact -->
                  <a
                    :href="file.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 font-semibold text-xs md:text-sm transition-all duration-300 group/link break-all"
                    :style="{ color: accentColor }"
                  >
                    <span class="group-hover/link:translate-x-0.5 transition-transform duration-300 truncate">{{ file.name }}</span>
                    <svg class="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <!-- File Metadata Inline Compact -->
                  <div class="flex flex-wrap items-center gap-1.5 mt-1.5 md:gap-2 md:mt-2">
                    <span class="text-xs font-medium px-2 py-0.5 rounded" :style="{ backgroundColor: getAccentColorWithOpacity(0.1), color: textMutedColor }">
                      {{ formatFileDate(file.uploadedAt) }}
                    </span>
                    <div v-if="file.tags" class="flex flex-wrap gap-1">
                      <span
                        v-for="(tag, idx) in file.tags.split(',').slice(0, 2)"
                        :key="`${file.id}-tag-${idx}`"
                        class="text-xs font-medium px-1.5 py-0.5 rounded border transition-all duration-300 cursor-default"
                        :style="{
                          backgroundColor: getAccentColorWithOpacity(0.1),
                          borderColor: accentColor,
                          color: accentColor
                        }"
                      >
                        {{ tag.trim() }}
                      </span>
                      <span v-if="file.tags.split(',').length > 2" class="text-xs font-medium px-1.5 py-0.5" :style="{ color: textMutedColor }">+{{ file.tags.split(',').length - 2 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comments Section Compact -->
          <div v-if="matchComments.length > 0 && !isLoadingFilesAndComments" class="space-y-2">
            <div class="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 px-1">
              <span class="text-lg md:text-xl">💬</span>
              <h3 class="text-sm md:text-base font-bold" :style="{ color: accentColor }">Comments</h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" :style="{ backgroundColor: getAccentColorWithOpacity(0.2), color: accentColor }">
                {{ matchComments.length }}
              </span>
            </div>

            <div class="space-y-2 max-h-[300px] md:max-h-[500px] overflow-y-auto">
              <div
                v-for="comment in matchComments"
                :key="comment.id"
                class="group relative rounded-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm p-2.5 md:p-3"
                :style="{
                  borderColor: accentColor,
                  backgroundColor: getAccentColorWithOpacity(0.04)
                }"
                @mouseenter="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.08);
                  }
                }"
                @mouseleave="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.04);
                  }
                }"
              >
                <!-- Gradient Left Border on Hover -->
                <div
                  class="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  :style="{ backgroundImage: `linear-gradient(180deg, ${accentColor}, ${accentColor}80)` }"
                />

                <!-- Comment Content Compact -->
                <div class="mb-1.5 text-xs md:text-sm leading-snug whitespace-pre-wrap break-words" :style="{ color: textColor }">
                  <span v-for="(part, idx) in parseCommentContent(comment.content)" :key="idx">
                    <a
                      v-if="part.url"
                      :href="part.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="font-semibold transition-all duration-300 hover:opacity-80 inline-flex items-center gap-0.5"
                      :style="{ color: accentColor }"
                    >
                      {{ part.text }}
                      <svg class="w-2.5 h-2.5 opacity-0 hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <span v-else>{{ part.text }}</span>
                  </span>
                </div>

                <!-- Comment Metadata Compact -->
                <div class="flex items-center gap-1 text-xs font-medium" :style="{ color: textMutedColor }">
                  <span>⏰</span>
                  <span>{{ formatCommentDate(comment.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Comparison Section -->
      <div class="mt-8 space-y-4">
        <h3 class="text-lg font-bold" :style="{ color: accentColor }">Compare Players</h3>

        <!-- Rosters Table -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse rounded-lg overflow-hidden border-2" :style="{ borderColor: accentColor }">
            <thead>
              <tr :style="{ backgroundColor: backgroundMuteColor }">
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b border-r-2" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1), color: accentColor }">
                  <div class="flex flex-col items-center gap-2">
                    <span>{{ match.team1Name }}</span>
                    <span class="text-xs font-normal" :style="{ color: textMutedColor }">
                      {{ getTeamRoster(match.team1Name).length }} players
                    </span>
                  </div>
                </th>
                <th class="p-4 text-center font-bold text-lg uppercase tracking-wide border-b" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.1), color: accentColor }">
                  <div class="flex flex-col items-center gap-2">
                    <span>{{ match.team2Name }}</span>
                    <span class="text-xs font-normal" :style="{ color: textMutedColor }">
                      {{ getTeamRoster(match.team2Name).length }} players
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(_, idx) in Math.max(
                  getTeamRoster(match.team1Name).length,
                  getTeamRoster(match.team2Name).length
                )"
                :key="idx"
                class="border-b transition-all"
                :style="{ borderColor: accentColor, backgroundColor: backgroundMuteColor }"
                @mouseenter="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = getAccentColorWithOpacity(0.08);
                  }
                }"
                @mouseleave="(e) => {
                  if (e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = backgroundMuteColor;
                  }
                }"
              >
                <!-- Team 1 Player -->
                <td class="p-3 border-r-2" :style="{ borderColor: accentColor, backgroundColor: getAccentColorWithOpacity(0.05) }">
                  <button
                    v-if="getTeamRoster(match.team1Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(match.team1Name)[idx].playerName)
                      ? 'border-2 font-bold'
                      : ''"
                    :style="isPlayerSelected(getTeamRoster(match.team1Name)[idx].playerName)
                      ? {
                          backgroundColor: getAccentColorWithOpacity(0.2),
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          color: accentColor
                        }"
                    @click="selectPlayerForComparison(getTeamRoster(match.team1Name)[idx].playerName)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(match.team1Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(match.team1Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: accentColor }">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
                <!-- Team 2 Player -->
                <td class="p-3" :style="{ backgroundColor: getAccentColorWithOpacity(0.05) }">
                  <button
                    v-if="getTeamRoster(match.team2Name)[idx]"
                    class="w-full text-left px-3 py-2 rounded-lg transition-all"
                    :class="isPlayerSelected(getTeamRoster(match.team2Name)[idx].playerName)
                      ? 'border-2 font-bold'
                      : ''"
                    :style="isPlayerSelected(getTeamRoster(match.team2Name)[idx].playerName)
                      ? {
                          backgroundColor: getAccentColorWithOpacity(0.2),
                          borderColor: accentColor,
                          color: accentColor
                        }
                      : {
                          color: accentColor
                        }"
                    @click="selectPlayerForComparison(getTeamRoster(match.team2Name)[idx].playerName)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ getTeamRoster(match.team2Name)[idx].playerName }}</span>
                      <svg v-if="isPlayerSelected(getTeamRoster(match.team2Name)[idx].playerName)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" :style="{ color: accentColor }">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Compare Button -->
        <div v-if="selectedPlayers.length === 2" class="text-center">
          <button
            class="px-8 py-4 font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
            :style="{ backgroundColor: accentColor, color: backgroundColor }"
            @click="emit('compare-players', selectedPlayers)"
            @mouseenter="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '0.8';
              }
            }"
            @mouseleave="(e) => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }
            }"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Compare {{ selectedPlayers[0] }} vs {{ selectedPlayers[1] }}</span>
            <span>⚡</span>
          </button>
        </div>
        <div v-else-if="selectedPlayers.length === 1" class="text-center text-slate-400 text-sm">
          Select one more player from the other team to compare
        </div>
      </div>
    </div>

    <!-- Full-screen Image Modal -->
    <div
      v-if="fullscreenImage"
      class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click="fullscreenImage = null"
    >
      <div class="relative max-w-7xl max-h-[90vh] flex flex-col items-center gap-4" @click.stop>
        <!-- Image -->
        <img
          :src="fullscreenImage.url"
          :alt="fullscreenImage.mapName"
          class="max-w-full max-h-[85vh] rounded-xl object-contain"
        />

        <!-- Map Name -->
        <div class="text-center text-white">
          <h3 class="text-2xl font-bold">{{ fullscreenImage.mapName }}</h3>
        </div>

        <!-- Close Button -->
        <button
          class="absolute top-4 right-4 p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
          @click="fullscreenImage = null"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PublicTournamentMatch, MatchFile, MatchComment } from '@/services/publicTournamentService'
import { publicTournamentService } from '@/services/publicTournamentService'

interface Team {
  id: number
  name: string
  players: Array<{ playerName: string }>
}

interface Props {
  match: PublicTournamentMatch | null
  teams: Team[]
  tournamentId: number | string
  accentColor: string
  textColor: string
  textMutedColor: string
  backgroundColor: string
  backgroundSoftColor: string
  backgroundMuteColor: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'compare-players': [players: string[]]
}>()

const selectedPlayers = ref<string[]>([])
const fullscreenImage = ref<{ url: string; mapName: string } | null>(null)
const matchFiles = ref<MatchFile[]>([])
const matchComments = ref<MatchComment[]>([])
const isLoadingFilesAndComments = ref(false)
const filesCommentsExpanded = ref(true)

// Fetch files and comments when match changes
watch(() => props.match?.id, async (matchId) => {
  if (!matchId) {
    matchFiles.value = []
    matchComments.value = []
    return
  }

  isLoadingFilesAndComments.value = true
  try {
    const tournamentId = typeof props.tournamentId === 'string' ? parseInt(props.tournamentId) : props.tournamentId
    const data = await publicTournamentService.getMatchFilesAndComments(tournamentId, matchId)
    matchFiles.value = data.files
    // Sort comments by createdAt descending (newest first)
    matchComments.value = data.comments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } finally {
    isLoadingFilesAndComments.value = false
  }
})

// Check if match has any results
const hasResults = computed(() => {
  if (!props.match?.maps) return false
  return props.match.maps.some(map => map.matchResults && map.matchResults.length > 0)
})

// Check if we have files or comments
const hasFilesOrComments = computed(() => {
  return matchFiles.value.length > 0 || matchComments.value.length > 0
})

// Helper: Get accent color with opacity
const getAccentColorWithOpacity = (opacity: number): string => {
  const color = props.accentColor
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Helper: Format match date
const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  return date.toLocaleDateString('en-US', options)
}

// Helper: Get map image URL
const getMapImageUrl = (map: any): string | undefined => {
  if (!map.imagePath) return undefined
  return `/stats/assets/tournaments/${map.imagePath}`
}

// Helper: Calculate total tickets for a specific map
const calculateMapTotal = (map: any) => {
  if (!props.match?.maps) {
    return { team1: 0, team2: 0 }
  }

  const team1Id = getTeamIdForColumn('team1')

  let team1Total = 0
  let team2Total = 0

  if (map.matchResults) {
    map.matchResults.forEach((roundResult: any) => {
      if (roundResult.team1Id === team1Id) {
        team1Total += roundResult.team1Tickets || 0
        team2Total += roundResult.team2Tickets || 0
      } else {
        team1Total += roundResult.team2Tickets || 0
        team2Total += roundResult.team1Tickets || 0
      }
    })
  }

  return { team1: team1Total, team2: team2Total }
}

// Helper: Get match winner
const getMatchWinner = (): string | null => {
  if (!props.match?.maps) return null

  const grandTotal = calculateGrandTotal()

  if (grandTotal.team1 > grandTotal.team2) {
    return props.match.team1Name
  } else if (grandTotal.team2 > grandTotal.team1) {
    return props.match.team2Name
  }

  // If tickets are equal, there's no winner (true tie)
  return null
}

// Helper: Get team roster/players
const getTeamRoster = (teamName: string) => {
  const team = props.teams.find(t => t.name === teamName)
  return team?.players || []
}

// Helper: Check if player is selected
const isPlayerSelected = (playerName: string): boolean => {
  return selectedPlayers.value.some(p => p === playerName)
}

// Helper: Select player for comparison
const selectPlayerForComparison = (playerName: string) => {
  const playerKey = playerName

  const index = selectedPlayers.value.indexOf(playerKey)
  if (index > -1) {
    selectedPlayers.value.splice(index, 1)
  } else if (selectedPlayers.value.length < 2) {
    selectedPlayers.value.push(playerKey)
  }
}

// Helper: Get the team ID for a specific column (team1 or team2)
const getTeamIdForColumn = (column: 'team1' | 'team2'): number | undefined => {
  if (!props.match) return undefined
  const targetName = column === 'team1' ? props.match.team1Name : props.match.team2Name

  // Find this team's ID from any round result
  for (const map of props.match.maps) {
    if (map.matchResults && map.matchResults.length > 0) {
      const result = map.matchResults[0]
      if (result.team1Name === targetName) return result.team1Id
      if (result.team2Name === targetName) return result.team2Id
    }
  }
  return undefined
}

// Helper: Get the correct ticket count for a specific team column in a result
const getTeamTickets = (result: any, column: 'team1' | 'team2'): number => {
  if (!props.match) return 0

  const targetTeamId = getTeamIdForColumn(column)
  if (!targetTeamId) return 0

  // Find which position this team is in for this particular result
  if (result.team1Id === targetTeamId) {
    return result.team1Tickets || 0
  } else if (result.team2Id === targetTeamId) {
    return result.team2Tickets || 0
  }
  return 0
}

// Helper: Open full-screen image viewer
const openFullscreenImage = (imageUrl: string | undefined, mapName: string) => {
  if (imageUrl) {
    fullscreenImage.value = { url: imageUrl, mapName }
  }
}

// Helper: Handle image load errors
const handleImageLoadError = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img && img.parentElement) {
    img.parentElement.style.display = 'none'
  }
}

// Helper: Calculate grand total across all rounds and maps
// Uses actual team IDs to handle cases where team1/team2 positions flip between rounds
const calculateGrandTotal = () => {
  if (!props.match?.maps) {
    return { team1: 0, team2: 0 }
  }

  // Get the two distinct teams from all rounds
  const teamsMap = new Map<number, { id: number, name: string }>()

  for (const map of props.match.maps) {
    if (map.matchResults && map.matchResults.length > 0) {
      for (const round of map.matchResults) {
        if (round.team1Id && round.team1Name) {
          teamsMap.set(round.team1Id, { id: round.team1Id, name: round.team1Name })
        }
        if (round.team2Id && round.team2Name) {
          teamsMap.set(round.team2Id, { id: round.team2Id, name: round.team2Name })
        }
      }
    }
  }

  if (teamsMap.size !== 2) {
    return { team1: 0, team2: 0 }
  }

  const teams = Array.from(teamsMap.values())
  const teamA = teams[0]
  const teamB = teams[1]

  // Determine which team is "team1" based on match-level team names
  const isATeam1 = teamA.name === props.match.team1Name
  const team1Id = isATeam1 ? teamA.id : teamB.id

  let team1Total = 0
  let team2Total = 0

  props.match.maps.forEach(map => {
    if (map.matchResults) {
      map.matchResults.forEach(result => {
        // Add tickets for each team based on their actual ID
        if (result.team1Id === team1Id) {
          team1Total += result.team1Tickets || 0
          team2Total += result.team2Tickets || 0
        } else {
          team1Total += result.team2Tickets || 0
          team2Total += result.team1Tickets || 0
        }
      })
    }
  })

  return {
    team1: team1Total,
    team2: team2Total
  }
}

// Helper: Format file upload date
const formatFileDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}

// Helper: Format comment date
const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return date.toLocaleDateString('en-US', options)
}

// Helper: Parse comment content and render URLs as links
const parseCommentContent = (content: string): Array<{ text: string; url?: string }> => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts: Array<{ text: string; url?: string }> = []

  let lastIndex = 0
  let match

  const tempRegex = new RegExp(urlRegex)
  while ((match = tempRegex.exec(content)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({ text: content.substring(lastIndex, match.index) })
    }

    // Add the URL
    parts.push({ text: match[0], url: match[0] })
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ text: content.substring(lastIndex) })
  }

  // If no URLs found, return the entire content
  if (parts.length === 0) {
    return [{ text: content }]
  }

  return parts
}
</script>
