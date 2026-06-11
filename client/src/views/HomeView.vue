<template>
  <div class="home">
    <div class="home-container">
      <div class="search-section">
        <h1 class="title">SoundCloud Downloader</h1>
        <div class="search-wrapper">
          <input
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Coller un lien SoundCloud ou rechercher..."
            @input="onQueryInput"
            @keyup.enter="onSearch"
            @focus="showSuggestions = true"
            @blur="hideSuggestionsAfterClick"
          />
          <button
            class="search-button"
            @click="onSearch"
            :disabled="isLoading || !query.trim()"
          >
            <Search :size="20" />
          </button>

          <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
            <div
              v-for="(suggestion, idx) in suggestions"
              :key="idx"
              class="suggestion-item"
              @click="selectSuggestion(suggestion)"
            >
              {{ suggestion }}
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div v-if="results.length > 0" class="results-section">
        <div v-if="isLoading" class="skeleton-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card" />
        </div>

        <div v-else class="results-grid">
          <div
            v-for="track in results"
            :key="track.id"
            class="track-card"
          >
            <div class="artwork-container">
              <img
                v-if="track.artworkUrl"
                :src="track.artworkUrl"
                :alt="track.title"
                class="artwork"
              />
              <div v-else class="artwork-placeholder">
                <Music :size="32" />
              </div>
            </div>

            <div class="track-info">
              <h3 class="track-title">{{ track.title }}</h3>
              <p class="track-artist">{{ track.artist }}</p>

              <div class="track-meta">
                <span class="duration">{{ formatDuration(track.duration) }}</span>
                <span
                  v-if="track.policy !== 'ALLOW'"
                  class="policy-badge"
                  :class="track.policy.toLowerCase()"
                >
                  {{ track.policy }}
                </span>
              </div>
            </div>

            <button
              class="add-queue-button"
              @click="addToQueue(track)"
              :disabled="!track.streamable"
              :title="!track.streamable ? 'Stream not available' : 'Add to download queue'"
            >
              <Download :size="16" />
              Download
            </button>
          </div>
        </div>

        <button
          v-if="hasMore && !isLoading"
          class="load-more-button"
          @click="loadMore"
        >
          Load More
        </button>
      </div>

      <div v-if="queue.length > 0" class="download-queue-section">
        <div class="queue-header">
          <h2 class="queue-title">
            <Download :size="20" /> Download Queue
          </h2>
          <button
            v-if="queue.some(item => item.status === 'done')"
            class="clear-button"
            @click="clearCompleted"
          >
            Clear Completed
          </button>
        </div>

        <div class="queue-items">
          <div
            v-for="item in queue"
            :key="item.id"
            class="queue-item"
            :class="item.status"
          >
            <div class="queue-item-info">
              <div class="queue-item-title">{{ item.track.title }}</div>
              <div class="queue-item-artist">{{ item.track.artist }}</div>
              <div class="queue-item-status" :style="{ color: getStatusColor(item.status) }">
                {{ getStatusLabel(item.status) }}
              </div>
            </div>

            <div v-if="item.status !== 'done' && item.status !== 'error'" class="queue-item-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ item.progress }}%</span>
            </div>

            <div v-if="item.status === 'done'" class="queue-item-done">
              <CheckCircle :size="20" color="var(--color-success)" />
            </div>

            <div v-if="item.status === 'error'" class="queue-item-error">
              {{ item.error }}
            </div>

            <button
              v-if="item.status !== 'done' && item.status !== 'error'"
              class="queue-item-remove"
              @click="removeFromQueue(item.id)"
              title="Remove from queue"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoading && results.length === 0 && !error" class="features">
        <div class="feature-card">
          <div class="feature-icon">
            <Search :size="40" />
          </div>
          <h3 class="feature-title">Recherche rapide</h3>
          <p class="feature-description">
            Trouvez et téléchargez vos morceaux favoris en quelques clics
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <List :size="40" />
          </div>
          <h3 class="feature-title">File d'attente</h3>
          <p class="feature-description">
            Gérez plusieurs téléchargements simultanément avec une file d'attente
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <Download :size="40" />
          </div>
          <h3 class="feature-title">Téléchargement par lot</h3>
          <p class="feature-description">
            Téléchargez des playlists entières en une seule opération
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, List, Download, Music, Trash2, CheckCircle } from 'lucide-vue-next'
import useSearch from '@/composables/useSearch'
import useDownloadQueue from '@/composables/useDownloadQueue'

const {
  query,
  results,
  suggestions,
  isLoading,
  error,
  hasMore,
  onQueryInput,
  onSearch,
  loadMore
} = useSearch()

const {
  queue,
  addToQueue: addToDownloadQueue,
  removeFromQueue,
  clearCompleted
} = useDownloadQueue()

const showSuggestions = ref(false)

function selectSuggestion(suggestion) {
  query.value = suggestion
  showSuggestions.value = false
  onSearch()
}

function hideSuggestionsAfterClick() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 100)
}

function formatDuration(ms) {
  if (!ms) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    resolving: 'Résolution du stream',
    downloading: 'Téléchargement',
    converting: 'Conversion',
    done: 'Terminé',
    error: 'Erreur',
    cancelled: 'Annulé'
  }
  return labels[status] || status
}

async function addToQueue(track) {
  try {
    await addToDownloadQueue(track, 'medium')
  } catch (err) {
    console.error('Failed to add to download queue:', err)
  }
}

function getStatusColor(status) {
  const colors = {
    pending: 'var(--color-text-muted)',
    resolving: 'var(--color-text-secondary)',
    downloading: 'var(--color-accent)',
    converting: 'var(--color-accent-hover)',
    done: 'var(--color-success)',
    error: 'var(--color-error)',
    cancelled: 'var(--color-text-muted)'
  }
  return colors[status] || 'var(--color-text)'
}
</script>

<style scoped>
.home {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--spacing-3xl);
  background-color: var(--color-bg);
  min-height: 100vh;
}

.home-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3xl);
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  position: sticky;
  top: var(--spacing-3xl);
  z-index: var(--z-dropdown);
  background-color: var(--color-bg);
  padding-bottom: var(--spacing-xl);
}

.title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
}

.search-wrapper {
  display: flex;
  gap: var(--spacing-md);
  position: relative;
}

.search-input {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  transition: all var(--transition-default);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 3px rgba(255, 85, 0, 0.1);
  background-color: var(--color-surface-light);
}

.search-button {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  background-color: var(--color-accent);
  color: white;
  border: 2px solid var(--color-accent);
  transition: all var(--transition-default);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  transform: scale(1.05);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 2.5rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  max-height: 300px;
  overflow-y: auto;
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-md);
}

.suggestion-item {
  padding: var(--spacing-md) var(--spacing-xl);
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-default);
  border-bottom: 1px solid var(--color-border);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: var(--color-surface-light);
  color: var(--color-accent);
}

.error-message {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-2xl);
}

.skeleton-card {
  height: 280px;
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-light) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-lg);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-2xl);
}

.track-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-default);
}

.track-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  background-color: var(--color-surface-light);
}

.artwork-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-border);
}

.artwork {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  background-color: var(--color-border);
}

.track-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.track-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.track-artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.duration {
  color: var(--color-text-muted);
}

.policy-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
}

.policy-badge.monetize {
  background-color: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.policy-badge.block {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

.add-queue-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-default);
}

.add-queue-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: scale(1.05);
}

.add-queue-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.load-more-button {
  padding: var(--spacing-md) var(--spacing-2xl);
  background-color: var(--color-surface);
  color: var(--color-accent);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-default);
  align-self: center;
}

.load-more-button:hover {
  background-color: var(--color-accent);
  color: white;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-2xl);
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: all var(--transition-default);
  text-align: center;
}

.feature-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  background-color: var(--color-surface-light);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  color: white;
  margin-bottom: var(--spacing-lg);
}

.feature-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-md) 0;
}

.feature-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.download-queue-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-2xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queue-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.clear-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  transition: all var(--transition-default);
}

.clear-button:hover {
  background-color: var(--color-accent);
  color: white;
}

.queue-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-surface-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-default);
}

.queue-item.error {
  border-color: var(--color-error);
  background-color: rgba(239, 68, 68, 0.05);
}

.queue-item.done {
  border-color: var(--color-success);
  background-color: rgba(34, 197, 94, 0.05);
}

.queue-item-info {
  flex: 1;
  min-width: 0;
}

.queue-item-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item-artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item-status {
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}

.queue-item-progress {
  flex: 0.6;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 100px;
}

.progress-bar {
  height: 6px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: right;
}

.queue-item-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  flex: 0.6;
  text-align: right;
}

.queue-item-done {
  flex: 0.15;
  display: flex;
  justify-content: center;
}

.queue-item-remove {
  padding: var(--spacing-sm);
  background-color: transparent;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  transition: all var(--transition-default);
}

.queue-item-remove:hover {
  background-color: var(--color-error);
  color: white;
}
</style>
