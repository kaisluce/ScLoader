const express = require('express')
const cors = require('cors')
const { router: downloaderRouter, initDownloader } = require('./downloader')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const SOUNDCLOUD_API_BASE = 'https://api-v2.soundcloud.com'

async function proxySoundCloudRequest(path, params) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${SOUNDCLOUD_API_BASE}${path}?${queryString}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`SoundCloud API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error proxying ${path}:`, error)
    throw error
  }
}

app.get('/api/soundcloud/*', async (req, res) => {
  try {
    const path = req.params[0]
    const params = req.query

    const data = await proxySoundCloudRequest(`/${path}`, params)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Failed to fetch from SoundCloud'
    })
  }
})

app.use('/api', downloaderRouter)

app.listen(PORT, async () => {
  await initDownloader()
  console.log(`✓ SoundCloud proxy server running on http://localhost:${PORT}`)
  console.log(`✓ Download API available at /api/downloads`)
})
