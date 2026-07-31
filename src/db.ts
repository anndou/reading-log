import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Book, BookInput, Reading } from './types'

interface ReadingLogDB extends DBSchema {
  books: {
    key: string
    value: Book
    indexes: { 'by-updated': number }
  }
}

const DB_NAME = 'reading-log'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ReadingLogDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ReadingLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('books', { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return dbPromise
}

function uid(): string {
  return crypto.randomUUID()
}

function normalizeReadings(
  readings: BookInput['readings'],
): Reading[] {
  return readings.map((r) => {
    const impressions = r.impressions?.trim()
    return {
      id: r.id ?? uid(),
      date: r.date,
      rating: r.rating,
      ...(impressions ? { impressions } : {}),
    }
  })
}

export async function listBooks(): Promise<Book[]> {
  const db = await getDb()
  const books = await db.getAllFromIndex('books', 'by-updated')
  return books.reverse()
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDb()
  return db.get('books', id)
}

export async function createBook(input: BookInput): Promise<Book> {
  const now = Date.now()
  const book: Book = {
    id: uid(),
    title: input.title.trim(),
    author: input.author.trim(),
    cover: input.cover ?? undefined,
    readings: normalizeReadings(input.readings),
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDb()
  await db.put('books', book)
  return book
}

export async function updateBook(
  id: string,
  input: BookInput,
): Promise<Book | undefined> {
  const db = await getDb()
  const existing = await db.get('books', id)
  if (!existing) return undefined

  let cover = existing.cover
  if (input.cover === null) {
    cover = undefined
  } else if (input.cover instanceof Blob) {
    cover = input.cover
  }

  const book: Book = {
    ...existing,
    title: input.title.trim(),
    author: input.author.trim(),
    cover,
    readings: normalizeReadings(input.readings),
    updatedAt: Date.now(),
  }
  await db.put('books', book)
  return book
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('books', id)
}

export async function clearAllBooks(): Promise<void> {
  const db = await getDb()
  await db.clear('books')
}

export async function replaceAllBooks(books: Book[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('books', 'readwrite')
  await tx.store.clear()
  await Promise.all(books.map((book) => tx.store.put(book)))
  await tx.done
}

/** Resize & compress cover to keep IndexedDB size reasonable. */
export async function compressImage(file: File, maxSize = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画像の変換に失敗しました'))),
      'image/jpeg',
      0.85,
    )
  })
}
