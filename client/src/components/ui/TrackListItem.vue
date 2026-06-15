<template>
  <div class="list-item">
    <div class="artwork">
      <img
        v-if="track.artworkUrl"
        :src="track.artworkUrl"
        :alt="track.title"
        class="image"
      />
      <div v-else class="placeholder">
        <Music :size="20" />
      </div>

      <button
        class="preview-btn"
        :class="{ active: isCurrent }"
        :title="isCurrent && state.isPlaying ? 'Pause' : 'Écouter un extrait'"
        @click.stop="onPreview"
      >
        <Pause v-if="isCurrent && state.isPlaying" :size="16" />
        <Play v-else :size="16" />
      </button>
    </div>

    <div class="info">
      <div class="title" :title="track.title">{{ track.title }}</div>
      <div class="artist">{{ track.artist }}</div>
    </div>

    <Badge v-if="track.policy !== 'ALLOW'" :policy="track.policy" />

    <span class="duration">{{ formatDuration(track.duration) }}</span>

    <button
      class="download-btn"
      @click="$emit('download', track)"
      :disabled="!track.streamable"
      :title="!track.streamable ? 'Stream not available' : 'Add to download queue'"
    >
      <Download :size="16" />
    </button>
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
.list-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  transition: all var(--transition-default);
  cursor: pointer;
}

.list-item:hover {
  background-color: var(--color-surface-light);
}

.list-item:last-child {
  border-bottom: none;
}

.artwork {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
}

.preview-btn {
  position: absolute;
  inset: 0;
  border: none;
  background-color: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.list-item:hover .preview-btn {
  opacity: 1;
}

.preview-btn.active {
  opacity: 1;
  background-color: color-mix(in srgb, var(--accent) 72%, transparent);
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

.info {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duration {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
  width: 44px;
  text-align: right;
}

.download-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-default);
  flex-shrink: 0;
}

.download-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
