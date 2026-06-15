<template>
  <div class="track-card">
    <div class="artwork">
      <img
        v-if="track.artworkUrl"
        :src="track.artworkUrl"
        :alt="track.title"
        class="image"
      />
      <div v-else class="placeholder">
        <Music :size="40" />
      </div>

      <Badge v-if="track.policy !== 'ALLOW'" :policy="track.policy" class="badge-overlay" />

      <button
        class="preview-btn"
        :class="{ active: isCurrent }"
        :title="isCurrent && state.isPlaying ? 'Pause' : 'Écouter un extrait'"
        @click.stop="onPreview"
      >
        <Pause v-if="isCurrent && state.isPlaying" :size="16" />
        <Play v-else :size="16" />
      </button>

      <span class="duration">{{ formatDuration(track.duration) }}</span>

      <div class="overlay">
        <button class="download-btn" @click="$emit('download', track)">
          <Download :size="15" />
          Télécharger
        </button>
      </div>
    </div>

    <div class="info">
      <div class="title" :title="track.title">{{ track.title }}</div>
      <div class="artist">{{ track.artist }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Music, Download, Play, Pause } from 'lucide-vue-next'
import Badge from './Badge.vue'
import usePlayer from '@/composables/usePlayer'

const props = defineProps({
  track: {
    type: Object,
    required: true
  }
})

defineEmits(['download'])

const { state, play } = usePlayer()

const isCurrent = computed(() => state.currentTrack?.id === props.track.id)

function onPreview() {
  play(props.track)
}

function formatDuration(ms) {
  if (!ms) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.track-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-default);
}

.track-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  background-color: var(--color-surface-light);
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

.badge-overlay {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
}

.preview-btn {
  position: absolute;
  bottom: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.62);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast), background-color var(--transition-fast);
}

.track-card:hover .preview-btn {
  opacity: 1;
}

.preview-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.preview-btn.active {
  opacity: 1;
  background-color: var(--accent);
}

.duration {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 3px 7px;
  border-radius: var(--radius-sm);
  background-color: rgba(0, 0, 0, 0.62);
  color: white;
  font-size: var(--font-size-xs);
  font-family: 'JetBrains Mono', monospace;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(13, 13, 16, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-default);
}

.track-card:hover .overlay {
  opacity: 1;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  background-color: var(--color-accent);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  transition: all var(--transition-default);
}

.download-btn:hover {
  background-color: var(--color-accent-hover);
  transform: scale(1.05);
}

.info {
  padding: var(--spacing-md);
}

.title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
