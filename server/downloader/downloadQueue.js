const { EventEmitter } = require('events')
const { randomUUID } = require('crypto')
const fs = require('fs')
const path = require('path')
const { resolveStreamUrl } = require('./streamResolver')
const { downloadToTemp } = require('./fileDownloader')
const { convertToMp3 } = require('./ffmpegProcessor')
const config = require('../config')

class DownloadQueue extends EventEmitter {
  constructor() {
    super()
    this.queue = []
    this.activeCount = 0
    this.isProcessing = false
  }

  addToQueue(track, quality = 'medium') {
    if (!track || !track.id) {
      throw new Error('Invalid track object')
    }

    const id = randomUUID()
    const item = {
      id,
      track,
      quality,
      status: 'pending',
      progress: 0,
      error: null,
      outputPath: null,
      addedAt: new Date()
    }

    this.queue.push(item)
    this.emit('queue:update', this.getQueue())
    this.processQueue()

    return id
  }

  removeFromQueue(id) {
    const index = this.queue.findIndex(item => item.id === id)
    if (index !== -1) {
      const item = this.queue[index]
      if (item.status === 'pending') {
        this.queue.splice(index, 1)
        this.emit('queue:update', this.getQueue())
      } else if (!['done', 'error'].includes(item.status)) {
        item.status = 'cancelled'
        this.activeCount = Math.max(0, this.activeCount - 1)
        this.emit('queue:update', this.getQueue())
        this.processQueue()
      }
    }
  }

  clearCompleted() {
    this.queue = this.queue.filter(item => !['done', 'error'].includes(item.status))
    this.emit('queue:update', this.getQueue())
  }

  getQueue() {
    return this.queue.map(item => ({
      id: item.id,
      track: item.track,
      status: item.status,
      progress: item.progress,
      error: item.error,
      outputPath: item.outputPath,
      addedAt: item.addedAt
    }))
  }

  async processQueue() {
    if (this.isProcessing || this.activeCount >= config.MAX_CONCURRENT) {
      return
    }

    const nextItem = this.queue.find(item => item.status === 'pending')
    if (!nextItem) {
      return
    }

    this.isProcessing = true
    this.activeCount++

    try {
      await this.executeDownload(nextItem)
    } catch (error) {
      console.error(`Download error for ${nextItem.track.title}:`, error)
    } finally {
      this.activeCount = Math.max(0, this.activeCount - 1)
      this.isProcessing = false
      this.emit('queue:update', this.getQueue())
      this.processQueue()
    }
  }

  async executeDownload(item) {
    if (item.status === 'cancelled') {
      item.status = 'error'
      item.error = 'Cancelled by user'
      return
    }

    const track = item.track
    const fileName = `${track.title.replace(/[^a-z0-9]/gi, '_')}_${track.id}.mp3`

    try {
      item.status = 'resolving'
      item.progress = 0
      this.emit('queue:update', this.getQueue())

      const bestTranscoding = track.transcodings && track.transcodings[0]
      if (!bestTranscoding) {
        throw new Error('No transcodings available')
      }

      const streamUrl = await resolveStreamUrl(
        bestTranscoding,
        track.trackAuthorization,
        config.CLIENT_ID
      )

      item.status = 'downloading'
      item.progress = 0
      this.emit('queue:update', this.getQueue())

      const tempPath = await downloadToTemp(
        streamUrl,
        fileName,
        (percent) => {
          item.progress = percent
          this.emit('queue:update', this.getQueue())
        }
      )

      item.status = 'converting'
      item.progress = 0
      this.emit('queue:update', this.getQueue())

      if (!fs.existsSync(config.OUTPUT_DIR)) {
        fs.mkdirSync(config.OUTPUT_DIR, { recursive: true })
      }

      const outputPath = path.join(config.OUTPUT_DIR, fileName)

      await convertToMp3(
        tempPath,
        outputPath,
        item.quality,
        (percent) => {
          item.progress = percent
          this.emit('queue:update', this.getQueue())
        }
      )

      fs.unlink(tempPath, () => {})

      item.status = 'done'
      item.progress = 100
      item.outputPath = outputPath
      this.emit('queue:update', this.getQueue())
    } catch (error) {
      item.status = 'error'
      item.progress = 0
      item.error = error.message
      this.emit('queue:update', this.getQueue())
    }
  }
}

module.exports = DownloadQueue
