const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const config = require('../config')

let ffmpegPath = null

async function checkFfmpeg() {
  return new Promise((resolve) => {
    try {
      ffmpegPath = require('ffmpeg-static')
      resolve(true)
    } catch (e) {
      resolve(false)
    }
  })
}

function parseFFmpegProgress(stderrLine, duration) {
  const timeMatch = stderrLine.match(/time=(\d+):(\d+):(\d+\.\d+)/)
  if (!timeMatch) return null

  const hours = parseInt(timeMatch[1], 10)
  const minutes = parseInt(timeMatch[2], 10)
  const seconds = parseFloat(timeMatch[3])

  const currentSeconds = hours * 3600 + minutes * 60 + seconds
  const durationSeconds = duration

  if (durationSeconds > 0) {
    return Math.min(100, Math.round((currentSeconds / durationSeconds) * 100))
  }
  return null
}

function parseDuration(durationStr) {
  const match = durationStr.match(/(\d+):(\d+):(\d+\.\d+)/)
  if (!match) return 0

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const seconds = parseFloat(match[3])

  return hours * 3600 + minutes * 60 + seconds
}

async function convertToMp3(inputPath, outputPath, quality = 'medium', onProgress = () => {}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  const ffmpegBinary = ffmpegPath || 'ffmpeg'
  const qualitySettings = config.QUALITY_PRESETS[quality] || config.QUALITY_PRESETS[config.DEFAULT_QUALITY]

  let duration = 0

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegBinary, [
      '-protocol_whitelist', 'file,http,https,tcp,tls',
      '-i', inputPath,
      '-b:a', qualitySettings.bitrate,
      '-acodec', 'libmp3lame',
      '-y',
      outputPath
    ])

    let stderr = ''

    ffmpeg.stderr.on('data', (data) => {
      const text = data.toString()
      stderr += text

      if (!duration) {
        const durationMatch = text.match(/Duration: (\d+:\d+:\d+\.\d+)/)
        if (durationMatch) {
          duration = parseDuration(durationMatch[1])
        }
      }

      const progress = parseFFmpegProgress(text, duration)
      if (progress !== null) {
        onProgress(progress)
      }
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        onProgress(100)
        resolve()
      } else {
        fs.unlink(outputPath, () => {})
        reject(new Error(`FFmpeg conversion failed: ${stderr}`))
      }
    })

    ffmpeg.on('error', (error) => {
      fs.unlink(outputPath, () => {})
      reject(new Error(`FFmpeg error: ${error.message}`))
    })
  })
}

module.exports = {
  checkFfmpeg,
  convertToMp3
}
