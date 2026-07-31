import { useEffect, useState } from 'react'
import type { Rating } from '../types'
import { ratingLabel } from '../ratings'

type Props = {
  rating: Rating
  size?: 'sm' | 'md'
}

export function RatingBadge({ rating, size = 'sm' }: Props) {
  return (
    <span className={`rating-badge rating-${rating} rating-${size}`}>
      {ratingLabel(rating)}
    </span>
  )
}

type CoverProps = {
  cover?: Blob
  title: string
  size?: 'list' | 'detail' | 'form'
}

export function CoverImage({ cover, title, size = 'list' }: CoverProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!cover) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(cover)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [cover])

  if (url) {
    return (
      <img
        className={`cover cover-${size}`}
        src={url}
        alt={`${title}の書影`}
        draggable={false}
      />
    )
  }

  return (
    <div className={`cover cover-${size} cover-placeholder`} aria-hidden>
      <span>{title.slice(0, 1) || '本'}</span>
    </div>
  )
}
