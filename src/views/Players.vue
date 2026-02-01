<template>
  <div class="portal-page">
    <div class="portal-grid" aria-hidden="true" />
    <div class="portal-inner">
      <!-- Hero Section -->
      <div class="w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] mb-6">
        <div class="w-full max-w-screen-2xl mx-auto px-0 sm:px-8 lg:px-12 py-8">
        <!-- Search Form -->
        <form class="flex justify-center px-4 sm:px-0" @submit.prevent="executeSearch">
          <div class="relative w-full max-w-xl">
            <!-- Search Icon -->
            <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-neutral-500"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>

            <!-- Search Input -->
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search players..."
              class="w-full pl-12 pr-24 py-3.5 bg-[var(--portal-surface-elevated)] border border-[var(--portal-border)] rounded-lg text-[var(--portal-text-bright)] placeholder-[var(--portal-text)] focus:outline-none focus:border-[var(--portal-accent)] transition-colors"
              @keydown.enter.prevent="executeSearch"
            >

            <!-- Search Button -->
            <button
              type="submit"
              :disabled="!searchQuery.trim() || isSearching"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--portal-accent)] hover:opacity-90 disabled:bg-[var(--portal-border)] disabled:text-[var(--portal-text)] text-[var(--portal-bg)] font-semibold text-sm rounded-md transition-colors disabled:cursor-not-allowed"
            >
              <span v-if="isSearching">...</span>
              <span v-else>Search</span>
            </button>
          </div>
        </form>
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-full max-w-screen-2xl mx-auto px-0 sm:px-8 lg:px-12 py-8">
        <PlayersPage
        ref="playersPageRef"
        :search-query="activeSearchQuery"
        :manual-search="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlayersPage from '../components/PlayersPage.vue'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const activeSearchQuery = ref('')
const isSearching = ref(false)
const playersPageRef = ref<InstanceType<typeof PlayersPage> | null>(null)

function initFromRoute() {
  const q = route.query.q
  if (typeof q === 'string' && q.trim()) {
    const trimmed = q.trim()
    searchQuery.value = trimmed
    activeSearchQuery.value = trimmed
  }
}

onMounted(initFromRoute)
watch(() => route.query.q, () => initFromRoute())

const executeSearch = async () => {
  if (!searchQuery.value.trim()) return

  const trimmed = searchQuery.value.trim()
  isSearching.value = true
  activeSearchQuery.value = trimmed

  router.replace({ path: '/players', query: { ...route.query, q: trimmed } })

  await new Promise(resolve => setTimeout(resolve, 100))
  isSearching.value = false
}
</script>

<style src="./portal-layout.css"></style>
