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

module.exports = {
  resolveStreamUrl
}
