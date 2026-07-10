import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createNotice,
  deleteNotification,
  getAllNotifications,
  getNotificationCounts,
  markNotificationRead,
  updateNotice,
  updateNotificationStatus,
} from '../../api/notifications'
import type { AppNotification, NotificationStatus, NotificationType } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import '../../styles/dashboard.css'

type ModalMode = 'create' | 'edit' | null

const emptyForm = {
  title: '',
  message: '',
  type: 'info' as NotificationType,
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function NotificationsPage() {
  const { can } = usePermissions()
  const canCreate = can('notifications', 'create')
  const canUpdate = can('notifications', 'update')
  const canDelete = can('notifications', 'delete')

  const [items, setItems] = useState<AppNotification[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [unread, setUnread] = useState(0)
  const [limit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<AppNotification | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadCounts = useCallback(async () => {
    const result = await getNotificationCounts()
    if (result.ok) {
      setUnread(result.data.byStatus?.['un-read'] || 0)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAllNotifications(page, limit, {
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    })
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setItems(result.data.notifications)
    setTotal(result.data.pagination.total)
  }, [page, limit, search, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadCounts()
  }, [loadCounts, items])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModal('create')
    setError('')
  }

  function openEdit(item: AppNotification) {
    const broadcastId = item.data?.broadcastId
    if (!broadcastId) {
      setError('This notice cannot be edited.')
      return
    }
    setEditing(item)
    setForm({
      title: item.title,
      message: item.message,
      type: item.type,
    })
    setModal('edit')
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setInfo('')

    if (modal === 'create') {
      const result = await createNotice({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
      })
      setSaving(false)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setModal(null)
      setInfo(
        result.data.recipients
          ? `Notice posted to ${result.data.recipients} employee(s).`
          : 'Notice posted.',
      )
      await load()
      return
    }

    const broadcastId = editing?.data?.broadcastId
    if (!broadcastId) {
      setSaving(false)
      setError('Missing broadcast id.')
      return
    }

    const result = await updateNotice({
      broadcastId,
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setModal(null)
    setInfo('Notice updated for everyone.')
    await load()
  }

  async function handleMarkRead(item: AppNotification) {
    if (item.status === 'read') return
    const result = await markNotificationRead(item.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    await load()
  }

  async function handleMarkAllRead() {
    setError('')
    setInfo('')
    const result = await markNotificationRead()
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo('All notices marked as read.')
    await load()
  }

  async function handleToggleArchive(item: AppNotification) {
    const next: NotificationStatus = item.status === 'archived' ? 'un-read' : 'archived'
    const result = await updateNotificationStatus(item.id, next)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    await load()
  }

  async function handleDelete(item: AppNotification) {
    const broadcastId = item.data?.broadcastId
    const boardWide = Boolean(broadcastId) && canDelete
    const label = boardWide
      ? 'Remove this notice from everyone’s board?'
      : 'Dismiss this notice from your board?'
    if (!window.confirm(label)) return

    setError('')
    setInfo('')
    const result = await deleteNotification(
      boardWide ? { broadcastId: broadcastId! } : { id: item.id },
    )
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo(boardWide ? 'Notice removed from the board.' : 'Notice dismissed.')
    await load()
  }

  function applySearch(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Noticeboard</h1>
          <p>
            Company notices for the team.
            {unread > 0 ? ` ${unread} unread.` : ''}
          </p>
        </div>
        <div className="dash-actions">
          {canUpdate && unread > 0 ? (
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void handleMarkAllRead()}
            >
              Mark all read
            </button>
          ) : null}
          {canCreate ? (
            <button type="button" className="dash-btn" onClick={openCreate}>
              Post notice
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="dash-alert dash-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      <div className="dash-toolbar" style={{ flexWrap: 'wrap' }}>
        <form className="dash-toolbar" onSubmit={applySearch} style={{ flex: 1 }}>
          <label className="dash-field dash-field--inline">
            <span className="sr-only">Search notices</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search notices…"
            />
          </label>
          <button type="submit" className="dash-btn dash-btn--ghost dash-btn--sm">
            Search
          </button>
        </form>
        <label className="dash-field" style={{ minWidth: '140px' }}>
          <span className="sr-only">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter(e.target.value as NotificationStatus | '')
            }}
          >
            <option value="">All statuses</option>
            <option value="un-read">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="dash-panel notice-board">
        {loading ? (
          <p className="dash-muted">Loading notices…</p>
        ) : items.length === 0 ? (
          <p className="dash-muted">No notices yet. Post one to reach the whole team.</p>
        ) : (
          <div className="notice-list">
            {items.map((item) => {
              const author = item.data?.authorName
              const unreadItem = item.status === 'un-read'
              return (
                <article
                  key={item.id}
                  className={`notice-item notice-item--${item.type}${unreadItem ? ' notice-item--unread' : ''}`}
                >
                  <div className="notice-item-top">
                    <div>
                      <div className="notice-badges">
                        <span className={`dash-badge notice-type notice-type--${item.type}`}>
                          {item.type}
                        </span>
                        {unreadItem ? (
                          <span className="dash-badge dash-badge--on">Unread</span>
                        ) : null}
                        {item.status === 'archived' ? (
                          <span className="dash-badge">Archived</span>
                        ) : null}
                      </div>
                      <h2 className="notice-title">{item.title}</h2>
                      <p className="notice-meta">
                        {author ? <span>Posted by {author}</span> : null}
                        <span>{formatWhen(item.createdAt)}</span>
                      </p>
                    </div>
                    <div className="dash-actions">
                      {canUpdate && unreadItem ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost dash-btn--sm"
                          onClick={() => void handleMarkRead(item)}
                        >
                          Mark read
                        </button>
                      ) : null}
                      {canUpdate && item.data?.broadcastId ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost dash-btn--sm"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                      ) : null}
                      {canUpdate ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost dash-btn--sm"
                          onClick={() => void handleToggleArchive(item)}
                        >
                          {item.status === 'archived' ? 'Unarchive' : 'Archive'}
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn--danger dash-btn--sm"
                          onClick={() => void handleDelete(item)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="notice-body">{item.message}</p>
                </article>
              )
            })}
          </div>
        )}

        {items.length > 0 ? (
          <div className="dash-pagination">
            <p className="dash-muted">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="dash-actions">
              <button
                type="button"
                className="dash-btn dash-btn--ghost dash-btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="dash-btn dash-btn--ghost dash-btn--sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {modal ? (
        <div className="dash-modal-backdrop" role="presentation" onClick={() => setModal(null)}>
          <div
            className="dash-modal dash-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="notice-modal-title">
              {modal === 'create' ? 'Post notice' : 'Edit notice'}
            </h2>
            <form className="dash-form" onSubmit={handleSubmit}>
              <label className="dash-field">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={255}
                  placeholder="e.g. Office closed Friday"
                />
              </label>
              <label className="dash-field">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as NotificationType }))
                  }
                >
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Urgent</option>
                </select>
              </label>
              <label className="dash-field">
                <span>Message</span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                  rows={6}
                  maxLength={5000}
                  placeholder="Write the notice for the team…"
                />
              </label>
              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="dash-btn" disabled={saving}>
                  {saving ? 'Saving…' : modal === 'create' ? 'Post to board' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
