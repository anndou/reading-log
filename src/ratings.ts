import type { Rating, Reading } from './types'

export const RATING_OPTIONS: { value: Rating; label: string }[] = [
  { value: 'kami', label: '神' },
  { value: 'great', label: 'とてもおもしろい' },
  { value: 'ok', label: 'ふつう' },
  { value: 'meh', label: '微妙' },
]

export function ratingLabel(rating: Rating): string {
  return RATING_OPTIONS.find((o) => o.value === rating)?.label ?? rating
}

/** Latest by date; same date keeps the later entry in the array. */
export function getLatestReading(readings: Reading[]): Reading | undefined {
  if (readings.length === 0) return undefined
  return readings.reduce((latest, current) =>
    current.date >= latest.date ? current : latest,
  )
}

export function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return 0
  })
}
