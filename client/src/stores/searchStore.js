import { reactive, watch } from 'vue'

const STORAGE_KEY = 'sc-downloader:search-state'

function initialState() {
  return {
    query: '',
    activeFilter: 'all',
    results: [],
    nextHref: null,
    hasMore: false,
    openedPlaylist: null,
    scrollY: 0,
    searchPerformed: false,
    isLoading: false,
    error: null,
  }
}

const state = reactive(initialState())

// Restaurer depuis localStorage au chargement du module
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    // Ne restaure que les champs persistables (pas isLoading/error)
    const { query, activeFilter, results, nextHref, hasMore, openedPlaylist, scrollY, searchPerformed } = parsed
    Object.assign(state, { query, activeFilter, results, nextHref, hasMore, openedPlaylist, scrollY, searchPerformed })
  }
} catch { /* JSON corrompu → state vierge */ }

// Persister à chaque changement (deep watch)
watch(state, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      query: val.query,
      activeFilter: val.activeFilter,
      results: val.results,
      nextHref: val.nextHref,
      hasMore: val.hasMore,
      openedPlaylist: val.openedPlaylist,
      scrollY: val.scrollY,
      searchPerformed: val.searchPerformed,
    }))
  } catch { /* quota ou mode privé → ignorer */ }
}, { deep: true })

// ── Actions ───────────────────────────────────────────────────────────────────

function setQuery(q) {
  state.query = q
}

function setFilter(f) {
  state.activeFilter = f
}

function setResults(items, nextHref) {
  state.results = items
  state.nextHref = nextHref
  state.hasMore = !!nextHref
}

function appendResults(items, nextHref) {
  state.results.push(...items)
  state.nextHref = nextHref
  state.hasMore = !!nextHref
}

function openPlaylist(playlist) {
  state.openedPlaylist = playlist
}

function closePlaylist() {
  state.openedPlaylist = null
}

function saveScroll(y) {
  state.scrollY = y
}

function reset() {
  Object.assign(state, initialState())
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export {
  state as searchState,
  setQuery,
  setFilter,
  setResults,
  appendResults,
  openPlaylist,
  closePlaylist,
  saveScroll,
  reset,
}
