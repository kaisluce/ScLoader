import { ref } from 'vue'

const STORAGE_KEY = 'sc-theme'

// État singleton (hors du composable)
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const theme = ref(stored === 'light' ? 'light' : 'dark')

function apply(value) {
  if (typeof document === 'undefined') return
  if (value === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

function setTheme(value) {
  theme.value = value === 'light' ? 'light' : 'dark'
  apply(theme.value)
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme.value)
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
}

// Applique le thème mémorisé dès le chargement du module
apply(theme.value)

export default function useTheme() {
  return { theme, setTheme, toggleTheme }
}
