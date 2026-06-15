import { reactive } from 'vue'

const PLAYER_API = 'http://localhost:3000/api'

// État réactif global (singleton, hors du composable)
const state = reactive({
  currentTrack: null,
  streamUrl: null,
  isPlaying: false,
  isLoading: false,
  isUnavailable: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8
})

// Un seul objet Audio partagé, jamais recréé — on met juste à jour audio.src
let audio = null
// Jeton incrémenté à chaque play()/close() pour ignorer les résolutions obsolètes
let requestToken = 0

function getAudio() {
  if (audio) return audio

  audio = new Audio()
  audio.volume = state.volume

  audio.addEventListener('timeupdate', () => {
    state.currentTime = audio.currentTime
  })
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) state.duration = audio.duration
  })
  audio.addEventListener('ended', () => {
    state.isPlaying = false
    state.currentTime = 0
  })
  audio.addEventListener('play', () => {
    state.isPlaying = true
  })
  audio.addEventListener('pause', () => {
    state.isPlaying = false
  })

  return audio
}

async function resolvePreview(track) {
  const res = await fetch(`${PLAYER_API}/player/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track })
  })
  if (!res.ok) throw new Error('Preview resolve failed')
  const data = await res.json()
  return data.url || null
}

async function play(track) {
  if (!track) return
  const a = getAudio()

  // Même track déjà chargée → simple toggle lecture/pause
  if (state.currentTrack && state.currentTrack.id === track.id && state.streamUrl) {
    if (state.isPlaying) pause()
    else resume()
    return
  }

  const token = ++requestToken
  state.currentTrack = track
  state.streamUrl = null
  state.isUnavailable = false
  state.isLoading = true
  state.isPlaying = false
  state.currentTime = 0
  // Durée provisoire (ms → s) en attendant loadedmetadata
  state.duration = track.duration ? track.duration / 1000 : 0

  try {
    // URL signée résolue à chaque play() (les URLs expirent)
    const url = await resolvePreview(track)
    if (token !== requestToken) return // une autre track a été lancée entre-temps

    if (!url) {
      state.isUnavailable = true
      state.isLoading = false
      return
    }

    state.streamUrl = url
    a.src = url
    a.volume = state.volume
    await a.play()
    state.isLoading = false
  } catch (err) {
    if (token !== requestToken) return
    state.isUnavailable = true
    state.isLoading = false
  }
}

function pause() {
  if (audio) audio.pause()
}

function resume() {
  if (audio && state.streamUrl) {
    audio.play().catch(() => {})
  }
}

function seek(time) {
  if (audio && Number.isFinite(time)) {
    audio.currentTime = time
    state.currentTime = time
  }
}

function setVolume(v) {
  const vol = Math.min(1, Math.max(0, v))
  state.volume = vol
  if (audio) audio.volume = vol
}

function close() {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  requestToken++ // invalide toute résolution en cours
  state.currentTrack = null
  state.streamUrl = null
  state.isPlaying = false
  state.isLoading = false
  state.isUnavailable = false
  state.currentTime = 0
  state.duration = 0
}

export default function usePlayer() {
  return { state, play, pause, resume, seek, setVolume, close }
}
