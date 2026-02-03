<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { adminTournamentService, type TournamentMatch, type MatchFile, type MatchComment, type CreateMatchFileRequest, type CreateMatchCommentRequest } from '@/services/adminTournamentService';
import BaseModal from '@/components/BaseModal.vue';

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

// Edit state
const editingFileId = ref<number | null>(null);
const editingFile = ref({ name: '', url: '', tags: '' });
const editingCommentId = ref<number | null>(null);
const editingComment = ref('');

const hasUnsavedItems = computed(() => newFiles.value.length > 0 || newComments.value.length > 0);

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

    existingFiles.value.unshift({
      id: -1,
      name: newFile.value.name.trim() || url.hostname,
      url: newFile.value.url.trim(),
      tags: newFile.value.tags.trim() || 'gameplay',
      uploadedAt: new Date().toISOString(),
      isNew: true,
    } as DisplayFile);

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
  const index = existingFiles.value.findIndex(f => f.id === fileId);
  if (index !== -1) {
    existingFiles.value.splice(index, 1);
    // Remove from newFiles if it was a new file
    if (typeof fileId === 'string' || fileId < 0) {
      const newIndex = existingFiles.value.length - newFiles.value.length + index;
      if (newIndex >= 0 && newIndex < newFiles.value.length) {
        newFiles.value.splice(newIndex, 1);
      }
    }
  }
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

  existingComments.value.unshift({
    id: -1,
    content: newComment.value.trim(),
    createdAt: new Date().toISOString(),
    createdByUserId: 0,
    createdByUserEmail: '',
    updatedAt: new Date().toISOString(),
    isNew: true,
  } as DisplayComment);

  // Add to pending comments for saving
  newComments.value.push({
    content: newComment.value.trim(),
    isNew: true,
  });

  newComment.value = '';
};

const removeNewComment = (commentId: string | number) => {
  const index = existingComments.value.findIndex(c => c.id === commentId);
  if (index !== -1) {
    existingComments.value.splice(index, 1);
    // Remove from newComments if it was a new comment
    if (typeof commentId === 'string' || commentId < 0) {
      const newIndex = existingComments.value.length - newComments.value.length + index;
      if (newIndex >= 0 && newIndex < newComments.value.length) {
        newComments.value.splice(newIndex, 1);
      }
    }
  }
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
  if (!props.match || !hasUnsavedItems.value) return;

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

const handleClose = () => {
  emit('close');
};

onMounted(() => {
  loadFilesAndComments();
});
</script>

<template>
  <BaseModal
    :model-value="true"
    size="lg"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <template #header>
      <h3 class="modal-title">
        Match Files & Comments
      </h3>
      <p v-if="match" class="modal-subtitle">
        {{ match.team1Name }} vs {{ match.team2Name }} • {{ formatMatchDate(match.scheduledDate) }}
      </p>
    </template>

    <div class="space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style="border-color: #6e7681; border-top-color: #00fff2;" />
          <p class="text-sm" style="color: #6e7681;">Loading files and comments...</p>
        </div>
      </div>

      <template v-else>
        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <!-- Files Section -->
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-semibold mb-1" style="color: #e6edf3;">📎 Files & Links</h4>
            <p class="text-xs" style="color: #6e7681;">Add files, recordings, or links for this match</p>
          </div>

          <!-- Add File Form -->
          <div class="space-y-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                URL <span class="text-red-400">*</span>
              </label>
              <input
                v-model="newFile.url"
                type="url"
                placeholder="https://..."
                class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                :disabled="isProcessing"
                @input="autoFillFileDetails"
                @keydown.enter.prevent="addNewFile"
              >
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                  File Name
                </label>
                <input
                  v-model="newFile.name"
                  type="text"
                  placeholder="File name (auto-filled)"
                  class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  :disabled="isProcessing"
                  @keydown.enter.prevent="addNewFile"
                >
              </div>
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                  Category
                </label>
                <input
                  v-model="newFile.tags"
                  type="text"
                  placeholder="gameplay"
                  class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  :disabled="isProcessing"
                  @keydown.enter.prevent="addNewFile"
                >
              </div>
            </div>

            <button
              @click="addNewFile"
              :disabled="isProcessing || !newFile.url.trim()"
              class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded font-medium transition-colors"
            >
              + Add File
            </button>
          </div>

          <!-- Files List -->
          <div v-if="existingFiles.length > 0" class="space-y-2">
            <div
              v-for="file in existingFiles"
              :key="file.id"
              class="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 transition-all"
              :class="editingFileId === file.id ? 'border-cyan-500' : (file.isNew ? 'border-cyan-500/50' : '')"
            >
              <!-- View Mode -->
              <div v-if="editingFileId !== file.id" class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <a
                      :href="file.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm font-medium break-all hover:underline"
                      style="color: #00fff2;"
                    >
                      {{ file.name }} ↗️
                    </a>
                    <span v-if="file.isNew" class="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Unsaved</span>
                  </div>
                  <p class="text-xs truncate" style="color: #6e7681;">{{ file.url }}</p>
                  <p v-if="file.tags" class="text-xs mt-1" style="color: #8b949e;">Category: {{ file.tags }}</p>
                </div>
                <div class="flex-shrink-0 flex gap-2">
                  <button
                    @click="startEditFile(file)"
                    :disabled="isProcessing"
                    class="px-2 py-1 text-xs transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 hover:text-cyan-400"
                    style="color: #8b949e;"
                    title="Edit file"
                  >
                    ✎
                  </button>
                  <button
                    @click="deleteExistingFile(file.id)"
                    :disabled="isProcessing"
                    class="px-2 py-1 text-xs transition-colors disabled:opacity-50 hover:text-red-400"
                    :class="file.isNew ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                    style="color: #8b949e;"
                    title="Delete file"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-3">
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                    File Name
                  </label>
                  <input
                    v-model="editingFile.name"
                    type="text"
                    placeholder="File name"
                    class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    :disabled="isProcessing"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                    URL
                  </label>
                  <input
                    v-model="editingFile.url"
                    type="url"
                    placeholder="https://..."
                    class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    :disabled="isProcessing"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                    Category
                  </label>
                  <input
                    v-model="editingFile.tags"
                    type="text"
                    placeholder="gameplay"
                    class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    :disabled="isProcessing"
                  />
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    @click="cancelEditFile"
                    :disabled="isProcessing"
                    class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveEditFile(file.id as number)"
                    :disabled="isProcessing"
                    class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    {{ isProcessing ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-semibold mb-1" style="color: #e6edf3;">💬 Comments</h4>
            <p class="text-xs" style="color: #6e7681;">Add notes or comments about this match</p>
          </div>

          <!-- Add Comment Form -->
          <div class="space-y-3 bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                Comment
              </label>
              <textarea
                v-model="newComment"
                placeholder="Enter your comment..."
                class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                :disabled="isProcessing"
                rows="3"
                @keydown.enter.exact.prevent="addNewComment"
              />
            </div>

            <button
              @click="addNewComment"
              :disabled="isProcessing || !newComment.trim()"
              class="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded font-medium transition-colors"
            >
              + Add Comment
            </button>
          </div>

          <!-- Comments List -->
          <div v-if="existingComments.length > 0" class="space-y-2">
            <div
              v-for="comment in existingComments"
              :key="comment.id"
              class="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 transition-all"
              :class="editingCommentId === comment.id ? 'border-cyan-500' : (comment.isNew ? 'border-cyan-500/50' : '')"
            >
              <!-- View Mode -->
              <div v-if="editingCommentId !== comment.id" class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm break-words whitespace-pre-wrap mb-1" style="color: #e6edf3;">{{ comment.content }}</p>
                  <p class="text-xs" style="color: #6e7681;">{{ formatCommentDate(comment.createdAt) }}</p>
                  <span v-if="comment.isNew" class="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Unsaved</span>
                </div>
                <div class="flex-shrink-0 flex gap-2">
                  <button
                    @click="startEditComment(comment)"
                    :disabled="isProcessing"
                    class="px-2 py-1 text-xs transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 hover:text-cyan-400"
                    style="color: #8b949e;"
                    title="Edit comment"
                  >
                    ✎
                  </button>
                  <button
                    @click="deleteExistingComment(comment.id)"
                    :disabled="isProcessing"
                    class="px-2 py-1 text-xs transition-colors disabled:opacity-50 hover:text-red-400"
                    :class="comment.isNew ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                    style="color: #8b949e;"
                    title="Delete comment"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-3">
                <div>
                  <label class="block text-xs font-medium mb-1.5" style="color: #8b949e;">
                    Comment
                  </label>
                  <textarea
                    v-model="editingComment"
                    placeholder="Comment..."
                    class="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                    :disabled="isProcessing"
                    rows="3"
                  />
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    @click="cancelEditComment"
                    :disabled="isProcessing"
                    class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveEditComment(comment.id as number)"
                    :disabled="isProcessing"
                    class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    {{ isProcessing ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          @click="handleClose"
          :disabled="isProcessing"
        >
          {{ hasUnsavedItems ? 'Cancel' : 'Close' }}
        </button>
        <button
          v-if="hasUnsavedItems"
          class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSave"
          :disabled="isProcessing"
        >
          <div v-if="isProcessing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{{ isProcessing ? 'Saving...' : `Save ${newFiles.length + newComments.length} Item${newFiles.length + newComments.length !== 1 ? 's' : ''}` }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.group:hover .opacity-0 {
  opacity: 1;
}
</style>
