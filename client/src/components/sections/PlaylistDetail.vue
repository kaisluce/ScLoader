<template>
  <section class="detail">
    <!-- Fond : pochette fortement floutée -->
    <div v-if="playlist.artworkUrl" class="detail-bg" :style="bgStyle" />

    <!-- Header : loupe (gauche) + croix (droite) -->
    <header class="detail-header">
      <div class="search-mini" :class="{ open: miniOpen }">
        <button class="loupe" title="Nouvelle recherche" @click="focusMini">
          <Search :size="20" />
        </button>
        <input
          ref="miniInput"
          v-model="q"
          type="text"
          class="mini-input"
          placeholder="Rechercher..."
          @keyup.enter="submitSearch"
          @focus="miniOpen = true"
          @blur="miniOpen = false"
        />
      </div>

      <button class="close-btn" title="Fermer" @click="$emit('close')">
        <X :size="20" />
      </button>
    </header>

    <!-- Corps -->
    <div class="detail-body">
      <div class="hero">
        <div class="hero-art">
          <img v-if="playlist.artworkUrl" :src="playlist.artworkUrl" :alt="playlist.title" class="hero-img" />
          <div v-else class="hero-placeholder">
            <ListMusic :size="56" />
          </div>
        </div>

        <div class="hero-info">
          <span class="badge" :class="badgeClass">{{ badgeLabel }}</span>
          <h1 class="hero-title">{{ playlist.title }}</h1>
          <div class="hero-artist">{{ playlist.artist }}</div>
          <div class="hero-meta">
            <span>{{ playlist.trackCount }} titres</span>
            <span v-if="playlist.isAlbum && releaseYear" class="dot">·</span>
            <span v-if="playlist.isAlbum && releaseYear">{{ releaseYear }}</span>
          </div>
          <button class="add-all" :disabled="loading || tracks.length === 0" @click="addAll">
            <Download :size="16" />
            Tout ajouter
          </button>
        </div>
      </div>

      <div class="tracks-panel">
        <div class="tracks-scroll sc-scroll">
          <PlaylistTrackRows
            :tracks="tracks"
            :loading="loading"
            :error="error"
            @add="track => $emit('download', track)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Search, X, Download, ListMusic } from 'lucide-vue-next'
import { fetchPlaylist } from '@/services/soundcloudApi'
import PlaylistTrackRows from '../ui/PlaylistTrackRows.vue'

const props = defineProps({
  playlist: { type: Object, required: true }
})

const emit = defineEmits(['close', 'search', 'download', 'download-all'])

const q = ref('')
const miniOpen = ref(false)
const miniInput = ref(null)

const loading = ref(false)
const error = ref(null)
const loadedPlaylist = ref(null) // cache : un seul fetchPlaylist par ouverture

const bgStyle = computed(() =>
  props.playlist.artworkUrl
    ? { backgroundImage: `url(${props.playlist.artworkUrl})` }
    : {}
)

const badgeLabel = computed(() => (props.playlist.isAlbum ? 'ALBUM' : 'PLAYLIST'))
const badgeClass = computed(() => (props.playlist.isAlbum ? 'album' : 'playlist'))

const releaseYear = computed(() => {
  if (!props.playlist.releaseDate) return null
  const y = new Date(props.playlist.releaseDate).getFullYear()
  return Number.isNaN(y) ? null : y
})

const tracks = computed(() => {
  if (loadedPlaylist.value) return loadedPlaylist.value.tracks
  return []
})

async function ensureTracks() {
  if (loadedPlaylist.value) return loadedPlaylist.value
  loading.value = true
  error.value = null
  try {
    loadedPlaylist.value = await fetchPlaylist(props.playlist.id)
    return loadedPlaylist.value
  } catch (e) {
    error.value = 'Impossible de charger les titres.'
    throw e
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  ensureTracks().catch(() => {})
})

async function focusMini() {
  miniOpen.value = true
  await nextTick()
  miniInput.value?.focus()
}

function submitSearch() {
  const value = q.value.trim()
  if (value) emit('search', value)
}

async function addAll() {
  let pl = loadedPlaylist.value
  if (!pl) {
    try {
      pl = await ensureTracks()
    } catch {
      return
    }
  }
  if (pl.tracks.length > 0) emit('download-all', pl.tracks)
}
</script>

<style scoped>
.detail {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ---------- Fond flouté ---------- */
.detail-bg {
  position: absolute;
  inset: -60px; /* déborde pour masquer les bords transparents du flou */
  background-size: cover;
  background-position: center;
  filter: blur(60px) saturate(1.4);
  transform: scale(1.2);
  z-index: 0;
}

/* Dégradé sombre par-dessus pour la lisibilité */
.detail::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-bg) 55%, transparent) 0%,
    color-mix(in srgb, var(--color-bg) 88%, transparent) 55%,
    var(--color-bg) 100%
  );
}

/* ---------- Header ---------- */
.detail-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.search-mini {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 6px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition: border-color var(--transition-fast);
}

.search-mini:hover,
.search-mini.open {
  border-color: var(--color-border-hover);
}

.loupe {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-mini:hover .loupe,
.search-mini.open .loupe {
  color: var(--color-text);
}

.mini-input {
  width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--font-size-base);
  opacity: 0;
  transition: width var(--transition-default), opacity var(--transition-default), padding var(--transition-default);
}

.search-mini:hover .mini-input,
.search-mini.open .mini-input {
  width: 260px;
  padding: 0 10px 0 4px;
  opacity: 1;
}

.close-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-hover);
}

/* ---------- Corps ---------- */
.detail-body {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 32px 40px 40px;
}

.hero {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.hero-art {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-border);
  box-shadow: var(--shadow-lg);
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.hero-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
}

.badge {
  align-self: flex-start;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-md);
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

.hero-title {
  margin: 0;
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.hero-artist {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.dot {
  opacity: 0.6;
}

.add-all {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: var(--spacing-lg);
  padding: 10px 20px;
  border-radius: 9px;
  border: none;
  background-color: var(--accent);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: filter var(--transition-fast);
}

.add-all:hover:not(:disabled) {
  filter: brightness(1.08);
}

.add-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tracks-panel {
  flex: 1;
  min-height: 0;
  background-color: color-mix(in srgb, var(--color-surface) 60%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
}

.tracks-scroll {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}
</style>
