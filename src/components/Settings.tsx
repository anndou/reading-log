import { useEffect, useId, useRef, useState } from 'react'
import type { Book } from '../types'
import * as db from '../db'
import {
  backupFilename,
  booksToExportPayload,
  downloadJson,
  exportPayloadToBooks,
  parseExportPayload,
} from '../backup'
import {
  getStoredTheme,
  setTheme,
  THEME_OPTIONS,
  type ThemeId,
} from '../theme'
import {
  FONT_OPTIONS,
  getStoredFont,
  getStoredTextSize,
  setFont,
  setTextSize,
  TEXT_SIZE_OPTIONS,
  type FontId,
  type TextSizeId,
} from '../typography'
import {
  applyAppUpdate,
  checkForAppUpdate,
  subscribeUpdateStatus,
  type UpdateStatus,
} from '../pwa'

type Props = {
  bookCount: number
  onBack: () => void
  onDataChanged: () => Promise<void>
}

const UPDATE_MESSAGES: Partial<Record<UpdateStatus, string>> = {
  checking: '更新を確認しています…',
  current: 'すでに最新版です',
  available: '新しいバージョンがあります。更新できます',
  updating: '更新して再読み込みしています…',
  unavailable: 'この環境ではアプリ更新を確認できません（開発時など）',
  error: '更新の確認に失敗しました',
}

export function Settings({ bookCount, onBack, onDataChanged }: Props) {
  const fileInputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [themeId, setThemeId] = useState<ThemeId>(() => getStoredTheme())
  const [fontId, setFontId] = useState<FontId>(() => getStoredFont())
  const [textSizeId, setTextSizeId] = useState<TextSizeId>(() => getStoredTextSize())
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')

  useEffect(() => subscribeUpdateStatus(setUpdateStatus), [])

  function clearFeedback() {
    setMessage(null)
    setError(null)
  }

  function handleThemeChange(id: ThemeId) {
    setTheme(id)
    setThemeId(id)
  }

  function handleFontChange(id: FontId) {
    setFont(id)
    setFontId(id)
  }

  function handleTextSizeChange(id: TextSizeId) {
    setTextSize(id)
    setTextSizeId(id)
  }

  async function handleCheckUpdate() {
    clearFeedback()
    const status = await checkForAppUpdate()
    const text = UPDATE_MESSAGES[status]
    if (status === 'error') setError(text ?? null)
    else if (text) setMessage(text)
  }

  async function handleApplyUpdate() {
    clearFeedback()
    setMessage(UPDATE_MESSAGES.updating ?? null)
    try {
      await applyAppUpdate()
    } catch {
      setError('更新の適用に失敗しました')
    }
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

  const updateBusy =
    updateStatus === 'checking' || updateStatus === 'updating'

  return (
    <section className="view settings-view">
      <header className="page-header">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={busy}>
          ← 一覧
        </button>
      </header>

      <div className="settings-intro">
        <p className="brand">読書記録</p>
        <h1>設定</h1>
        <p className="settings-lead">
          見た目の変更、アプリの更新、データのバックアップや削除ができます。
        </p>
      </div>

      <div className="settings-sections">
        <section className="settings-block">
          <h2>テーマカラー</h2>
          <p>アプリ全体の基調色を選びます。選択はすぐに反映され、端末に保存されます。</p>
          <ul className="theme-swatches" role="listbox" aria-label="テーマカラー">
            {THEME_OPTIONS.map((option) => {
              const active = option.id === themeId
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={`theme-swatch${active ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={active}
                    onClick={() => handleThemeChange(option.id)}
                  >
                    <span
                      className="theme-swatch-dot"
                      style={{ background: option.swatch }}
                      aria-hidden
                    />
                    {option.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="settings-block">
          <h2>フォント</h2>
          <p>見出しと本文に使う書体を選びます。</p>
          <ul className="theme-swatches" role="listbox" aria-label="フォント">
            {FONT_OPTIONS.map((option) => {
              const active = option.id === fontId
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={`theme-swatch font-swatch${active ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={active}
                    data-font-preview={option.id}
                    onClick={() => handleFontChange(option.id)}
                  >
                    <span className="font-swatch-sample" aria-hidden>
                      {option.sample}
                    </span>
                    {option.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="settings-block">
          <h2>文字サイズ</h2>
          <p>アプリ全体の文字の大きさを選びます。</p>
          <ul className="theme-swatches text-size-swatches" role="listbox" aria-label="文字サイズ">
            {TEXT_SIZE_OPTIONS.map((option) => {
              const active = option.id === textSizeId
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={`theme-swatch text-size-swatch${active ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={active}
                    data-size-preview={option.id}
                    onClick={() => handleTextSizeChange(option.id)}
                  >
                    <span className="text-size-swatch-label" aria-hidden>
                      {option.label}
                    </span>
                    {option.description}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="settings-block">
          <h2>アプリの更新</h2>
          <p>
            公開済みの最新版があるか確認し、任意のタイミングで取り込みます。更新後はページが再読み込みされます。
          </p>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void handleCheckUpdate()}
              disabled={busy || updateBusy}
            >
              最新版を確認
            </button>
            {updateStatus === 'available' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleApplyUpdate()}
                disabled={busy || updateBusy}
              >
                更新して再読み込み
              </button>
            )}
          </div>
        </section>

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
