<template>
  <section class="history-section">
    <div class="history-header">
      <div class="header-left">
        <h1 class="title">
          Historique
        </h1>
        <span class="count">· {{ downloadCount }} son{{ downloadCount !== 1 ? 's' : '' }}</span>
      </div>
      <div class="header-right">
        <button
          class="clear-btn"
          :disabled="queue.length === 0"
          @click="clearCompleted"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
          Tout effacer
        </button>
      </div>
    </div>

    <div class="history-body sc-scroll">
      <EmptyState
        v-if="queue.length === 0"
        :icon="DownloadIcon"
        title="Aucun téléchargement pour l'instant"
        description="Tes morceaux téléchargés apparaîtront ici, avec leur format et leur emplacement sur le disque."
      />

      <div
        v-else
        class="history-list"
      >
        <div
          v-for="item in queue"
          :key="item.id"
          class="history-item"
          :class="item.status"
        >
          <div
            class="thumb"
            :style="{ background: thumbColor(item.id) }"
          >
            <img
              v-if="item.track.artworkUrl"
              :src="item.track.artworkUrl"
              :alt="item.track.title"
              class="thumb-img"
            >
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34343f"
              stroke-width="2"
              stroke-linecap="round"
            >
              <line
                x1="6"
                y1="9"
                x2="6"
                y2="15"
              /><line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
              /><line
                x1="18"
                y1="9"
                x2="18"
                y2="15"
              />
            </svg>
          </div>

          <div class="info">
            <div
              class="track-title"
              :title="item.track.title"
            >
              {{ item.track.title }}
            </div>
            <div class="track-artist">
              {{ item.track.artist }}
            </div>
          </div>

          <div class="meta-date">
            <span
              class="status-label"
              :style="{ color: statusColor(item.status) }"
            >{{ statusLabel(item.status) }}</span>
          </div>

          <div
            v-if="item.status !== 'done' && item.status !== 'error'"
            class="progress-wrap"
          >
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: item.progress + '%' }"
              />
            </div>
            <span class="progress-text">{{ item.progress }}%</span>
          </div>

          <div
            v-if="item.status === 'error'"
            class="error-text"
          >
            {{ item.error }}
          </div>

          <div class="actions">
            <button
              v-if="item.status === 'done'"
              class="action-btn"
              title="Ouvrir dans le Finder"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 7a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
              </svg>
            </button>
            <button
              class="action-btn remove"
              title="Supprimer l'entrée"
              @click="removeFromQueue(item.id)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Download as DownloadIcon } from 'lucide-vue-next'
import useDownloadQueue from '@/composables/useDownloadQueue'
import EmptyState from '../ui/EmptyState.vue'

const { queue, removeFromQueue, clearCompleted } = useDownloadQueue()

const downloadCount = computed(() => queue.value.length)

const tones = ['#1d1d24', '#212129', '#191920', '#232331', '#1c1c23', '#26262f']
function thumbColor(id) {
  return tones[parseInt(id, 10) % tones.length] || tones[0]
}

function statusLabel(status) {
  return {
    pending: 'En attente', resolving: 'Résolution…', downloading: 'Téléchargement',
    converting: 'Conversion', done: 'Terminé', error: 'Erreur', cancelled: 'Annulé'
  }[status] || status
}

function statusColor(status) {
  return {
    pending: 'var(--color-text-muted)', resolving: 'var(--color-text-secondary)',
    downloading: 'var(--accent)', converting: 'var(--accent)',
    done: 'var(--color-success)', error: 'var(--color-error)', cancelled: 'var(--color-text-muted)'
  }[status] || 'var(--color-text)'
}
</script>

<style scoped>
.history-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.history-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 40px 20px;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 23px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
}

.count {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover:not(:disabled) {
  color: var(--color-error);
  border-color: rgba(239,68,68,0.4);
}

.clear-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.history-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 40px 40px;
}

.history-list {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.history-item:last-child { border-bottom: none; }
.history-item:hover { background: var(--color-hover); }

.thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  width: 220px;
  flex-shrink: 0;
  min-width: 0;
}

.track-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-date {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  width: 130px;
  flex-shrink: 0;
}

.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 80px;
}

.progress-bar {
  height: 5px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: right;
  font-family: var(--font-family-mono);
}

.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  flex: 1;
  text-align: right;
}

.actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.action-btn:hover { background: var(--color-border); color: var(--color-text); }
.action-btn.remove:hover { background: rgba(239,68,68,0.12); color: var(--color-error); }
</style>
