import { BASE_URL, buildParams } from '@/config/soundcloud'

function normalizeTrack(item) {
  return {
    id: item.id,
    title: item.title,
    artist: item.user?.username || 'Unknown',
    duration: item.duration,
    artworkUrl: item.artwork_url?.replace('-large', '-t300x300') || null,
    permalinkUrl: item.permalink_url,
    streamable: item.streamable,
    downloadable: item.downloadable,
    trackAuthorization: item.track_authorization,
    policy: item.policy || 'ALLOW',
    transcodings: (item.media?.transcodings || []).map(t => ({
      url: t.url,
      preset: t.preset,
      protocol: t.format?.protocol,
      mimeType: t.format?.mime_type,
      quality: t.quality
    }))
  }
}

function normalizePlaylist(item) {
  return {
    id: item.id,
    title: item.title,
    artist: item.user?.username || 'Unknown',
    artworkUrl: item.artwork_url?.replace('-large', '-t300x300') || null,
    permalinkUrl: item.permalink_url,
    trackCount: item.track_count ?? (item.tracks?.length || 0),
    isAlbum: item.is_album || false,
    setType: item.set_type || (item.is_album ? 'album' : 'playlist'),
    releaseDate: item.release_date || null,
    genre: item.genre || null,
    // Embedded tracks: SoundCloud only sends full objects for the first few;
    // the rest are stubs ({ id }) without media. Keep only the complete ones here.
    tracks: (item.tracks || [])
      .filter(t => t.title && t.media)
      .map(normalizeTrack),
    kind: 'playlist'
  }
}

function getBestTranscoding(track) {
  if (!track.transcodings || track.transcodings.length === 0) {
    return null
  }

  // Priority 1: progressive + mp3_1_0
  let best = track.transcodings.find(
    t => t.protocol === 'progressive' && t.preset === 'mp3_1_0'
  )
  if (best) return best

  // Priority 2: progressive (any preset)
  best = track.transcodings.find(t => t.protocol === 'progressive')
  if (best) return best

  // Priority 3: hls + mp3_1_0
  best = track.transcodings.find(
    t => t.protocol === 'hls' && t.preset === 'mp3_1_0'
  )
  if (best) return best

  // Fallback: first available
  return track.transcodings[0]
}

async function searchSuggestions(query) {
  try {
    const params = buildParams({ q: query, limit: '10', offset: '0' })
    const url = `${BASE_URL}/search/queries?${params.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return (data.collection || []).map(item => item.output)
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    throw error
  }
}

async function searchTracks(query, offset = 0) {
  try {
    const params = buildParams({
      q: query,
      facet: 'model',
      limit: '20',
      offset: offset.toString()
    })
    const url = `${BASE_URL}/search?${params.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const collection = data.collection || []

    return {
      tracks: collection
        .filter(item => item.kind === 'track')
        .map(item => normalizeTrack(item)),
      nextHref: data.next_href,
      hasMore: !!data.next_href
    }
  } catch (error) {
    console.error('Error searching tracks:', error)
    throw error
  }
}

const SEARCH_ENDPOINTS = {
  all: '/search',
  tracks: '/search/tracks',
  playlists: '/search/playlists',
  albums: '/search/albums'
}

async function searchByType(query, type = 'all', offset = 0) {
  const path = SEARCH_ENDPOINTS[type] || SEARCH_ENDPOINTS.all

  const extra = { q: query, limit: '20', offset: offset.toString() }
  if (type === 'all') extra.facet = 'model'
  if (type === 'albums') extra.facet = 'genre'

  const params = buildParams(extra)
  const url = `${BASE_URL}${path}?${params.toString()}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const collection = data.collection || []

  const items = collection
    // In the mixed "all" feed, keep only tracks & playlists (drop users, etc.)
    .filter(item => type !== 'all' || ['track', 'playlist'].includes(item.kind))
    .map(item => {
      const isPlaylist =
        type === 'playlists' || type === 'albums' || item.kind === 'playlist'
      return isPlaylist ? normalizePlaylist(item) : normalizeTrack(item)
    })
    .filter(item => item && item.id)

  return {
    items,
    nextHref: data.next_href || null
  }
}

async function resolveUrl(url) {
  try {
    const params = buildParams({ url })
    const fetchUrl = `${BASE_URL}/resolve?${params.toString()}`

    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.kind === 'track') {
      return {
        tracks: [normalizeTrack(data)],
        nextHref: null,
        hasMore: false
      }
    } else if (data.kind === 'playlist') {
      const playlist = await fetchPlaylist(data.id)
      return {
        tracks: playlist.tracks,
        nextHref: null,
        hasMore: false
      }
    } else {
      throw new Error('Invalid resource type')
    }
  } catch (error) {
    console.error('Error resolving URL:', error)
    throw error
  }
}

async function fetchTracksByIds(ids) {
  try {
    if (!ids || ids.length === 0) {
      return []
    }

    const fetched = []

    for (const id of ids) {
      const params = buildParams({ ids: String(id) })
      const url = `${BASE_URL}/tracks?${params.toString()}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      fetched.push(...(data.collection || []).map(normalizeTrack))
    }

    return fetched
  } catch (error) {
    console.error('Error fetching tracks by IDs:', error)
    throw error
  }
}

async function fetchPlaylist(id) {
  const params = buildParams({})
  const url = `${BASE_URL}/playlists/${id}?${params.toString()}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const playlist = normalizePlaylist(data)

  // /playlists/{id} embeds full data only for the first tracks; the others come
  // back as stubs ({ id }). Batch-fetch the missing ones so every track carries
  // its transcodings (required by the download queue), then restore the order.
  const rawTracks = data.tracks || []
  const loadedIds = new Set(playlist.tracks.map(t => t.id))
  const missingIds = rawTracks.map(t => t.id).filter(tid => !loadedIds.has(tid))

  if (missingIds.length > 0) {
    const fetched = []
    for (let i = 0; i < missingIds.length; i += 50) {
      fetched.push(...(await fetchTracksByIds(missingIds.slice(i, i + 50))))
    }
    const byId = new Map([...playlist.tracks, ...fetched].map(t => [t.id, t]))
    playlist.tracks = rawTracks.map(t => byId.get(t.id)).filter(Boolean)
  }

  return playlist
}

async function search(input, type = 'all') {
  if (!input || !input.trim()) {
    throw new Error('Search query cannot be empty')
  }

  const trimmedInput = input.trim()

  if (trimmedInput.includes('soundcloud.com')) {
    const resolved = await resolveUrl(trimmedInput)
    return {
      items: resolved.tracks,
      nextHref: resolved.nextHref,
      hasMore: resolved.hasMore
    }
  }

  const { items, nextHref } = await searchByType(trimmedInput, type, 0)
  return { items, nextHref, hasMore: !!nextHref }
}

export {
  search,
  searchByType,
  fetchPlaylist,
  searchSuggestions,
  searchTracks,
  resolveUrl,
  fetchTracksByIds,
  getBestTranscoding,
  normalizeTrack,
  normalizePlaylist
}
