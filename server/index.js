const express = require('express')
const cors = require('cors')
const { router: downloaderRouter, initDownloader } = require('./downloader')
const logger = require('./logger')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// ─── SoundCloud proxy ────────────────────────────────────────────────────────

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

// ─── Logs REST ───────────────────────────────────────────────────────────────

app.get('/api/logs', (req, res) => {
  res.json(logger.getLogs())
})

app.post('/api/logs/clear', (req, res) => {
  logger.clearLogs()
  res.json({ status: 'cleared' })
})

// ─── Logs SSE ────────────────────────────────────────────────────────────────
// Equivalent of mainWindow.webContents.send('logs:new', entry) in Electron.
// Each connected renderer opens GET /api/logs/stream and receives new log
// entries as newline-delimited JSON events.

app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // Required for CORS preflight when the client is on a different origin/port
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Keep-alive heartbeat every 15 s so proxies don't drop the connection
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n')
  }, 15000)

  const onLog = (entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`)
  }

  const onClear = () => {
    res.write(`data: ${JSON.stringify({ __clear: true })}\n\n`)
  }

  logger.on('log', onLog)
  logger.on('clear', onClear)

  req.on('close', () => {
    clearInterval(heartbeat)
    logger.off('log', onLog)
    logger.off('clear', onClear)
  })
})

// ─── Folder picker ───────────────────────────────────────────────────────────

app.get('/api/browse-folder', (req, res) => {
  const { execFile, exec } = require('child_process')
  const os = require('os')

  const pl = os.platform()

  if (pl === 'darwin') {
    execFile('osascript', ['-e', 'POSIX path of (choose folder)'], (err, stdout) => {
      if (err) return res.json({ path: null })
      res.json({ path: stdout.trim().replace(/\/$/, '') })
    })
  } else if (pl === 'win32') {
    const ps = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }`
    execFile('powershell', ['-NoProfile', '-Command', ps], (err, stdout) => {
      if (err) return res.json({ path: null })
      res.json({ path: stdout.trim() || null })
    })
  } else {
    // Linux : essaie zenity, sinon kdialog
    exec('zenity --file-selection --directory 2>/dev/null || kdialog --getexistingdirectory 2>/dev/null', (err, stdout) => {
      if (err || !stdout.trim()) return res.json({ path: null })
      res.json({ path: stdout.trim() })
    })
  }
})

// ─── Downloader routes ───────────────────────────────────────────────────────

app.use('/api', downloaderRouter)

// ─── Boot ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  await initDownloader()
  console.log(`✓ SoundCloud proxy server running on http://localhost:${PORT}`)
  console.log(`✓ Download API available at /api/downloads`)
  console.log(`✓ Logs API available at /api/logs`)
})
