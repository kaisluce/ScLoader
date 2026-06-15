const https = require('https')
const config = require('../config')

async function resolveStreamUrl(transcoding, trackAuthorization, clientId) {
  if (!transcoding || !transcoding.url) {
    throw new Error('Invalid transcoding: missing URL')
  }

  return new Promise((resolve, reject) => {
    const url = new URL(transcoding.url)
    url.searchParams.set('client_id', clientId)
    if (trackAuthorization) {
      url.searchParams.set('track_authorization', trackAuthorization)
    }

    https.get(url.toString(), { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Stream resolve failed: ${res.statusCode}`))
        return
      }

      let data = ''
      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (!json.url) {
            throw new Error('No stream URL in response')
          }
          resolve(json.url)
        } catch (error) {
          reject(new Error(`Failed to parse stream response: ${error.message}`))
        }
      })
    }).on('error', reject)
  })
}

/**
 * Picks the best transcoding usable for a DRM-free preview.
 * Only `progressive` streams are plain MP3 over HTTPS (no Widevine), so they
 * are the only ones an <audio> element can play directly.
 */
function selectPreviewTranscoding(transcodings) {
  if (!transcodings || transcodings.length === 0) return null
  return (
    transcodings.find(t => t.protocol === 'progressive' && t.preset === 'mp3_1_0') ||
    transcodings.find(t => t.protocol === 'progressive') ||
    null
  )
}

/**
 * Resolves a directly-playable CDN URL for the given track's preview.
 * Returns null when no progressive transcoding exists or resolution fails,
 * so the caller can show "Preview indisponible" instead of crashing.
 */
async function resolvePreviewUrl(track) {
  if (!track) return null

  const transcoding = selectPreviewTranscoding(track.transcodings)
  if (!transcoding) return null

  try {
    return await resolveStreamUrl(transcoding, track.trackAuthorization, config.CLIENT_ID)
  } catch (error) {
    return null
  }
}

module.exports = {
  resolveStreamUrl,
  resolvePreviewUrl
}
