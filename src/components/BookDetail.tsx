import type { Book } from '../types'
import { sortReadings } from '../ratings'
import { CoverImage, RatingBadge } from './Shared'

type Props = {
  book: Book
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function BookDetail({ book, onBack, onEdit, onDelete }: Props) {
  const readings = sortReadings(book.readings)

  return (
    <section className="view detail-view">
      <header className="page-header">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← 一覧
        </button>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
            編集
          </button>
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            削除
          </button>
        </div>
      </header>

      <div className="detail-hero">
        <CoverImage cover={book.cover} title={book.title} size="detail" />
        <div className="detail-copy">
          <p className="brand">読書記録</p>
          <h1>{book.title}</h1>
          <p className="author">{book.author || '著者未設定'}</p>
        </div>
      </div>

      <div className="readings-block">
        <h2>読了履歴</h2>
        {readings.length === 0 ? (
          <p className="meta-muted">まだ読了記録がありません</p>
        ) : (
          <ol className="readings-timeline">
            {readings.map((reading, index) => (
              <li key={reading.id}>
                <span className="reading-n">{index + 1}回目</span>
                <span className="reading-date">{reading.date}</span>
                <RatingBadge rating={reading.rating} size="md" />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
