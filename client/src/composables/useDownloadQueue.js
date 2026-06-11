import { ref, onMounted, onUnmounted } from 'vue'

const BASE_URL = 'http://localhost:3000/api'
const POLL_INTERVAL = 1000

function useDownloadQueue() {
  const queue = ref([])
  const config = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  let pollTimer = null

  async function fetchQueue() {
    try {
      isLoading.value = true
      error.value = null
      const response = await fetch(`${BASE_URL}/downloads`)

      if (!response.ok) {
        throw new Error('Failed to fetch queue')
      }

      const data = await response.json()
      queue.value = data.items
      config.value = data.config
    } catch (err) {
      error.value = err.message
      console.error('Error fetching queue:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addToQueue(track, quality = 'medium') {
    try {
      isLoading.value = true
      error.value = null

      if (!track.transcodings || track.transcodings.length === 0) {
        throw new Error('Track has no available streams')
      }

      const response = await fetch(`${BASE_URL}/downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, quality })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add to queue')
      }

      const { id } = await response.json()
      await fetchQueue()
      return id
    } catch (err) {
      error.value = err.message
      console.error('Error adding to queue:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeFromQueue(id) {
    try {
      const response = await fetch(`${BASE_URL}/downloads/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove from queue')
      }

      await fetchQueue()
    } catch (err) {
      error.value = err.message
      console.error('Error removing from queue:', err)
    }
  }

  async function clearCompleted() {
    try {
      const response = await fetch(`${BASE_URL}/downloads/clearCompleted`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to clear completed')
      }

      await fetchQueue()
    } catch (err) {
      error.value = err.message
      console.error('Error clearing completed:', err)
    }
  }

  function startPolling() {
    fetchQueue()
    pollTimer = setInterval(fetchQueue, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    queue,
    config,
    isLoading,
    error,
    addToQueue,
    removeFromQueue,
    clearCompleted,
    fetchQueue
  }
}

export default useDownloadQueue
