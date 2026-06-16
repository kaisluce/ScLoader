import { ref, computed } from 'vue'
import {
  searchState,
  setQuery,
  setFilter,
  setResults,
  appendResults,
  reset,
} from '@/stores/searchStore'
import { search, searchByType, searchSuggestions } from '@/services/soundcloudApi'

const DEBOUNCE_DELAY = 300

// Module-level : singleton car le store l'est aussi
let debounceTimer = null

// Suggestions non persistées (transient)
const suggestions = ref([])

async function onQueryInput() {
  clearTimeout(debounceTimer)
  if (!searchState.query.trim()) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      suggestions.value = await searchSuggestions(searchState.query)
    } catch {
      suggestions.value = []
    }
  }, DEBOUNCE_DELAY)
}

async function onSearch() {
  const q = searchState.query.trim()
  if (!q) {
    searchState.error = 'Please enter a search query'
    return
  }

  // Reset résultats/détail/scroll sans toucher query ni activeFilter
  searchState.results = []
  searchState.nextHref = null
  searchState.hasMore = false
  searchState.openedPlaylist = null
  searchState.scrollY = 0
  searchState.error = null
  searchState.searchPerformed = true
  searchState.isLoading = true
  suggestions.value = []

  try {
    const result = await search(q, searchState.activeFilter)
    setResults(result.items || [], result.nextHref)
  } catch {
    searchState.error = 'Failed to search. Please try again.'
  } finally {
    searchState.isLoading = false
  }
}

function onSetFilter(filter) {
  if (searchState.activeFilter === filter) return
  setFilter(filter)
  if (searchState.query.trim()) onSearch()
}

async function loadMore() {
  if (!searchState.nextHref || searchState.isLoading) return

  searchState.isLoading = true
  searchState.error = null
  try {
    const params = new URLSearchParams(searchState.nextHref.split('?')[1])
    const offset = parseInt(params.get('offset')) || searchState.results.length
    const result = await searchByType(searchState.query, searchState.activeFilter, offset)
    appendResults(result.items || [], result.nextHref)
  } catch {
    searchState.error = 'Failed to load more results'
  } finally {
    searchState.isLoading = false
  }
}

function clearSearch() {
  clearTimeout(debounceTimer)
  suggestions.value = []
  reset()
}

// Interface identique à l'ancienne pour éviter de casser les consommateurs
function useSearch() {
  return {
    query: computed({
      get: () => searchState.query,
      set: (v) => setQuery(v),
    }),
    results: computed(() => searchState.results),
    suggestions,
    isLoading: computed(() => searchState.isLoading),
    error: computed(() => searchState.error),
    hasMore: computed(() => searchState.hasMore),
    nextHref: computed(() => searchState.nextHref),
    activeFilter: computed(() => searchState.activeFilter),
    searchPerformed: computed(() => searchState.searchPerformed),
    onQueryInput,
    onSearch,
    setFilter: onSetFilter,
    loadMore,
    clearSearch,
  }
}

export default useSearch
