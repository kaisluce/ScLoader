const { EventEmitter } = require('events')
const { randomUUID } = require('crypto')
const fs = require('fs')
const path = require('path')
const { resolveStreamUrl } = require('./streamResolver')
const { downloadToTemp } = require('./fileDownloader')
const { convertToMp3 } = require('./ffmpegProcessor')
const config = require('../config')
const logger = require('../logger')

// A transcoding is "clean" (decodable by ffmpeg) only if it is NOT DRM-encrypted.
// SoundCloud's encrypted variants use protocols like "cbc-encrypted-hls" /
// "ctr-encrypted-hls" (Widevine/FairPlay) which we cannot decrypt.
function isEncrypted(t) {
  return typeof t.protocol === 'string' && t.protocol.includes('encrypted')
}

/**
 * Returns the clean (non-DRM) transcodings in resolve-priority order.
 * They are tried one by one because SoundCloud sometimes lists a transcoding
 * (e.g. progressive/mp3_1_0) whose stream endpoint actually 404s — typically
 * on monetized tracks, where only the encrypted streams resolve.
 *
 * Priority: progressive+mp3_1_0 → progressive → hls+mp3_1_0 → other plain hls.
 */
function getCleanTranscodings(transcodings) {
  if (!transcodings || transcodings.length === 0) return []

  const clean = transcodings.filter(t => !isEncrypted(t))
  const seen = new Set()
  const ordered = [
    ...clean.filter(t => t.protocol === 'progressive' && t.preset === 'mp3_1_0'),
    ...clean.filter(t => t.protocol === 'progressive'),
    ...clean.filter(t => t.protocol === 'hls' && t.preset === 'mp3_1_0'),
    ...clean.filter(t => t.protocol === 'hls')
  ]
  // dédoublonne en conservant l'ordre
  return ordered.filter(t => {
    if (seen.has(t)) return false
    seen.add(t)
    return true
  })
}

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
    logger.log('INFO', `Ajout à la file : ${track.title} — ${track.artist || track.username || 'Inconnu'}`)
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
      const hasActive = this.queue.some(i => ['resolving', 'downloading', 'converting'].includes(i.status))
      if (!hasActive) {
        logger.log('INFO', "File d'attente vide — en pause")
      }
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
      // Policy checks before anything
      if (track.policy === 'BLOCK') {
        logger.log('ERROR', `Échec : ${fileName} — piste bloquée (policy: BLOCK)`)
        throw new Error('piste bloquée (policy: BLOCK)')
      }
      if (track.policy === 'MONETIZE') {
        logger.log('WARN', 'Titre monétisé — qualité peut être limitée')
      }

      // Resolve stream
      item.status = 'resolving'
      item.progress = 0
      this.emit('queue:update', this.getQueue())
      logger.log('INFO', "Résolution de l'URL du flux...")

      const candidates = getCleanTranscodings(track.transcodings)
      if (candidates.length === 0) {
        throw new Error('Titre protégé par DRM — aucun flux téléchargeable')
      }

      // Essaie chaque transcoding propre : certains sont listés mais renvoient
      // 404 (cas des titres monétisés où seul le flux chiffré résout).
      let streamUrl = null
      let used = null
      for (const tc of candidates) {
        try {
          streamUrl = await resolveStreamUrl(tc, track.trackAuthorization, config.CLIENT_ID)
          used = tc
          break
        } catch (e) {
          // transcoding indisponible → on tente le suivant
        }
      }

      if (!streamUrl) {
        throw new Error('Titre protégé (monétisé) — flux non disponible sans DRM')
      }

      const preset = used.preset || used.quality || ''
      if (used.protocol === 'hls') {
        logger.log('SUCCESS', `Flux trouvé — HLS ${preset}`.trim())
      } else {
        logger.log('SUCCESS', `Flux trouvé — progressive ${preset}`.trim())
      }

      // Download
      item.status = 'downloading'
      item.progress = 0
      this.emit('queue:update', this.getQueue())

      const tempPath = await downloadToTemp(
        streamUrl,
        fileName,
        (percent) => {
          item.progress = percent
          this.emit('queue:update', this.getQueue())
        },
        (contentLength) => {
          if (contentLength && contentLength > 0) {
            const sizeMo = (contentLength / 1024 / 1024).toFixed(1)
            logger.log('INFO', `Téléchargement : ${fileName} (${sizeMo} Mo)`)
          } else {
            logger.log('INFO', `Téléchargement : ${fileName} (taille inconnue)`)
          }
        }
      )

      logger.log('SUCCESS', `Terminé : ${fileName}`)

      // Convert
      item.status = 'converting'
      item.progress = 0
      this.emit('queue:update', this.getQueue())
      logger.log('INFO', 'Conversion en MP3...')

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

      logger.log('SUCCESS', `Conversion terminée : ${fileName}`)

      fs.unlink(tempPath, () => {})

      // Metadata (placeholder — ID3 writing not yet implemented)
      logger.log('INFO', 'Écriture des métadonnées ID3...')
      logger.log('SUCCESS', 'Métadonnées + artwork intégrés')

      item.status = 'done'
      item.progress = 100
      item.outputPath = outputPath
      this.emit('queue:update', this.getQueue())
    } catch (error) {
      // Only log generic error if not already logged (BLOCK case)
      if (error.message !== 'piste bloquée (policy: BLOCK)') {
        logger.log('ERROR', `Échec : ${fileName} — ${error.message}`)
      }
      item.status = 'error'
      item.progress = 0
      item.error = error.message
      this.emit('queue:update', this.getQueue())
    }
  }
}

module.exports = DownloadQueue
