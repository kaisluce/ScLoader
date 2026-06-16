<template>
  <section class="search-section">

    <!-- ═══ Vue détail playlist / album ═══ -->
    <PlaylistDetail
      v-if="searchState.openedPlaylist"
      :playlist="searchState.openedPlaylist"
      @back="closePlaylist()"
      @search="onDetailSearch"
      @download="$emit('download', $event)"
      @download-all="$emit('download-all', $event)"
    />

    <!-- ═══ Vue résultats ═══ -->
    <template v-else>
      <!-- Barre de recherche + toolbar -->
      <div class="search-header">
        <div class="search-bar" :class="{ focused: inputFocused }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Colle un lien SoundCloud ou recherche un artiste..."
            class="search-input"
            @input="onSearchInput"
            @keyup.enter="onSearch"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
          />
          <button class="search-btn" @click="onSearch" :disabled="isLoading || !searchQuery.trim()">
            Rechercher
          </button>
        </div>

        <!-- Filtres -->
        <div v-if="searchQuery.trim() || results.length > 0" class="filters">
          <button
            v-for="f in filters"
            :key="f.value"
            class="filter-pill"
            :class="{ active: activeFilter === f.value }"
            @click="onFilter(f.value)"
          >{{ f.label }}</button>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <span class="result-label">{{ resultLabel }}</span>
          </div>

          <div class="view-controls">
            <div class="view-toggle">
              <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" title="Grille" @click="viewMode = 'grid'">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button class="toggle-btn" :class="{ active: viewMode === 'list' }" title="Liste" @click="viewMode = 'list'">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            </div>

            <div v-if="viewMode === 'grid'" class="density">
              <input
                class="density-range"
                type="range"
                min="2"
                max="6"
                step="1"
                :value="gridCols"
                :style="{ '--pct': densityPct + '%' }"
                title="Cartes par ligne"
                @input="gridCols = Number($event.target.value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Corps scrollable -->
      <div class="results-body sc-scroll" ref="resultsScrollEl">
        <EmptyState
          v-if="!isLoading && searchPerformed && results.length === 0"
          :icon="SearchIcon"
          title="Aucun résultat"
          description="Essaie un autre mot-clé ou colle un lien SoundCloud direct dans la barre de recherche."
        />

        <LoadingSkeleton v-else-if="isLoading" :type="viewMode === 'grid' ? 'card' : 'list'" :count="viewMode === 'grid' ? 8 : 6" />

        <div v-else-if="results.length > 0 && viewMode === 'grid'" class="results-grid" :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }">
          <template v-for="item in results">
            <PlaylistCard
              v-if="item.kind === 'playlist'"
              :key="itemKey(item)"
              :playlist="item"
              view-mode="grid"
              @open="onOpenPlaylist"
              @download-all="$emit('download-all', $event)"
            />
            <TrackCard
              v-else
              :key="itemKey(item)"
              :track="item"
              @download="$emit('download', item)"
            />
          </template>
        </div>

        <div v-else-if="results.length > 0 && viewMode === 'list'" class="results-list">
          <template v-for="item in results">
            <PlaylistCard
              v-if="item.kind === 'playlist'"
              :key="itemKey(item)"
              :playlist="item"
              view-mode="list"
              @open="onOpenPlaylist"
              @download-all="$emit('download-all', $event)"
            />
            <TrackListItem
              v-else
              :key="itemKey(item)"
              :track="item"
              @download="$emit('download', item)"
            />
          </template>
        </div>

        <div v-if="hasMore && !isLoading && results.length > 0" class="load-more-wrap">
          <button class="load-more-btn" @click="loadMore">Charger plus</button>
        </div>
      </div>
    </template>

  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Search as SearchIcon } from 'lucide-vue-next'
import { searchState, openPlaylist, closePlaylist } from '@/stores/searchStore'
import useSearch from '@/composables/useSearch'
import TrackCard from '../ui/TrackCard.vue'
import TrackListItem from '../ui/TrackListItem.vue'
import PlaylistCard from '../ui/PlaylistCard.vue'
import PlaylistDetail from './PlaylistDetail.vue'
import LoadingSkeleton from '../ui/LoadingSkeleton.vue'
import EmptyState from '../ui/EmptyState.vue'

const {
  query,
  results,
  isLoading,
  hasMore,
  activeFilter,
  searchPerformed,
  onQueryInput: composableOnQueryInput,
  onSearch: composableOnSearch,
  setFilter,
  loadMore,
} = useSearch()

// searchQuery est un two-way computed sur le store via useSearch
const searchQuery = query

const viewMode = ref('grid')
const inputFocused = ref(false)

const GRID_MIN = 2
const GRID_MAX = 6
const gridCols = ref(4)
const densityPct = computed(() => ((gridCols.value - GRID_MIN) / (GRID_MAX - GRID_MIN)) * 100)

const filters = [
  { value: 'all', label: 'Tout' },
  { value: 'tracks', label: 'Titres' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'albums', label: 'Albums' },
]

const resultLabel = computed(() => {
  if (isLoading.value) return 'Recherche en cours…'
  if (searchPerformed.value && results.value.length === 0) return 'Aucun résultat'
  const n = results.value.length
  if (n > 0) return `${n} résultat${n !== 1 ? 's' : ''}`
  return ''
})

function itemKey(item) {
  return `${item.kind === 'playlist' ? 'p' : 't'}-${item.id}`
}

function onSearchInput() {
  composableOnQueryInput()
}

function onSearch() {
  if (!searchQuery.value.trim()) return
  composableOnSearch()
}

function onFilter(value) {
  if (activeFilter.value === value) return
  setFilter(value)
}

function onOpenPlaylist(playlist) {
  openPlaylist(playlist)
}

function onDetailSearch(value) {
  closePlaylist()
  searchQuery.value = value
  composableOnSearch()
}

// ── Scroll save / restore ─────────────────────────────────────────────────────
const resultsScrollEl = ref(null)
let scrollThrottle = null

function onResultsScroll() {
  if (scrollThrottle) return
  scrollThrottle = setTimeout(() => {
    searchState.scrollY = resultsScrollEl.value?.scrollTop ?? 0
    scrollThrottle = null
  }, 200)
}

function attachScroll() {
  if (!resultsScrollEl.value) return
  resultsScrollEl.value.scrollTop = searchState.scrollY
  resultsScrollEl.value.addEventListener('scroll', onResultsScroll, { passive: true })
}

function detachScroll() {
  resultsScrollEl.value?.removeEventListener('scroll', onResultsScroll)
  if (scrollThrottle) { clearTimeout(scrollThrottle); scrollThrottle = null }
}

// Quand on revient de la vue détail → restaurer le scroll
watch(() => searchState.openedPlaylist, async (newVal, oldVal) => {
  if (newVal === null && oldVal !== null) {
    await nextTick()
    attachScroll()
  } else if (newVal !== null) {
    detachScroll()
  }
})

onMounted(async () => {
  if (!searchState.openedPlaylist) {
    await nextTick()
    attachScroll()
  }
})

onBeforeUnmount(() => {
  detachScroll()
})

defineEmits(['download', 'download-all'])
</script>

<style scoped>
.search-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.search-header {
  flex-shrink: 0;
  padding: 28px 40px 18px;
  border-bottom: 1px solid var(--color-border);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 8px 8px 8px 18px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  transition: border-color var(--transition-fast);
}

.search-bar.focused,
.search-bar:focus-within {
  border-color: var(--color-border-hover);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--font-size-base);
}

.search-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 22px;
  border: none;
  border-radius: 9px;
  background-color: var(--accent);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: filter var(--transition-fast);
}

.search-btn:hover:not(:disabled) { filter: brightness(1.08); }
.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.filters {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: 16px;
}

.filter-pill {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-pill:hover:not(.active) {
  border-color: var(--color-border-hover);
  color: var(--color-text);
}

.filter-pill.active {
  background-color: var(--accent);
  border-color: transparent;
  color: #fff;
}

.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 16px;
}

.toolbar-left {
  font-size: 13.5px;
  color: var(--color-text-secondary);
  padding-top: 9px;
}

.view-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.view-toggle {
  display: flex;
  gap: 2px;
  padding: 3px;
  background-color: var(--color-surface-dark);
  border: 1px solid var(--color-border);
  border-radius: 9px;
}

.density {
  display: flex;
  align-items: center;
  width: 73px;
  padding: 0 4px;
}

.density-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    var(--accent) var(--pct, 50%),
    var(--color-border) var(--pct, 50%)
  );
  cursor: pointer;
  outline: none;
}

.density-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
}

.density-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
}

.toggle-btn {
  width: 34px;
  height: 30px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background-color: var(--color-border);
  color: var(--color-text);
}

.toggle-btn:hover:not(.active) { color: var(--color-text); }

.results-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 40px 40px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.results-list {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.load-more-btn {
  padding: 11px 26px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.load-more-btn:hover {
  background-color: var(--color-hover);
  border-color: var(--color-border-hover);
}
</style>
