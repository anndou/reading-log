export const FONT_STORAGE_KEY = 'reading-log-font'
export const TEXT_SIZE_STORAGE_KEY = 'reading-log-text-size'

export const FONT_IDS = [
  'mincho',
  'gothic',
  'serif',
  'rounded',
  'klee',
  'oldmincho',
  'kaisei',
  'yuji',
  'yomogi',
  'antique',
] as const
export const TEXT_SIZE_IDS = ['small', 'medium', 'large'] as const

export type FontId = (typeof FONT_IDS)[number]
export type TextSizeId = (typeof TEXT_SIZE_IDS)[number]

export type FontOption = {
  id: FontId
  label: string
  sample: string
}

export type TextSizeOption = {
  id: TextSizeId
  label: string
  description: string
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'mincho', label: '明朝', sample: '読' },
  { id: 'gothic', label: 'ゴシック', sample: '読' },
  { id: 'serif', label: '書籍', sample: '読' },
  { id: 'rounded', label: '丸ゴ', sample: '読' },
  { id: 'klee', label: '筆記', sample: '読' },
  { id: 'oldmincho', label: '古明', sample: '読' },
  { id: 'kaisei', label: '楷書', sample: '読' },
  { id: 'yuji', label: '習字', sample: '読' },
  { id: 'yomogi', label: '手書', sample: '読' },
  { id: 'antique', label: '骨董', sample: '読' },
]

export const TEXT_SIZE_OPTIONS: TextSizeOption[] = [
  { id: 'small', label: '小', description: '小さめ' },
  { id: 'medium', label: '中', description: '標準' },
  { id: 'large', label: '大', description: '大きめ' },
]

export function isFontId(value: string): value is FontId {
  return (FONT_IDS as readonly string[]).includes(value)
}

export function isTextSizeId(value: string): value is TextSizeId {
  return (TEXT_SIZE_IDS as readonly string[]).includes(value)
}

export function getStoredFont(): FontId {
  try {
    const raw = localStorage.getItem(FONT_STORAGE_KEY)
    if (raw && isFontId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'mincho'
}

export function getStoredTextSize(): TextSizeId {
  try {
    const raw = localStorage.getItem(TEXT_SIZE_STORAGE_KEY)
    if (raw && isTextSizeId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'medium'
}

export function applyFont(id: FontId) {
  document.documentElement.dataset.font = id
}

export function applyTextSize(id: TextSizeId) {
  document.documentElement.dataset.textSize = id
}

export function setFont(id: FontId) {
  applyFont(id)
  try {
    localStorage.setItem(FONT_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function setTextSize(id: TextSizeId) {
  applyTextSize(id)
  try {
    localStorage.setItem(TEXT_SIZE_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function initTypography() {
  applyFont(getStoredFont())
  applyTextSize(getStoredTextSize())
}
