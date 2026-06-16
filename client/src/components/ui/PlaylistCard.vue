<template>
  <!-- ===================== MODE GRILLE ===================== -->
  <div
    v-if="viewMode === 'grid'"
    class="playlist-card"
    @click="$emit('open', playlist)"
  >
    <div class="artwork">
      <img
        v-if="playlist.artworkUrl"
        :src="playlist.artworkUrl"
        :alt="playlist.title"
        class="image"
      >
      <div
        v-else
        class="placeholder"
      >
        <ListMusic :size="40" />
      </div>

      <span
        class="badge"
        :class="badgeClass"
      >{{ badgeLabel }}</span>

      <div class="overlay">
        <button
          class="overlay-btn primary"
          @click.stop="addAll"
        >
          <Download :size="14" />
          Tout ajouter
        </button>
        <button
          class="overlay-btn"
          @click.stop="$emit('open', playlist)"
        >
          <ListMusic :size="14" />
          Voir les titres
        </button>
      </div>
    </div>

    <div class="info">
      <div
        class="title"
        :title="playlist.title"
      >
        {{ playlist.title }}
      </div>
      <div class="artist">
        {{ playlist.artist }}
      </div>
      <div class="meta">
        <span>{{ playlist.trackCount }} titres</span>
        <span
          v-if="playlist.isAlbum && releaseYear"
          class="dot"
        >·</span>
        <span v-if="playlist.isAlbum && releaseYear">{{ releaseYear }}</span>
      </div>
    </div>
  </div>

  <!-- ===================== MODE LISTE ===================== -->
  <div
    v-else
    class="playlist-row"
    @click="$emit('open', playlist)"
  >
    <div class="thumb">
      <img
        v-if="playlist.artworkUrl"
        :src="playlist.artworkUrl"
        :alt="playlist.title"
        class="image"
      >
      <div
        v-else
        class="placeholder"
      >
        <ListMusic :size="20" />
      </div>
    </div>

    <div class="row-info">
      <div
        class="title"
        :title="playlist.title"
      >
        {{ playlist.title }}
      </div>
      <div class="artist">
        {{ playlist.artist }}
      </div>
    </div>

    <span
      class="badge"
      :class="badgeClass"
    >{{ badgeLabel }}</span>

    <span class="track-count">{{ playlist.trackCount }} titres</span>

    <div class="row-actions">
      <button
        class="row-btn"
        title="Tout ajouter"
        @click.stop="addAll"
      >
        <Download :size="16" />
      </button>
      <button
        class="row-btn"
        title="Voir les titres"
        @click.stop="$emit('open', playlist)"
      >
        <ListMusic :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Download, ListMusic } from 'lucide-vue-next'
import { fetchPlaylist } from '@/services/soundcloudApi'

const props = defineProps({
  playlist: { type: Object, required: true },
  viewMode: { type: String, default: 'grid' }
})

const emit = defineEmits(['open', 'download-all'])

const badgeLabel = computed(() => (props.playlist.isAlbum ? 'ALBUM' : 'PLAYLIST'))
const badgeClass = computed(() => (props.playlist.isAlbum ? 'album' : 'playlist'))

const releaseYear = computed(() => {
  if (!props.playlist.releaseDate) return null
  const y = new Date(props.playlist.releaseDate).getFullYear()
  return Number.isNaN(y) ? null : y
})

// Tous les tracks complets (avec transcodings) et en nombre attendu ?
function isComplete(pl) {
  return (
    pl.tracks.length > 0 &&
    pl.tracks.length >= pl.trackCount &&
    pl.tracks.every(t => t.transcodings && t.transcodings.length > 0)
  )
}

async function addAll() {
  let pl = props.playlist
  if (!isComplete(pl)) {
    try {
      pl = await fetchPlaylist(pl.id)
    } catch {
      return
    }
  }
  if (pl.tracks.length > 0) emit('download-all', pl.tracks)
}
</script>

<style scoped>
/* ---------- Badge (couleurs en dur autorisées) ---------- */
.badge {
  display: inline-block;
  padding: 3px 7px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
}

.badge.album {
  color: #ff5500;
  background-color: rgba(255, 85, 0, 0.16);
  border: 1px solid rgba(255, 85, 0, 0.35);
}

.badge.playlist {
  color: #c8c8d4;
  background-color: rgba(144, 144, 160, 0.14);
  border: 1px solid rgba(144, 144, 160, 0.3);
}

/* ===================== GRILLE ===================== */
.playlist-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--transition-default), box-shadow var(--transition-default);
}

.playlist-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-lg);
}

.artwork {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: var(--color-border);
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.artwork .badge {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(13, 13, 16, 0.62);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--transition-default);
}

.artwork:hover .overlay {
  opacity: 1;
}

.overlay-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid var(--color-border-hover);
  background-color: var(--color-surface-dark);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: filter var(--transition-fast), background-color var(--transition-fast);
}

.overlay-btn.primary {
  background-color: var(--accent);
  border-color: transparent;
  color: #fff;
}

.overlay-btn.primary:hover {
  filter: brightness(1.08);
}

.overlay-btn:not(.primary):hover {
  background-color: var(--color-surface);
}

.info {
  padding: var(--spacing-md);
}

.title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.dot {
  opacity: 0.6;
}

/* ===================== LISTE ===================== */
.playlist-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.playlist-row:hover {
  background-color: var(--color-hover);
}

.thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.row-info {
  flex: 1;
  min-width: 0;
}

.track-count {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  width: 64px;
  text-align: right;
}

.row-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.row-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-dark);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.row-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
