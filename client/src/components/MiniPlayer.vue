<template>
  <div
    v-if="state.currentTrack"
    class="mini-player"
  >
    <!-- Artwork + infos -->
    <div class="track-meta">
      <div class="artwork">
        <img
          v-if="state.currentTrack.artworkUrl"
          :src="state.currentTrack.artworkUrl"
          :alt="state.currentTrack.title"
          class="art-img"
        >
        <div
          v-else
          class="art-placeholder"
        >
          <Music :size="18" />
        </div>
      </div>
      <div class="info">
        <div
          class="title"
          :title="state.currentTrack.title"
        >
          {{ state.isLoading ? 'Chargement...' : state.currentTrack.title }}
        </div>
        <div class="artist">
          {{ state.currentTrack.artist }}
        </div>
      </div>
    </div>

    <!-- Contrôles + progression -->
    <div class="center">
      <div
        v-if="state.isUnavailable"
        class="unavailable"
      >
        Preview indisponible
      </div>

      <template v-else>
        <button
          class="play-btn"
          :title="state.isPlaying ? 'Pause' : 'Lecture'"
          @click="toggle"
        >
          <Loader2
            v-if="state.isLoading"
            :size="20"
            class="spin"
          />
          <Pause
            v-else-if="state.isPlaying"
            :size="20"
          />
          <Play
            v-else
            :size="20"
          />
        </button>

        <span class="time">{{ fmt(state.currentTime) }}</span>
        <input
          class="progress range"
          type="range"
          min="0"
          :max="state.duration || 0"
          :value="state.currentTime"
          step="0.1"
          :style="{ '--pct': progressPct + '%' }"
          :disabled="state.isLoading || !state.duration"
          @input="onSeek"
        >
        <span class="time">{{ fmt(state.duration) }}</span>
      </template>
    </div>

    <!-- Volume -->
    <div class="volume">
      <Volume2 :size="18" />
      <input
        class="vol range"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="state.volume"
        :style="{ '--pct': volumePct + '%' }"
        @input="onVolume"
      >
    </div>

    <!-- Fermer -->
    <button
      class="close-btn"
      title="Fermer"
      @click="close"
    >
      <X :size="18" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Play, Pause, Volume2, X, Music, Loader2 } from 'lucide-vue-next'
import usePlayer from '@/composables/usePlayer'

const { state, pause, resume, seek, setVolume, close } = usePlayer()

const progressPct = computed(() =>
  state.duration ? (state.currentTime / state.duration) * 100 : 0
)
const volumePct = computed(() => state.volume * 100)

function toggle() {
  if (state.isPlaying) pause()
  else resume()
}

function onSeek(e) {
  seek(Number(e.target.value))
}

function onVolume(e) {
  setVolume(Number(e.target.value))
}

function fmt(s) {
  if (!s || !Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}
</script>

<style scoped>
.mini-player {
  position: fixed;
  left: 64px;
  right: 0;
  bottom: 0;
  height: 72px;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-xl);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

/* ---------- Artwork + infos ---------- */
.track-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 240px;
  flex-shrink: 0;
}

.artwork {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-border);
  flex-shrink: 0;
}

.art-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.info {
  min-width: 0;
}

.title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- Centre : contrôles + progression ---------- */
.center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.unavailable {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.play-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background-color: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter var(--transition-fast);
}

.play-btn:hover {
  filter: brightness(1.08);
}

.time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  flex-shrink: 0;
  width: 38px;
  text-align: center;
}

.progress {
  flex: 1;
  min-width: 0;
}

/* ---------- Volume ---------- */
.volume {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.vol {
  width: 90px;
}

/* ---------- Fermer ---------- */
.close-btn {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
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

.close-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}

/* ---------- Range stylisé (thumb orange, track grise + remplissage) ---------- */
.range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    var(--accent) var(--pct, 0%),
    var(--color-border) var(--pct, 0%)
  );
  cursor: pointer;
  outline: none;
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
}

.range::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
}

.range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
