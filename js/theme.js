const STORAGE_KEY = 'simple-todo:theme'

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

// Explicit user choice wins; otherwise follow the OS setting live.
export function getTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

export function initTheme() {
  const theme = getTheme()
  applyTheme(theme)
  return theme
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
