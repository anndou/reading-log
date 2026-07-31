import type { Book, ExportPayload, ExportedBook, Rating, Reading } from './types'

const RATINGS: Rating[] = ['kami', 'great', 'ok', 'meh']

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('画像の変換に失敗しました'))
    }
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('表紙画像の形式が不正です')
  const mime = match[1] || 'application/octet-stream'
  const isBase64 = Boolean(match[2])
  const data = match[3]
  if (isBase64) {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }
  return new Blob([decodeURIComponent(data)], { type: mime })
}

function isReading(value: unknown): value is Reading {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.date === 'string' &&
    typeof r.rating === 'string' &&
    RATINGS.includes(r.rating as Rating) &&
    (r.impressions === undefined || typeof r.impressions === 'string')
  )
}

function isExportedBook(value: unknown): value is ExportedBook {
  if (!value || typeof value !== 'object') return false
  const b = value as Record<string, unknown>
  return (
    typeof b.id === 'string' &&
    typeof b.title === 'string' &&
    typeof b.author === 'string' &&
    typeof b.createdAt === 'number' &&
    typeof b.updatedAt === 'number' &&
    Array.isArray(b.readings) &&
    b.readings.every(isReading) &&
    (b.coverDataUrl === undefined || typeof b.coverDataUrl === 'string')
  )
}

export function parseExportPayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('バックアップファイルの形式が不正です')
  }
  const data = raw as Record<string, unknown>
  if (data.version !== 1) {
    throw new Error('対応していないバックアップ形式です')
  }
  if (!Array.isArray(data.books) || !data.books.every(isExportedBook)) {
    throw new Error('本のデータ形式が不正です')
  }
  return {
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    books: data.books,
  }
}

export async function booksToExportPayload(books: Book[]): Promise<ExportPayload> {
  const exported: ExportedBook[] = await Promise.all(
    books.map(async (book) => {
      const item: ExportedBook = {
        id: book.id,
        title: book.title,
        author: book.author,
        readings: book.readings,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }
      if (book.cover) {
        item.coverDataUrl = await blobToDataUrl(book.cover)
      }
      return item
    }),
  )
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: exported,
  }
}

export function exportPayloadToBooks(payload: ExportPayload): Book[] {
  return payload.books.map((item) => {
    const book: Book = {
      id: item.id,
      title: item.title,
      author: item.author,
      readings: item.readings,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
    if (item.coverDataUrl) {
      book.cover = dataUrlToBlob(item.coverDataUrl)
    }
    return book
  })
}

export function downloadJson(payload: ExportPayload, filename: string) {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function backupFilename(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `reading-log-${y}${m}${d}.json`
}
