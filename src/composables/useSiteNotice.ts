import { ref, computed } from 'vue';
import type { SiteNotice } from '@/types/playerStatsTypes';

const DISMISSED_NOTICES_KEY = 'bf1942_dismissed_notices';

// Global reactive state
const notice = ref<SiteNotice | null>(null);
const dismissedNoticeIds = ref<Set<string>>(new Set());

// Load dismissed notices from localStorage
function loadDismissedNotices(): void {
  try {
    const stored = localStorage.getItem(DISMISSED_NOTICES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        dismissedNoticeIds.value = new Set(parsed);
      }
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Save dismissed notices to localStorage
function saveDismissedNotices(): void {
  try {
    const ids = Array.from(dismissedNoticeIds.value);
    localStorage.setItem(DISMISSED_NOTICES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore localStorage errors
  }
}

// Check if notice is expired
function isExpired(noticeData: SiteNotice): boolean {
  if (!noticeData.expiresAt) {
    return false;
  }
  try {
    const expiresAt = new Date(noticeData.expiresAt);
    return expiresAt.getTime() < Date.now();
  } catch {
    return false;
  }
}

// Initialize on module load
loadDismissedNotices();

export function useSiteNotice() {
  const isDismissed = computed(() => {
    if (!notice.value) return false;
    return dismissedNoticeIds.value.has(notice.value.id);
  });

  const isVisible = computed(() => {
    if (!notice.value) return false;
    if (!notice.value.content) return false; // Don't show banner with empty content
    if (isDismissed.value) return false;
    if (isExpired(notice.value)) return false;
    return true;
  });

  const currentNotice = computed(() => notice.value);

  function setNotice(newNotice: SiteNotice | null | undefined): void {
    notice.value = newNotice ?? null;
  }

  function dismissNotice(): void {
    if (!notice.value || !notice.value.dismissible) return;
    dismissedNoticeIds.value.add(notice.value.id);
    saveDismissedNotices();
  }

  function clearDismissedNotice(noticeId: string): void {
    dismissedNoticeIds.value.delete(noticeId);
    saveDismissedNotices();
  }

  function clearAllDismissed(): void {
    dismissedNoticeIds.value.clear();
    saveDismissedNotices();
  }

  return {
    notice: currentNotice,
    isVisible,
    isDismissed,
    setNotice,
    dismissNotice,
    clearDismissedNotice,
    clearAllDismissed,
  };
}
