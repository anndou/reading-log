export const THEME_STORAGE_KEY = 'reading-log-theme'

export const THEME_IDS = ['forest', 'sea', 'ink', 'ochre', 'wine'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export type ThemeOption = {
  id: ThemeId
  label: string
  swatch: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'forest', label: '森', swatch: '#1f4d3a' },
  { id: 'sea', label: '海', swatch: '#1e4d5c' },
  { id: 'ink', label: '墨', swatch: '#2c333a' },
  { id: 'ochre', label: '赭', swatch: '#5c4a32' },
  { id: 'wine', label: '葡萄', swatch: '#5c2a3a' },
]

const THEME_COLORS: Record<ThemeId, string> = {
  forest: '#1f4d3a',
  sea: '#1e4d5c',
  ink: '#2c333a',
  ochre: '#5c4a32',
  wine: '#5c2a3a',
}

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value)
}

export function getStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw && isThemeId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'forest'
}

function updateMetaThemeColor(color: string) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', color)
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  updateMetaThemeColor(THEME_COLORS[id])
}

export function setTheme(id: ThemeId) {
  applyTheme(id)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyTheme(getStoredTheme())
}
