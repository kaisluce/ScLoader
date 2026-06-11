const path = require('path')
const os = require('os')

const CLIENT_ID = 'QNR5nrdLOvApYERC8AOUr3VjRfHnLjle'
const SOUNDCLOUD_API_BASE = 'https://api-v2.soundcloud.com'
const OUTPUT_DIR = path.join(os.homedir(), 'Downloads', 'SoundCloud')
const TEMP_DIR = path.join(os.tmpdir(), 'sc-downloader')
const MAX_CONCURRENT = 3

const QUALITY_PRESETS = {
  low: { bitrate: '96k', label: 'Low (96 kbps)' },
  medium: { bitrate: '160k', label: 'Medium (160 kbps)' },
  high: { bitrate: '320k', label: 'High (320 kbps)' }
}

const DEFAULT_QUALITY = 'medium'

module.exports = {
  CLIENT_ID,
  SOUNDCLOUD_API_BASE,
  OUTPUT_DIR,
  TEMP_DIR,
  MAX_CONCURRENT,
  QUALITY_PRESETS,
  DEFAULT_QUALITY
}
