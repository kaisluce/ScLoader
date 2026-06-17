import { reactive, watch } from 'vue'

const STORAGE_KEY = 'sc-downloader:settings'

function defaultState() {
  return {
    quality: 'high',
    maxConcurrent: 3,
    filenameTemplate: '{artist} - {title}',
    accentColor: '#ff5500',
    volume: 0.8,
    showNotifications: true,
    clearQueueOnExit: false,
  }
}

const state = reactive(defaultState())

// Restaurer depuis localStorage au chargement du module
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) Object.assign(state, JSON.parse(saved))
} catch { /* JSON corrompu → valeurs par défaut */ }

// Persister à chaque changement
watch(state, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...val }))
  } catch { /* quota dépassé → ignorer */ }
}, { deep: true })

function setSetting(key, value) {
  if (key in state) state[key] = value
}

function resetSettings() {
  Object.assign(state, defaultState())
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export { state as settingsState, setSetting, resetSettings }
