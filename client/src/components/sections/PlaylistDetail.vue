<template>
  <section class="detail">
    <div v-if="playlist.artworkUrl" class="detail-bg" :style="bgStyle" />

    <!-- Header fixe -->
    <header class="detail-header">
      <button class="btn-back" @click="$emit('back')">
        <ChevronLeft :size="20" />
        <span>Retour</span>
      </button>

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
    </header>

    <!-- Corps -->
    <div class="detail-body">

      <!-- ═══ Hero animé ═══ -->
      <div class="hero" :style="{ height: heroHeightStyle }">

        <!-- Artwork (rétrécit) -->
        <div class="hero-art" :style="{ width: artworkSizeStyle, height: artworkSizeStyle }">
          <img v-if="playlist.artworkUrl" :src="playlist.artworkUrl" :alt="playlist.title" class="hero-img" />
          <div v-else class="hero-art-placeholder"><ListMusic :size="36" /></div>
        </div>

        <!-- Zone info : contient les deux couches superposées -->
        <div class="hero-info-wrap">

          <!-- COUCHE EXPANDED (disparaît au scroll) -->
          <div class="hero-expanded" :style="{ opacity: expandedOpacity }" :inert="isCompact">
            <span class="badge" :class="badgeClass">{{ badgeLabel }}</span>
            <h1 class="hero-title">{{ playlist.title }}</h1>
            <div class="hero-artist">{{ playlist.artist }}</div>
            <div class="hero-meta">
              <span>{{ playlist.trackCount }} titres</span>
              <span v-if="playlist.isAlbum && releaseYear" class="dot">·</span>
              <span v-if="playlist.isAlbum && releaseYear">{{ releaseYear }}</span>
            </div>
            <button
              class="add-all"
              :disabled="loading || tracks.length === 0"
              @click="addAll"
            >
              <Download :size="16" />
              Tout ajouter
            </button>
          </div>

          <!-- COUCHE COMPACT (apparaît au scroll) -->
          <div class="hero-compact" :style="{ opacity: compactOpacity }" :inert="!isCompact">
            <div class="compact-text">
              <span class="compact-title">{{ playlist.title }}</span>
              <span class="compact-sub">{{ playlist.artist }} · {{ playlist.trackCount }} titres</span>
            </div>
            <button
              class="btn-compact"
              :disabled="loading || tracks.length === 0"
              title="Tout ajouter"
              @click="addAll"
            >
              <Download :size="17" />
            </button>
          </div>

        </div>
      </div>

      <!-- Tracks -->
      <div class="tracks-panel">
        <div class="tracks-scroll sc-scroll" ref="scrollEl">
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Search, ChevronLeft, Download, ListMusic } from 'lucide-vue-next'
import { fetchPlaylist } from '@/services/soundcloudApi'
import PlaylistTrackRows from '../ui/PlaylistTrackRows.vue'

const props = defineProps({
  playlist: { type: Object, required: true }
})

const emit = defineEmits(['back', 'search', 'download', 'download-all'])

// ── Search mini ───────────────────────────────────────────────────────────────
const q = ref('')
const miniOpen = ref(false)
const miniInput = ref(null)

// ── Tracks ────────────────────────────────────────────────────────────────────
const loading = ref(false)
const error = ref(null)
const loadedPlaylist = ref(null)

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
const tracks = computed(() => loadedPlaylist.value?.tracks ?? [])

function embeddedTracksComplete() {
  const pl = props.playlist
  return (
    pl.tracks?.length > 0 &&
    pl.tracks.length >= pl.trackCount &&
    pl.tracks.every(t => t.transcodings && t.transcodings.length > 0)
  )
}

async function ensureTracks() {
  if (loadedPlaylist.value) return loadedPlaylist.value
  if (embeddedTracksComplete()) {
    loadedPlaylist.value = props.playlist
    return loadedPlaylist.value
  }
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

// ── Scroll animation ──────────────────────────────────────────────────────────
const scrollEl = ref(null)
const scrollY = ref(0)

let rafId = null
function onScroll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    scrollY.value = scrollEl.value?.scrollTop ?? 0
    rafId = null
  })
}

// 0 → 1 sur les 120 premiers px de scroll
const progress = computed(() => Math.min(scrollY.value / 120, 1))

// Hero : 248px → 72px
const heroHeightStyle = computed(() => 248 - 176 * progress.value + 'px')

// Artwork : 180px → 48px
const artworkSizeStyle = computed(() => 180 - 132 * progress.value + 'px')

// Expanded : 1→0 sur la 1re moitié
const expandedOpacity = computed(() => Math.max(0, 1 - progress.value * 2))

// Compact : 0→1 sur la 2e moitié
const compactOpacity = computed(() => Math.max(0, progress.value * 2 - 1))

// Bascule pointer-events à mi-chemin
const isCompact = computed(() => progress.value >= 0.5)

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  ensureTracks().catch(() => {})
  scrollEl.value?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  scrollEl.value?.removeEventListener('scroll', onScroll)
  if (rafId !== null) cancelAnimationFrame(rafId)
})

// ── Actions ───────────────────────────────────────────────────────────────────
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
    try { pl = await ensureTracks() } catch { return }
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

.detail-bg {
  position: absolute;
  inset: -60px;
  background-size: cover;
  background-position: center;
  filter: blur(60px) saturate(1.4);
  transform: scale(1.2);
  z-index: 0;
}

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

/* ── Header fixe ── */
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
.search-mini:hover, .search-mini.open { border-color: var(--color-border-hover); }

.loupe {
  width: 32px; height: 32px; flex-shrink: 0;
  border: none; background: transparent;
  color: var(--color-text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.search-mini:hover .loupe, .search-mini.open .loupe { color: var(--color-text); }

.mini-input {
  width: 0; padding: 0; border: none; outline: none;
  background: transparent; color: var(--color-text);
  font-family: inherit; font-size: var(--font-size-base);
  opacity: 0;
  transition: width var(--transition-default), opacity var(--transition-default), padding var(--transition-default);
}
.search-mini:hover .mini-input, .search-mini.open .mini-input {
  width: 260px; padding: 0 10px 0 4px; opacity: 1;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: color var(--transition-default);
  flex-shrink: 0;
}
.btn-back:hover { color: var(--color-text); }

/* ── Corps ── */
.detail-body {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 40px 40px;
}

/* ── Hero ── */
.hero {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  padding: 16px 0;
  overflow: hidden;
  will-change: height;
}

.hero-art {
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-border);
  box-shadow: var(--shadow-lg);
}
.hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-art-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}

/*
  hero-info-wrap : position relative, flex:1, align-self:stretch
  → donne une hauteur définie aux deux couches absolute qui vivent dedans
*/
.hero-info-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  align-self: stretch;
}

/* ── Couche expanded ── */
.hero-expanded {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* contenu ancré en bas, dans l'espace défini */
  padding-bottom: 4px;
}

.badge {
  align-self: flex-start;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}
.badge.album  { color: #ff5500; background-color: rgba(255,85,0,.16); border: 1px solid rgba(255,85,0,.35); }
.badge.playlist { color: #c8c8d4; background-color: rgba(144,144,160,.14); border: 1px solid rgba(144,144,160,.3); }

.hero-title {
  margin: 0;
  font-size: 30px;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
  color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hero-artist {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}
.hero-meta {
  display: flex; align-items: center; gap: 6px;
  margin-top: 2px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.dot { opacity: 0.6; }

.add-all {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 7px;
  margin-top: var(--spacing-md);
  padding: 9px 18px;
  border-radius: 9px; border: none;
  background-color: var(--accent); color: #fff;
  font-family: inherit; font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: filter var(--transition-fast);
}
.add-all:hover:not(:disabled) { filter: brightness(1.08); }
.add-all:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Couche compact ── */
.hero-compact {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.compact-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.compact-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.compact-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.btn-compact {
  flex-shrink: 0;
  width: 38px; height: 38px;
  border-radius: var(--radius-md); border: none;
  background-color: var(--accent); color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: filter var(--transition-fast);
}
.btn-compact:hover:not(:disabled) { filter: brightness(1.08); }
.btn-compact:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Tracks ── */
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
