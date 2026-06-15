import { ref, computed, watch } from 'vue'
import useDownloadQueue from './useDownloadQueue'

const ACTIVE_STATUSES = ['pending', 'resolving', 'downloading', 'converting']

// --- État singleton (hors du composable, partagé entre tous les consommateurs) ---
const items = ref([])              // miroir réactif de la queue
const newDoneCount = ref(0)
const newErrorCount = ref(0)
const prevStatus = new Map()       // id -> dernier status connu (détection de transition)

let started = false

const activeItems = computed(() => items.value.filter(i => ACTIVE_STATUSES.includes(i.status)))
const doneItems = computed(() => items.value.filter(i => i.status === 'done'))
const errorItems = computed(() => items.value.filter(i => i.status === 'error'))

function resetBadges() {
  newDoneCount.value = 0
  newErrorCount.value = 0
}

// Initialisé une seule fois, au premier appel depuis un composant monté en
// permanence (AppSidebar / DownloadStatusIcon) pour que le polling vive tout
// au long de la session.
function start() {
  if (started) return
  started = true

  const { queue } = useDownloadQueue()

  watch(
    queue,
    (list) => {
      items.value = list || []
      for (const it of items.value) {
        const prev = prevStatus.get(it.id)
        if (prev !== it.status) {
          // On ne compte qu'au moment exact de la transition (prev défini).
          if (prev && it.status === 'done' && prev !== 'done') newDoneCount.value++
          if (prev && it.status === 'error' && prev !== 'error') newErrorCount.value++
          prevStatus.set(it.id, it.status)
        }
      }
    },
    { deep: true, immediate: true }
  )
}

export default function useQueueStats() {
  start()
  return {
    activeItems,
    doneItems,
    errorItems,
    newDoneCount,
    newErrorCount,
    resetBadges
  }
}
