const express = require('express')
const DownloadQueue = require('./downloadQueue')
const { checkFfmpeg } = require('./ffmpegProcessor')
const { resolvePreviewUrl } = require('./streamResolver')
const config = require('../config')
const logger = require('../logger')
const { version } = require('../package.json')

const router = express.Router()
const queue = new DownloadQueue()

let ffmpegAvailable = false

async function initDownloader() {
  const appVersion = version || '1.0.0'
  logger.log('INFO', `Démarrage de SC Downloader v${appVersion}`)

  ffmpegAvailable = await checkFfmpeg()
  if (!ffmpegAvailable) {
    logger.log('WARN', 'FFmpeg introuvable — la conversion audio ne fonctionnera pas')
    console.warn('⚠️  FFmpeg not found. Audio conversion will not work. Install ffmpeg or ffmpeg-static.')
  } else {
    console.log('✓ FFmpeg available')
  }

  if (config.CLIENT_ID) {
    logger.log('SUCCESS', 'Authentifié — client_id valide')
  }

  queue.on('queue:update', (state) => {
    console.log(`Queue updated: ${state.length} items (${state.filter(i => ['downloading', 'converting'].includes(i.status)).length} active)`)
  })
}

router.post('/downloads', (req, res) => {
  try {
    const { track, quality = 'medium', outputDir } = req.body

    if (!track || !track.id) {
      return res.status(400).json({ error: 'Invalid track object' })
    }

    if (!track.transcodings || track.transcodings.length === 0) {
      return res.status(400).json({ error: 'Track has no available transcodings' })
    }

    if (!outputDir) {
      return res.status(400).json({ error: 'NO_OUTPUT_DIR' })
    }

    const id = queue.addToQueue(track, quality, outputDir)
    res.json({ id, status: 'pending' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/downloads', (req, res) => {
  res.json({
    items: queue.getQueue(),
    config: {
      outputDir: null,
      maxConcurrent: config.MAX_CONCURRENT,
      ffmpegAvailable,
      qualityPresets: config.QUALITY_PRESETS
    }
  })
})

router.delete('/downloads/:id', (req, res) => {
  try {
    queue.removeFromQueue(req.params.id)
    res.json({ status: 'removed' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/downloads/clearCompleted', (req, res) => {
  try {
    queue.clearCompleted()
    res.json({ status: 'cleared' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Résout une URL de preview lisible par <audio> (progressive, sans DRM).
// Équivalent HTTP du handler IPC 'player:resolveUrl'.
router.post('/player/resolve', async (req, res) => {
  try {
    const { track } = req.body

    if (!track || !track.id) {
      return res.status(400).json({ error: 'Invalid track object' })
    }

    const url = await resolvePreviewUrl(track)
    res.json({ url }) // url === null => preview indisponible
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/downloader/status', (req, res) => {
  res.json({
    ffmpegAvailable,
    queueLength: queue.queue.length,
    activeDownloads: queue.activeCount,
    outputDir: null
  })
})

module.exports = {
  router,
  queue,
  initDownloader
}
