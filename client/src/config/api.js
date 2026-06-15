const API_BASE_URL = (process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export { API_BASE_URL }
