<template>
  <div class="track-rows">
    <!-- Loader -->
    <div
      v-if="loading"
      class="state-msg"
    >
      <Loader2
        :size="16"
        class="spin"
      />
      Chargement des titres…
    </div>

    <!-- Erreur -->
    <div
      v-else-if="error"
      class="state-msg error"
    >
      <AlertCircle :size="16" />
      {{ error }}
    </div>

    <!-- Vide -->
    <div
      v-else-if="tracks.length === 0"
      class="state-msg"
    >
      Aucun titre disponible.
    </div>

    <!-- Lignes -->
    <div
      v-for="track in tracks"
      v-else
      :key="track.id"
      class="track-row"
    >
      <button
        class="lead"
        :title="isCurrent(track) && state.isPlaying ? 'Pause' : 'Écouter un extrait'"
        @click.stop="onPreview(track)"
      >
        <template v-if="isCurrent(track)">
          <Pause
            v-if="state.isPlaying"
            :size="14"
            class="lead-icon active"
          />
          <Play
            v-else
            :size="14"
            class="lead-icon active"
          />
        </template>
        <template v-else>
          <span class="dot" />
          <Play
            :size="14"
            class="lead-icon play-ic"
          />
        </template>
      </button>
      <div class="row-info">
        <div
          class="title"
          :title="track.title"
        >
          {{ track.title }}
        </div>
        <div class="artist">
          {{ track.artist }}
        </div>
      </div>
      <span class="duration">{{ formatDuration(track.duration) }}</span>
      <button
        class="add-btn"
        title="Ajouter à la file"
        :disabled="!track.streamable"
        @click="$emit('add', track)"
      >
        <Plus :size="15" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { Plus, Loader2, AlertCircle, Play, Pause } from 'lucide-vue-next'
import usePlayer from '@/composables/usePlayer'

defineProps({
  tracks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

defineEmits(['add'])

const { state, play } = usePlayer()

function isCurrent(track) {
  return state.currentTrack?.id === track.id
}

function onPreview(track) {
  play(track)
}

function formatDuration(ms) {
  if (!ms) return '0:00'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.track-rows {
  display: flex;
  flex-direction: column;
}

.state-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.state-msg.error {
  color: var(--color-error);
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.track-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 8px 10px;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.track-row:hover {
  background-color: var(--color-surface);
}

.lead {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin: 0 var(--spacing-xs);
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--color-text-muted);
}

.lead-icon {
  display: none;
}

/* Icône accent quand c'est la track courante */
.lead-icon.active {
  display: block;
  color: var(--accent);
}

/* Au survol de la ligne : le point devient une icône Play */
.track-row:hover .dot {
  display: none;
}

.track-row:hover .play-ic {
  display: block;
  color: var(--color-text);
}

.row-info {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duration {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  flex-shrink: 0;
}

.add-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-dark);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.add-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
