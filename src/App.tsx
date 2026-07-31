import { useCallback, useEffect, useState } from 'react'
import type { Book, BookInput } from './types'
import * as db from './db'
import { BookList } from './components/BookList'
import { BookDetail } from './components/BookDetail'
import { BookForm } from './components/BookForm'

type View =
  | { name: 'list' }
  | { name: 'detail'; id: string }
  | { name: 'create' }
  | { name: 'edit'; id: string }

export default function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>({ name: 'list' })

  const refresh = useCallback(async () => {
    const list = await db.listBooks()
    setBooks(list)
  }, [])

  useEffect(() => {
    void (async () => {
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const selected =
    view.name === 'detail' || view.name === 'edit'
      ? books.find((b) => b.id === view.id)
      : undefined

  async function handleCreate(input: BookInput) {
    await db.createBook(input)
    await refresh()
    setView({ name: 'list' })
  }

  async function handleUpdate(id: string, input: BookInput) {
    await db.updateBook(id, input)
    await refresh()
    setView({ name: 'detail', id })
  }

  async function handleDelete(id: string) {
    if (!confirm('この本の記録を削除しますか？')) return
    await db.deleteBook(id)
    await refresh()
    setView({ name: 'list' })
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p className="loading">読み込み中…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden />
      <main className="app-main">
        {view.name === 'list' && (
          <BookList
            books={books}
            onSelect={(id) => setView({ name: 'detail', id })}
            onAdd={() => setView({ name: 'create' })}
          />
        )}
        {view.name === 'detail' && selected && (
          <BookDetail
            book={selected}
            onBack={() => setView({ name: 'list' })}
            onEdit={() => setView({ name: 'edit', id: selected.id })}
            onDelete={() => void handleDelete(selected.id)}
          />
        )}
        {view.name === 'detail' && !selected && (
          <p className="empty-text">
            本が見つかりません。
            <button type="button" className="btn btn-ghost" onClick={() => setView({ name: 'list' })}>
              一覧へ
            </button>
          </p>
        )}
        {view.name === 'create' && (
          <BookForm onCancel={() => setView({ name: 'list' })} onSave={handleCreate} />
        )}
        {view.name === 'edit' && selected && (
          <BookForm
            book={selected}
            onCancel={() => setView({ name: 'detail', id: selected.id })}
            onSave={(input) => handleUpdate(selected.id, input)}
          />
        )}
      </main>
    </div>
  )
}
