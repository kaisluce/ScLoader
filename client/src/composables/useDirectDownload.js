import { ref } from 'vue'
import { API_BASE_URL } from '@/config/api'

// Extrait le nom de fichier depuis l'en-tête Content-Disposition
// (gère filename*=UTF-8''… en priorité, puis filename="…").
function filenameFromHeader(header, fallback) {
  if (!header) return fallback
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8) {
    try { return decodeURIComponent(utf8[1]) } catch { /* ignore */ }
  }
  const ascii = header.match(/filename="([^"]+)"/i)
  return ascii ? ascii[1] : fallback
}

/**
 * Téléchargement web : le serveur renvoie le MP3 en pièce jointe, le navigateur
 * ouvre sa fenêtre d'enregistrement. La progression suit le streaming de la
 * réponse (le gros du temps serveur — résolution/conversion — reste un "spinner"
 * avant que les octets n'arrivent).
 */
function useDirectDownload() {
  const downloading = ref(false)
  const progress = ref(0)   // -1 = indéterminé (taille inconnue)
  const error = ref(null)

  async function download(track, quality = 'medium') {
    downloading.value = true
    progress.value = -1
    error.value = null

    try {
      const res = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, quality })
      })

      if (!res.ok) {
        let msg = `Échec (${res.status})`
        try { msg = (await res.json()).error || msg } catch { /* pas de JSON */ }
        throw new Error(msg)
      }

      const total = Number(res.headers.get('Content-Length')) || 0
      const filename = filenameFromHeader(
        res.headers.get('Content-Disposition'),
        `${track.artist || track.username || 'track'} - ${track.title}.mp3`
      )

      // Lecture incrémentale pour la barre de progression.
      const reader = res.body.getReader()
      const chunks = []
      let received = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        progress.value = total ? Math.round((received / total) * 100) : -1
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      progress.value = 100
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      downloading.value = false
    }
  }

  return { downloading, progress, error, download }
}

export default useDirectDownload
