<template>
  <Transition name="status-icon">
    <button
      v-if="visible"
      class="status-icon"
      :class="[mode, { raised: playerActive }]"
      :aria-label="summary"
      @click="goHistory"
    >
      <span class="tooltip">{{ summary }}</span>

      <!-- Résolution / en attente : spinner -->
      <svg v-if="mode === 'resolving'" class="spinner" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="44 18" />
      </svg>

      <!-- Téléchargement / conversion : bounce -->
      <DownloadCloud v-else-if="mode === 'downloading'" class="bounce" :size="24" />

      <!-- Tout terminé OK -->
      <CheckCircle v-else-if="mode === 'done'" class="pop" :size="26" />

      <!-- Au moins une erreur -->
      <XCircle v-else-if="mode === 'error'" class="pop" :size="26" />
    </button>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { DownloadCloud, CheckCircle, XCircle } from 'lucide-vue-next'
import useQueueStats from '@/composables/useQueueStats'
import usePlayer from '@/composables/usePlayer'

const router = useRouter()
const { activeItems, doneItems, errorItems } = useQueueStats()
const { state: playerState } = usePlayer()

// Le MiniPlayer (barre de preview, 72px) occupe le bas → on remonte l'icône
const playerActive = computed(() => !!playerState.currentTrack)

const visible = ref(false)
let hideTimer = null

// État visuel global (priorité décroissante)
const mode = computed(() => {
  const active = activeItems.value
  if (active.some(i => i.status === 'resolving' || i.status === 'pending')) return 'resolving'
  if (active.some(i => i.status === 'downloading' || i.status === 'converting')) return 'downloading'
  // Plus aucun item actif : l'erreur prime sur le succès
  if (errorItems.value.length > 0) return 'error'
  if (doneItems.value.length > 0) return 'done'
  return null
})

const summary = computed(() => {
  const parts = []
  const a = activeItems.value.length
  const d = doneItems.value.length
  const e = errorItems.value.length
  if (a) parts.push(`${a} en cours`)
  if (d) parts.push(`${d} terminé${d > 1 ? 's' : ''}`)
  if (e) parts.push(`${e} erreur${e > 1 ? 's' : ''}`)
  return parts.join(' · ')
})

// Visible tant qu'il y a de l'activité ; après la fin du dernier item actif,
// on garde l'icône résultat 3 s puis fondu sortant.
watch(
  () => activeItems.value.length,
  (n, old) => {
    if (n > 0) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
      visible.value = true
    } else if (old > 0) {
      visible.value = true
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => { visible.value = false }, 3000)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
})

function goHistory() {
  router.push('/history')
}
</script>

<style scoped>
.status-icon {
  position: fixed;
  bottom: 24px;
  left: 80px;
  z-index: var(--z-sticky);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--accent);
  transition: bottom var(--transition-default);
}

/* Remonté au-dessus du MiniPlayer (72px) quand une preview est ouverte */
.status-icon.raised {
  bottom: 88px;
}

.status-icon.done {
  color: #22c55e;
}

.status-icon.error {
  color: #ef4444;
}

/* ---------- Tooltip ---------- */
.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-dark);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: var(--font-size-xs);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
}

.status-icon:hover .tooltip {
  opacity: 1;
}

/* ---------- Icônes + animations ---------- */
.spinner {
  animation: spin 0.8s linear infinite;
}

.bounce {
  animation: bounce-down 1s ease-in-out infinite;
}

.pop {
  animation: pop-in 0.35s ease-out;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(4px); }
}

@keyframes pop-in {
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

/* ---------- Transition d'apparition / fondu sortant ---------- */
.status-icon-enter-active {
  transition: opacity 0.3s ease;
}
.status-icon-enter-from {
  opacity: 0;
}
.status-icon-leave-active {
  transition: opacity 0.5s ease;
}
.status-icon-leave-to {
  opacity: 0;
}
</style>
