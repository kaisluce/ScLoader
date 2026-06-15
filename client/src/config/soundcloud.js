const CLIENT_ID = 'QNR5nrdLOvApYERC8AOUr3VjRfHnLjle'
const APP_VERSION = '1781092636'
const APP_LOCALE = 'en'

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api'
const BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/soundcloud`

function buildParams(extra = {}) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    app_version: APP_VERSION,
    app_locale: APP_LOCALE,
    linked_partitioning: '1',
    ...extra
  })
  return params
}

export { CLIENT_ID, APP_VERSION, APP_LOCALE, API_BASE_URL, BASE_URL, buildParams }
