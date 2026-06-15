import { ref } from 'vue'
import {
  search,
  searchByType,
  searchSuggestions
} from '@/services/soundcloudApi'

const DEBOUNCE_DELAY = 300

function useSearch() {
  const query = ref('')
  const results = ref([])
  const suggestions = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const hasMore = ref(false)
  const nextHref = ref(null)
  const activeFilter = ref('all') // 'all' | 'tracks' | 'playlists' | 'albums'

  let debounceTimer = null

  async function onQueryInput() {
    clearTimeout(debounceTimer)

    if (!query.value.trim()) {
      suggestions.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      try {
        isLoading.value = true
        error.value = null
        const suggestionsList = await searchSuggestions(query.value)
        suggestions.value = suggestionsList
      } catch (err) {
        error.value = 'Failed to load suggestions'
        suggestions.value = []
      } finally {
        isLoading.value = false
      }
    }, DEBOUNCE_DELAY)
  }

  async function onSearch() {
    if (!query.value.trim()) {
      error.value = 'Please enter a search query'
      return
    }

    try {
      isLoading.value = true
      error.value = null
      results.value = []
      suggestions.value = []
      nextHref.value = null

      const result = await search(query.value, activeFilter.value)
      results.value = result.items || []
      nextHref.value = result.nextHref
      hasMore.value = result.hasMore || false
    } catch (err) {
      error.value = 'Failed to search. Please try again.'
      results.value = []
      nextHref.value = null
      hasMore.value = false
    } finally {
      isLoading.value = false
    }
  }

  function setFilter(filter) {
    activeFilter.value = filter
    // Relance la recherche avec le nouveau filtre si query non vide
    if (query.value.trim()) onSearch()
  }

  async function loadMore() {
    if (!nextHref.value || isLoading.value) {
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const params = new URLSearchParams(nextHref.value.split('?')[1])
      const offset = parseInt(params.get('offset')) || results.value.length
      const result = await searchByType(query.value, activeFilter.value, offset)

      results.value.push(...(result.items || []))
      nextHref.value = result.nextHref
      hasMore.value = !!result.nextHref
    } catch (err) {
      error.value = 'Failed to load more results'
    } finally {
      isLoading.value = false
    }
  }

  function clearSearch() {
    clearTimeout(debounceTimer)
    query.value = ''
    results.value = []
    suggestions.value = []
    isLoading.value = false
    error.value = null
    hasMore.value = false
    nextHref.value = null
    activeFilter.value = 'all'
  }

  return {
    query,
    results,
    suggestions,
    isLoading,
    error,
    hasMore,
    nextHref,
    activeFilter,
    onQueryInput,
    onSearch,
    setFilter,
    loadMore,
    clearSearch
  }
}

export default useSearch
