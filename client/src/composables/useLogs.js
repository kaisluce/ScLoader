import { ref, onMounted, onUnmounted, watchEffect, nextTick } from 'vue'

const BASE_URL = 'http://localhost:3000/api'
const MAX_ENTRIES = 500

export default function useLogs(scrollContainer) {
  const logs = ref([])
  const autoScroll = ref(true)

  let eventSource = null

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Format a Date (or ISO string) as [HH:MM:SS] */
  function formatTime(date) {
    const d = date instanceof Date ? date : new Date(date)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `[${hh}:${mm}:${ss}]`
  }

  function pushEntry(entry) {
    logs.value.push(entry)
    if (logs.value.length > MAX_ENTRIES) {
      logs.value.shift()
    }
  }

  async function scrollToBottom() {
    await nextTick()
    if (scrollContainer && scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  }

  // ── Auto-scroll ──────────────────────────────────────────────────────────

  watchEffect(() => {
    // Re-runs whenever logs.value or autoScroll.value change
    if (autoScroll.value && logs.value.length) {
      scrollToBottom()
    }
  })

  // ── IPC equivalents (HTTP + SSE) ─────────────────────────────────────────

  onMounted(async () => {
    // logs:getAll equivalent
    try {
      const res = await fetch(`${BASE_URL}/logs`)
      if (res.ok) {
        logs.value = await res.json()
      }
    } catch (err) {
      console.error('useLogs: failed to fetch initial logs', err)
    }

    // logs:new equivalent — SSE stream
    eventSource = new EventSource(`${BASE_URL}/logs/stream`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.__clear) {
          logs.value = []
        } else {
          pushEntry(data)
        }
      } catch (err) {
        console.error('useLogs: failed to parse SSE event', err)
      }
    }

    eventSource.onerror = () => {
      // Browser retries automatically; just log to console
      console.warn('useLogs: SSE connection error — retrying...')
    }
  })

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  })

  // ── logs:clear equivalent ────────────────────────────────────────────────

  async function clearLogs() {
    try {
      await fetch(`${BASE_URL}/logs/clear`, { method: 'POST' })
      logs.value = []
    } catch (err) {
      console.error('useLogs: failed to clear logs', err)
    }
  }

  return {
    logs,
    autoScroll,
    clearLogs,
    formatTime,
  }
}
