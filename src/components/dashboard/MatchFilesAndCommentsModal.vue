<template>
  <div
    class="modal-mobile-safe fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Match Files & Comments
            </h2>
            <p v-if="match" class="text-slate-400 text-sm mt-1">
              {{ match.team1Name }} vs {{ match.team2Name }} • {{ formatMatchDate(match.scheduledDate) }}
            </p>
          </div>
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

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p class="text-slate-400 text-sm">Loading files and comments...</p>
          </div>
        </div>

        <template v-else>
          <!-- Error Message -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>

          <!-- Files Panel -->
          <div class="space-y-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
            <!-- Add Link Input -->
            <div class="space-y-2">
              <div>
                <h3 class="text-sm font-medium text-slate-300">📎 Links</h3>
                <p class="text-xs text-slate-500 mt-1">Paste URL (auto-fills name), press Enter to add</p>
              </div>

              <!-- Compact Link Input -->
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="newFile.url"
                    type="url"
                    placeholder="https://..."
                    class="flex-1 px-3 py-2 bg-slate-900/40 text-slate-200 placeholder-slate-500 text-xs focus:outline-none rounded-lg"
                    :disabled="isProcessing"
                    @input="autoFillFileDetails"
                    @keydown.enter.prevent="addNewFile"
                  >
                  <button
                    @click="addNewFile"
                    :disabled="isProcessing || !newFile.url.trim()"
                    class="px-3 py-2 bg-slate-900/40 hover:bg-slate-800/60 text-cyan-400 hover:text-cyan-300 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Add link (or press Enter)"
                  >
                    +
                  </button>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newFile.name"
                    type="text"
                    placeholder="File name (auto-filled)"
                    class="flex-1 px-3 py-2 bg-slate-900/40 text-slate-200 placeholder-slate-500 text-xs focus:outline-none rounded-lg"
                    :disabled="isProcessing"
                    @keydown.enter.prevent="addNewFile"
                  >
                  <input
                    v-model="newFile.tags"
                    type="text"
                    placeholder="gameplay"
                    class="w-24 px-2 py-2 bg-slate-900/60 text-slate-200 placeholder-slate-500 text-xs focus:outline-none border border-slate-700/50 rounded-lg"
                    :disabled="isProcessing"
                    @keydown.enter.prevent="addNewFile"
                  >
                </div>
              </div>
            </div>

            <!-- Files List -->
            <div v-if="existingFiles.length > 0" class="space-y-2 border-t border-slate-700/30 pt-3">
              <div
                v-for="file in existingFiles"
                :key="file.id"
                :class="[
                  'rounded border transition-all p-3',
                  editingFileId === file.id ? 'bg-slate-900/60 border-cyan-500/50' : (file.isNew ? 'bg-cyan-900/20 border-cyan-500/50 animate-pulse-once' : 'bg-slate-800/50 border-slate-700/30 group hover:bg-slate-800/70')
                ]"
              >
                <!-- View Mode -->
                <div v-if="editingFileId !== file.id" class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <a
                        :href="file.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs text-cyan-400 hover:text-cyan-300 font-medium break-all"
                      >
                        {{ file.name }} ↗️
                      </a>
                      <span v-if="file.isNew" class="text-xs px-2 py-0.5 bg-cyan-500/30 text-cyan-300 rounded">Unsaved</span>
                    </div>
                    <p class="text-xs text-slate-500 truncate mt-0.5">{{ file.url }}</p>
                    <p v-if="file.tags" class="text-xs text-slate-400 mt-1">{{ file.tags }}</p>
                  </div>
                  <div class="flex-shrink-0 flex gap-2">
                    <button
                      @click="startEditFile(file)"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      title="Edit file"
                    >
                      ✎
                    </button>
                    <button
                      @click="deleteExistingFile(file.id)"
                      :disabled="isProcessing"
                      :class="[
                        'px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50',
                        file.isNew ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      ]"
                      title="Delete file"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Edit Mode -->
                <div v-else class="space-y-2">
                  <input
                    v-model="editingFile.name"
                    type="text"
                    placeholder="File name"
                    class="w-full px-2 py-1 bg-slate-800/50 text-slate-200 placeholder-slate-500 text-xs focus:outline-none rounded border border-slate-600/50"
                    :disabled="isProcessing"
                  />
                  <input
                    v-model="editingFile.url"
                    type="url"
                    placeholder="https://..."
                    class="w-full px-2 py-1 bg-slate-800/50 text-slate-200 placeholder-slate-500 text-xs focus:outline-none rounded border border-slate-600/50"
                    :disabled="isProcessing"
                  />
                  <input
                    v-model="editingFile.tags"
                    type="text"
                    placeholder="gameplay"
                    class="w-full px-2 py-1 bg-slate-800/50 text-slate-200 placeholder-slate-500 text-xs focus:outline-none rounded border border-slate-600/50"
                    :disabled="isProcessing"
                  />
                  <div class="flex justify-end gap-2">
                    <button
                      @click="cancelEditFile"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveEditFile(file.id as number)"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {{ isProcessing ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Files Message -->
            <div v-else class="text-center py-4 text-slate-500 text-xs border-t border-slate-700/30 pt-3">
              No files yet
            </div>
          </div>

          <!-- Comments Panel -->
          <div class="space-y-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
            <!-- Add Comment Input -->
            <div class="space-y-2">
              <div>
                <h3 class="text-sm font-medium text-slate-300">💬 Comments</h3>
                <p class="text-xs text-slate-500 mt-1">Paste comment, press Enter to add</p>
              </div>

              <!-- Comments Input with Auto-Add -->
              <div class="relative space-y-2">
                <textarea
                  v-model="newComment"
                  @keydown.enter.exact.prevent="addNewComment"
                  placeholder="Your comment..."
                  class="w-full px-3 py-2 bg-slate-900/40 text-slate-200 placeholder-slate-500 text-xs resize-none focus:outline-none rounded-lg"
                  :disabled="isProcessing"
                  rows="2"
                />
                <div class="flex justify-end">
                  <button
                    @click="addNewComment"
                    :disabled="isProcessing || !newComment.trim()"
                    class="px-3 py-1.5 bg-slate-900/40 hover:bg-slate-800/60 text-cyan-400 hover:text-cyan-300 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Add comment (or press Enter)"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Comments List -->
            <div v-if="existingComments.length > 0" class="space-y-2 border-t border-slate-700/30 pt-3">
              <div
                v-for="comment in existingComments"
                :key="comment.id"
                :class="[
                  'rounded border transition-all p-3',
                  editingCommentId === comment.id ? 'bg-slate-900/60 border-cyan-500/50' : (comment.isNew ? 'bg-cyan-900/20 border-cyan-500/50 animate-pulse-once' : 'bg-slate-800/50 border-slate-700/30 group hover:bg-slate-800/70')
                ]"
              >
                <!-- View Mode -->
                <div v-if="editingCommentId !== comment.id" class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-xs text-slate-300 break-words whitespace-pre-wrap flex-1">{{ comment.content }}</p>
                      <span v-if="comment.isNew" class="flex-shrink-0 text-xs px-2 py-0.5 bg-cyan-500/30 text-cyan-300 rounded">Unsaved</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">{{ formatCommentDate(comment.createdAt) }}</p>
                  </div>
                  <div class="flex-shrink-0 flex gap-2">
                    <button
                      @click="startEditComment(comment)"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      title="Edit comment"
                    >
                      ✎
                    </button>
                    <button
                      @click="deleteExistingComment(comment.id)"
                      :disabled="isProcessing"
                      :class="[
                        'px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50',
                        comment.isNew ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      ]"
                      title="Delete comment"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- Edit Mode -->
                <div v-else class="space-y-2">
                  <textarea
                    v-model="editingComment"
                    placeholder="Comment..."
                    class="w-full px-2 py-1 bg-slate-800/50 text-slate-200 placeholder-slate-500 text-xs resize-none focus:outline-none rounded border border-slate-600/50"
                    :disabled="isProcessing"
                    rows="3"
                  />
                  <div class="flex justify-end gap-2">
                    <button
                      @click="cancelEditComment"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveEditComment(comment.id as number)"
                      :disabled="isProcessing"
                      class="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {{ isProcessing ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Comments Message -->
            <div v-else class="text-center py-4 text-slate-500 text-xs border-t border-slate-700/30 pt-3">
              No comments yet
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-6 flex items-center justify-end gap-3">
        <button
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors disabled:opacity-50"
          @click="$emit('close')"
          :disabled="isProcessing"
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSave"
          :disabled="isProcessing || (newFiles.length === 0 && newComments.length === 0)"
          :title="newFiles.length === 0 && newComments.length === 0 ? 'No unsaved items to save' : ''"
        >
          <div v-if="isProcessing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span v-if="isProcessing">Saving...</span>
          <span v-else>Save {{ newFiles.length + newComments.length }} Item{{ newFiles.length + newComments.length !== 1 ? 's' : '' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminTournamentService, type TournamentMatch, type MatchFile, type MatchComment, type CreateMatchFileRequest, type CreateMatchCommentRequest } from '@/services/adminTournamentService';

interface Props {
  match: TournamentMatch | null;
  tournamentId: number;
}

interface FileEntry {
  name: string;
  url: string;
  tags: string;
  isNew?: boolean;
}

interface CommentEntry {
  content: string;
  isNew?: boolean;
}

interface DisplayFile extends MatchFile {
  isNew?: boolean;
}

interface DisplayComment extends MatchComment {
  isNew?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const isLoading = ref(true);
const isProcessing = ref(false);
const error = ref<string | null>(null);

const existingFiles = ref<DisplayFile[]>([]);
const existingComments = ref<DisplayComment[]>([]);
const newFiles = ref<FileEntry[]>([]);
const newComments = ref<CommentEntry[]>([]);
const newFile = ref({ name: '', url: '', tags: 'gameplay' });
const newComment = ref('');
const recentlyAddedCommentId = ref<string | null>(null);
const recentlyAddedFileId = ref<string | null>(null);

// Edit state
const editingFileId = ref<number | null>(null);
const editingFile = ref({ name: '', url: '', tags: '' });
const editingCommentId = ref<number | null>(null);
const editingComment = ref('');

const formatMatchDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

const loadFilesAndComments = async () => {
  if (!props.match) return;

  isLoading.value = true;
  error.value = null;

  try {
    const data = await adminTournamentService.getMatchFilesAndComments(props.tournamentId, props.match.id);
    existingFiles.value = data.files;
    existingComments.value = data.comments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Error loading files and comments:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load files and comments';
  } finally {
    isLoading.value = false;
  }
};

const autoFillFileDetails = () => {
  if (!newFile.value.url.trim()) {
    newFile.value.name = '';
    return;
  }

  try {
    const url = new URL(newFile.value.url.trim());
    if (!newFile.value.name) {
      newFile.value.name = url.hostname;
    }
  } catch {
    // Invalid URL, skip auto-fill
  }
};

const addNewFile = () => {
  if (!newFile.value.url.trim()) return;

  try {
    const url = new URL(newFile.value.url.trim());
    const fileId = `temp-file-${Date.now()}`;

    existingFiles.value.unshift({
      id: -1,
      name: newFile.value.name.trim() || url.hostname,
      url: newFile.value.url.trim(),
      tags: newFile.value.tags.trim() || 'gameplay',
      uploadedAt: new Date().toISOString(),
      isNew: true,
    } as DisplayFile);

    recentlyAddedFileId.value = fileId;
    setTimeout(() => {
      recentlyAddedFileId.value = null;
    }, 1500);

    // Add to pending files for saving
    newFiles.value.push({
      name: newFile.value.name.trim() || url.hostname,
      url: newFile.value.url.trim(),
      tags: newFile.value.tags.trim() || 'gameplay',
      isNew: true,
    });

    newFile.value = { name: '', url: '', tags: 'gameplay' };
  } catch {
    error.value = 'Please enter a valid URL';
  }
};

const removeNewFile = (fileId: string | number) => {
  existingFiles.value = existingFiles.value.filter(f => f.id !== fileId);
  newFiles.value = newFiles.value.filter((_, idx) => {
    const file = existingFiles.value[idx];
    return !file || file.id !== fileId;
  });
};

const deleteExistingFile = async (fileId: number | string) => {
  // If it's a new unsaved file, just remove it
  if (typeof fileId === 'string' || fileId < 0) {
    removeNewFile(fileId);
    return;
  }

  if (!props.match || !confirm('Delete this file?')) return;

  isProcessing.value = true;
  error.value = null;

  try {
    await adminTournamentService.deleteMatchFile(props.tournamentId, props.match.id, fileId as number);
    existingFiles.value = existingFiles.value.filter(f => f.id !== fileId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete file';
  } finally {
    isProcessing.value = false;
  }
};

const addNewComment = () => {
  if (!newComment.value.trim()) return;

  const commentId = `temp-comment-${Date.now()}`;

  existingComments.value.unshift({
    id: -1,
    content: newComment.value.trim(),
    createdAt: new Date().toISOString(),
    createdByUserId: 0,
    createdByUserEmail: '',
    updatedAt: new Date().toISOString(),
    isNew: true,
  } as DisplayComment);

  recentlyAddedCommentId.value = commentId;
  setTimeout(() => {
    recentlyAddedCommentId.value = null;
  }, 1500);

  // Add to pending comments for saving
  newComments.value.push({
    content: newComment.value.trim(),
    isNew: true,
  });

  newComment.value = '';
};

const removeNewComment = (commentId: string | number) => {
  existingComments.value = existingComments.value.filter(c => c.id !== commentId);
  newComments.value = newComments.value.filter((_, idx) => {
    const comment = existingComments.value[idx];
    return !comment || comment.id !== commentId;
  });
};

const deleteExistingComment = async (commentId: number | string) => {
  // If it's a new unsaved comment, just remove it
  if (typeof commentId === 'string' || commentId < 0) {
    removeNewComment(commentId);
    return;
  }

  if (!props.match || !confirm('Delete this comment?')) return;

  isProcessing.value = true;
  error.value = null;

  try {
    await adminTournamentService.deleteMatchComment(props.tournamentId, props.match.id, commentId as number);
    existingComments.value = existingComments.value.filter(c => c.id !== commentId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete comment';
  } finally {
    isProcessing.value = false;
  }
};

const startEditFile = (file: DisplayFile) => {
  editingFileId.value = file.id as number;
  editingFile.value = {
    name: file.name,
    url: file.url,
    tags: file.tags,
  };
};

const cancelEditFile = () => {
  editingFileId.value = null;
  editingFile.value = { name: '', url: '', tags: '' };
};

const saveEditFile = async (fileId: number) => {
  if (!props.match || !editingFile.value.url.trim()) {
    error.value = 'URL is required';
    return;
  }

  isProcessing.value = true;
  error.value = null;

  try {
    const updatedFile = await adminTournamentService.updateMatchFile(
      props.tournamentId,
      props.match.id,
      fileId,
      {
        name: editingFile.value.name.trim(),
        url: editingFile.value.url.trim(),
        tags: editingFile.value.tags.trim(),
      }
    );

    const index = existingFiles.value.findIndex(f => f.id === fileId);
    if (index !== -1) {
      existingFiles.value[index] = { ...updatedFile, isNew: false } as DisplayFile;
    }

    editingFileId.value = null;
    editingFile.value = { name: '', url: '', tags: '' };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update file';
  } finally {
    isProcessing.value = false;
  }
};

const startEditComment = (comment: DisplayComment) => {
  editingCommentId.value = comment.id as number;
  editingComment.value = comment.content;
};

const cancelEditComment = () => {
  editingCommentId.value = null;
  editingComment.value = '';
};

const saveEditComment = async (commentId: number) => {
  if (!props.match || !editingComment.value.trim()) {
    error.value = 'Comment cannot be empty';
    return;
  }

  isProcessing.value = true;
  error.value = null;

  try {
    const updatedComment = await adminTournamentService.updateMatchComment(
      props.tournamentId,
      props.match.id,
      commentId,
      {
        content: editingComment.value.trim(),
      }
    );

    const index = existingComments.value.findIndex(c => c.id === commentId);
    if (index !== -1) {
      existingComments.value[index] = { ...updatedComment, isNew: false } as DisplayComment;
    }

    editingCommentId.value = null;
    editingComment.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update comment';
  } finally {
    isProcessing.value = false;
  }
};

const handleSave = async () => {
  if (!props.match) return;

  isProcessing.value = true;
  error.value = null;

  try {
    // Create new files
    for (const file of newFiles.value) {
      const fileRequest: CreateMatchFileRequest = {
        name: file.name,
        url: file.url,
        tags: file.tags,
      };
      await adminTournamentService.createMatchFile(props.tournamentId, props.match.id, fileRequest);
    }

    // Create new comments
    for (const comment of newComments.value) {
      const commentRequest: CreateMatchCommentRequest = {
        content: comment.content,
      };
      await adminTournamentService.createMatchComment(props.tournamentId, props.match.id, commentRequest);
    }

    // Remove the "isNew" flags from saved items
    existingFiles.value = existingFiles.value.map(f => ({ ...f, isNew: false }));
    existingComments.value = existingComments.value.map(c => ({ ...c, isNew: false }));

    // Reset new items
    newFiles.value = [];
    newComments.value = [];
    newFile.value = { name: '', url: '', tags: 'gameplay' };
    newComment.value = '';

    // Reload to show new items
    await loadFilesAndComments();

    emit('saved');
  } catch (err) {
    console.error('Error saving files and comments:', err);
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Failed to save files and comments. Please try again.';
    }
  } finally {
    isProcessing.value = false;
  }
};

onMounted(() => {
  loadFilesAndComments();
});
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) rgba(71, 85, 105, 0.3);
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(71, 85, 105, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}

@keyframes pulse-once {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.animate-pulse-once {
  animation: pulse-once 0.6s ease-in-out;
}
</style>
