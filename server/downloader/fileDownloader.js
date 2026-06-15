const https = require('https')
const fs = require('fs')
const path = require('path')
const config = require('../config')

const MAX_RETRIES = 3

/**
 * @param {string} url
 * @param {string} fileName
 * @param {(percent: number) => void} onProgress
 * @param {(contentLength: number|null) => void} onStart  Called once when the response headers arrive
 */
async function downloadToTemp(url, fileName, onProgress = () => {}, onStart = () => {}) {
  const tempDir = config.TEMP_DIR

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const filePath = path.join(tempDir, fileName)
  let retries = 0

  const attemptDownload = () => {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`))
          return
        }

        const contentLength = parseInt(res.headers['content-length'], 10)
        onStart(contentLength > 0 ? contentLength : null)

        let downloadedBytes = 0

        const file = fs.createWriteStream(filePath)

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length
          if (contentLength) {
            const percent = Math.round((downloadedBytes / contentLength) * 100)
            onProgress(percent)
          } else {
            onProgress(-1)
          }
        })

        res.pipe(file)

        file.on('finish', () => {
          file.close()
          onProgress(100)
          resolve(filePath)
        })

        file.on('error', (err) => {
          fs.unlink(filePath, () => {})
          reject(err)
        })
      }).on('error', reject)
    })
  }

  while (retries < MAX_RETRIES) {
    try {
      return await attemptDownload()
    } catch (error) {
      retries++
      if (retries >= MAX_RETRIES) {
        throw new Error(`Download failed after ${MAX_RETRIES} retries: ${error.message}`)
      }
      await new Promise(r => setTimeout(r, 1000 * retries))
    }
  }
}

module.exports = {
  downloadToTemp
}
