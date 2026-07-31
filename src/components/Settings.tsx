import { useId, useRef, useState } from 'react'
import type { Book } from '../types'
import * as db from '../db'
import {
  backupFilename,
  booksToExportPayload,
  downloadJson,
  exportPayloadToBooks,
  parseExportPayload,
} from '../backup'

type Props = {
  bookCount: number
  onBack: () => void
  onDataChanged: () => Promise<void>
}

export function Settings({ bookCount, onBack, onDataChanged }: Props) {
  const fileInputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function clearFeedback() {
    setMessage(null)
    setError(null)
  }

  async function handleExport() {
    clearFeedback()
    setBusy(true)
    try {
      const books = await db.listBooks()
      const payload = await booksToExportPayload(books)
      downloadJson(payload, backupFilename())
      setMessage(`${books.length}冊のデータをエクスポートしました`)
    } catch {
      setError('エクスポートに失敗しました')
    } finally {
      setBusy(false)
    }
  }

  async function handleImportFile(file: File | null) {
    clearFeedback()
    if (!file) return
    if (
      bookCount > 0 &&
      !confirm(
        'インポートすると、現在のすべてのデータが置き換わります。よろしいですか？',
      )
    ) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setBusy(true)
    try {
      const text = await file.text()
      const raw: unknown = JSON.parse(text)
      const payload = parseExportPayload(raw)
      const books: Book[] = exportPayloadToBooks(payload)
      await db.replaceAllBooks(books)
      await onDataChanged()
      setMessage(`${books.length}冊のデータをインポートしました`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'インポートに失敗しました')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDeleteAll(withExport: boolean) {
    clearFeedback()
    setBusy(true)
    try {
      if (withExport) {
        const books = await db.listBooks()
        const payload = await booksToExportPayload(books)
        downloadJson(payload, backupFilename())
      }
      await db.clearAllBooks()
      await onDataChanged()
      setConfirmDelete(false)
      setMessage(
        withExport
          ? 'エクスポート後、すべてのデータを削除しました'
          : 'すべてのデータを削除しました',
      )
    } catch {
      setError(
        withExport
          ? 'エクスポートまたは削除に失敗しました'
          : '削除に失敗しました',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="view settings-view">
      <header className="page-header">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={busy}>
          ← 一覧
        </button>
      </header>

      <div className="settings-intro">
        <p className="brand">読書記録</p>
        <h1>データ管理</h1>
        <p className="settings-lead">
          バックアップの作成・復元、またはすべての記録の削除ができます。
        </p>
      </div>

      <div className="settings-sections">
        <section className="settings-block">
          <h2>エクスポート</h2>
          <p>すべての本と読了記録を JSON ファイルとして保存します。</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void handleExport()}
            disabled={busy || bookCount === 0}
          >
            データをエクスポート
          </button>
          {bookCount === 0 && (
            <p className="settings-hint">エクスポートするデータがありません</p>
          )}
        </section>

        <section className="settings-block">
          <h2>インポート</h2>
          <p>バックアップファイルからデータを復元します。現在のデータは置き換わります。</p>
          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            disabled={busy}
            onChange={(e) => void handleImportFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor={fileInputId} className={`btn btn-secondary${busy ? ' is-disabled' : ''}`}>
            ファイルを選んでインポート
          </label>
        </section>

        <section className="settings-block settings-block-danger">
          <h2>すべてのデータを削除</h2>
          <p>端末に保存されている読書記録をすべて削除します。この操作は取り消せません。</p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              clearFeedback()
              setConfirmDelete(true)
            }}
            disabled={busy || bookCount === 0}
          >
            すべて削除…
          </button>
          {bookCount === 0 && (
            <p className="settings-hint">削除するデータがありません</p>
          )}
        </section>
      </div>

      {(message || error) && (
        <p className={error ? 'form-error' : 'settings-message'} role="status">
          {error ?? message}
        </p>
      )}

      {confirmDelete && (
        <div className="dialog-backdrop" role="presentation">
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-all-title"
            aria-describedby="delete-all-desc"
          >
            <h2 id="delete-all-title">すべてのデータを削除しますか？</h2>
            <p id="delete-all-desc">
              {bookCount}冊の記録が削除されます。先にエクスポートしてバックアップを残すこともできます。
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void handleDeleteAll(true)}
              >
                エクスポートして削除
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={() => void handleDeleteAll(false)}
              >
                削除のみ
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
