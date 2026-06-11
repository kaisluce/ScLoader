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
      return {
        tracks: (data.tracks || []).map(normalizeTrack),
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

    const params = buildParams({ ids: ids.join(',') })
    const url = `${BASE_URL}/tracks?${params.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return (data.collection || []).map(normalizeTrack)
  } catch (error) {
    console.error('Error fetching tracks by IDs:', error)
    throw error
  }
}

async function search(input) {
  if (!input || !input.trim()) {
    throw new Error('Search query cannot be empty')
  }

  const trimmedInput = input.trim()

  if (trimmedInput.includes('soundcloud.com')) {
    return resolveUrl(trimmedInput)
  } else {
    return searchTracks(trimmedInput)
  }
}

export {
  search,
  searchSuggestions,
  searchTracks,
  resolveUrl,
  fetchTracksByIds,
  getBestTranscoding,
  normalizeTrack
}
