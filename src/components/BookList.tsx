import type { Book } from '../types'
import { getLatestReading } from '../ratings'
import { CoverImage, RatingBadge } from './Shared'

type Props = {
  books: Book[]
  onSelect: (id: string) => void
  onAdd: () => void
}

export function BookList({ books, onSelect, onAdd }: Props) {
  return (
    <section className="view list-view">
      <header className="page-header">
        <div>
          <p className="brand">読書記録</p>
          <h1>本棚</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          追加
        </button>
      </header>

      {books.length === 0 ? (
        <div className="empty">
          <p className="empty-title">まだ本がありません</p>
          <p className="empty-text">読んだ本を記録してみましょう</p>
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            最初の一冊を追加
          </button>
        </div>
      ) : (
        <ul className="book-list">
          {books.map((book, i) => {
            const latest = getLatestReading(book.readings)
            return (
              <li key={book.id} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <button
                  type="button"
                  className="book-row"
                  onClick={() => onSelect(book.id)}
                >
                  <CoverImage cover={book.cover} title={book.title} size="list" />
                  <div className="book-row-body">
                    <h2>{book.title}</h2>
                    <p className="author">{book.author || '著者未設定'}</p>
                    <div className="book-row-meta">
                      {latest ? (
                        <>
                          <RatingBadge rating={latest.rating} />
                          <span className="meta-muted">
                            {book.readings.length > 1
                              ? `${book.readings.length}回読了 · 最新 ${latest.date}`
                              : latest.date}
                          </span>
                        </>
                      ) : (
                        <span className="meta-muted">読了日未設定</span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
