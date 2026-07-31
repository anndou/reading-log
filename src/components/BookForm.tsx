import { useEffect, useId, useState, type FormEvent } from 'react'
import type { Book, BookInput, Rating, Reading } from '../types'
import { RATING_OPTIONS } from '../ratings'
import { compressImage } from '../db'
import { CoverImage } from './Shared'

type DraftReading = {
  key: string
  id?: string
  date: string
  rating: Rating
  impressions: string
}

type Props = {
  book?: Book
  onCancel: () => void
  onSave: (input: BookInput) => Promise<void>
}

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toDraft(readings: Reading[]): DraftReading[] {
  if (readings.length === 0) {
    return [
      { key: crypto.randomUUID(), date: today(), rating: 'ok', impressions: '' },
    ]
  }
  return readings.map((r) => ({
    key: r.id,
    id: r.id,
    date: r.date,
    rating: r.rating,
    impressions: r.impressions ?? '',
  }))
}

export function BookForm({ book, onCancel, onSave }: Props) {
  const titleId = useId()
  const authorId = useId()
  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [cover, setCover] = useState<Blob | undefined>(book?.cover)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [coverChanged, setCoverChanged] = useState(false)
  const [readings, setReadings] = useState<DraftReading[]>(() =>
    toDraft(book?.readings ?? []),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(book?.title ?? '')
    setAuthor(book?.author ?? '')
    setCover(book?.cover)
    setCoverRemoved(false)
    setCoverChanged(false)
    setReadings(toDraft(book?.readings ?? []))
  }, [book])

  async function onCoverPick(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選んでください')
      return
    }
    try {
      const compressed = await compressImage(file)
      setCover(compressed)
      setCoverRemoved(false)
      setCoverChanged(true)
      setError(null)
    } catch {
      setError('画像の読み込みに失敗しました')
    }
  }

  function updateReading(key: string, patch: Partial<DraftReading>) {
    setReadings((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    )
  }

  function addReading() {
    setReadings((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        date: today(),
        rating: 'ok',
        impressions: '',
      },
    ])
  }

  function removeReading(key: string) {
    setReadings((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('タイトルは必須です')
      return
    }
    if (readings.some((r) => !r.date)) {
      setError('読んだ日をすべて入力してください')
      return
    }

    let coverValue: Blob | null | undefined
    if (coverRemoved) coverValue = null
    else if (coverChanged && cover) coverValue = cover
    else coverValue = undefined

    const input: BookInput = {
      title: trimmed,
      author: author.trim(),
      cover: coverValue,
      readings: readings.map((r) => ({
        id: r.id,
        date: r.date,
        rating: r.rating,
        impressions: r.impressions,
      })),
    }

    setSaving(true)
    setError(null)
    try {
      await onSave(input)
    } catch {
      setError('保存に失敗しました')
      setSaving(false)
    }
  }

  return (
    <section className="view form-view">
      <header className="page-header">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          ← 戻る
        </button>
        <p className="brand">{book ? '編集' : '新規登録'}</p>
      </header>

      <form className="book-form" onSubmit={handleSubmit}>
        <div className="cover-field">
          <CoverImage
            cover={coverRemoved ? undefined : cover}
            title={title || '書影'}
            size="form"
          />
          <div className="cover-actions">
            <label className="btn btn-secondary file-btn">
              書影を選ぶ
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void onCoverPick(e.target.files?.[0] ?? null)}
              />
            </label>
            {(cover || book?.cover) && !coverRemoved && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setCover(undefined)
                  setCoverRemoved(true)
                  setCoverChanged(true)
                }}
              >
                書影を削除
              </button>
            )}
          </div>
        </div>

        <label className="field" htmlFor={titleId}>
          <span>
            タイトル <em>*</em>
          </span>
          <input
            id={titleId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="例）吾輩は猫である"
            autoFocus
          />
        </label>

        <label className="field" htmlFor={authorId}>
          <span>著者</span>
          <input
            id={authorId}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="例）夏目漱石"
          />
        </label>

        <fieldset className="readings-fieldset">
          <legend>読んだ日・評価</legend>
          <p className="hint">
            複数回読んだ場合は、回ごとに日付・評価・感想を追加できます
          </p>
          <ul className="reading-editor">
            {readings.map((reading, index) => (
              <li key={reading.key}>
                <div className="reading-editor-row">
                  <span className="reading-n">{index + 1}回目</span>
                  <input
                    type="date"
                    value={reading.date}
                    onChange={(e) =>
                      updateReading(reading.key, { date: e.target.value })
                    }
                    required
                    aria-label={`${index + 1}回目の読了日`}
                  />
                  <select
                    value={reading.rating}
                    onChange={(e) =>
                      updateReading(reading.key, {
                        rating: e.target.value as Rating,
                      })
                    }
                    aria-label={`${index + 1}回目の評価`}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeReading(reading.key)}
                    disabled={readings.length <= 1}
                    aria-label={`${index + 1}回目を削除`}
                  >
                    ×
                  </button>
                </div>
                <label className="field reading-impressions-field">
                  <span>感想（任意）</span>
                  <textarea
                    value={reading.impressions}
                    onChange={(e) =>
                      updateReading(reading.key, {
                        impressions: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="印象に残ったことなど"
                    aria-label={`${index + 1}回目の感想`}
                  />
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary" onClick={addReading}>
            読了を追加
          </button>
        </fieldset>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </section>
  )
}
