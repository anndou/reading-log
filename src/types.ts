export type Rating = 'kami' | 'great' | 'ok' | 'meh'

export interface Reading {
  id: string
  /** YYYY-MM-DD */
  date: string
  rating: Rating
}

export interface Book {
  id: string
  title: string
  author: string
  /** Cover image stored as Blob in IndexedDB */
  cover?: Blob
  readings: Reading[]
  createdAt: number
  updatedAt: number
}

export type BookInput = {
  title: string
  author: string
  cover?: Blob | null
  readings: Array<{ id?: string; date: string; rating: Rating }>
}
