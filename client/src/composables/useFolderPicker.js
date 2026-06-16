import { API_BASE_URL } from '@/config/api'

async function pickFolder() {
  if (window.electronAPI?.browseFolder) {
    return await window.electronAPI.browseFolder() || null
  }

  try {
    const res = await fetch(`${API_BASE_URL}/browse-folder`)
    const data = await res.json()
    return data.path || null
  } catch {
    return null
  }
}

export { pickFolder }
