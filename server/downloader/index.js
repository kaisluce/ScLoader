const express = require('express')
const DownloadQueue = require('./downloadQueue')
const { checkFfmpeg } = require('./ffmpegProcessor')
const config = require('../config')

const router = express.Router()
const queue = new DownloadQueue()

let ffmpegAvailable = false

async function initDownloader() {
  ffmpegAvailable = await checkFfmpeg()
  if (!ffmpegAvailable) {
    console.warn('⚠️  FFmpeg not found. Audio conversion will not work. Install ffmpeg or ffmpeg-static.')
  } else {
    console.log('✓ FFmpeg available')
  }

  queue.on('queue:update', (state) => {
    console.log(`Queue updated: ${state.length} items (${state.filter(i => ['downloading', 'converting'].includes(i.status)).length} active)`)
  })
}

router.post('/downloads', (req, res) => {
  try {
    const { track, quality = 'medium' } = req.body

    if (!track || !track.id) {
      return res.status(400).json({ error: 'Invalid track object' })
    }

    if (!track.transcodings || track.transcodings.length === 0) {
      return res.status(400).json({ error: 'Track has no available transcodings' })
    }

    const id = queue.addToQueue(track, quality)
    res.json({ id, status: 'pending' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/downloads', (req, res) => {
  res.json({
    items: queue.getQueue(),
    config: {
      outputDir: config.OUTPUT_DIR,
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

router.get('/downloader/status', (req, res) => {
  res.json({
    ffmpegAvailable,
    queueLength: queue.queue.length,
    activeDownloads: queue.activeCount,
    outputDir: config.OUTPUT_DIR
  })
})

module.exports = {
  router,
  queue,
  initDownloader
}
