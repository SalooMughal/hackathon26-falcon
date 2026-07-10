import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createKnowledgeDoc,
  deleteKnowledgeDoc,
  getAllKnowledgeDocs,
  getOneKnowledgeDoc,
  reindexKnowledgeDocs,
  updateKnowledgeDoc,
} from '../../api/knowledgeBase'
import type { KnowledgeDocument } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import '../../styles/dashboard.css'

type ModalMode = 'create' | 'edit' | 'view' | null

const emptyForm = {
  title: '',
  filename: '',
  content: '',
}

export default function KnowledgeBasePage() {
  const { can } = usePermissions()
  const canCreate = can('knowledge-base', 'create')
  const canUpdate = can('knowledge-base', 'update')
  const canDelete = can('knowledge-base', 'delete')

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAllKnowledgeDocs(page, limit, search || undefined)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setDocuments(result.data.documents)
    setTotal(result.data.pagination.total)
  }, [page, limit, search])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModal('create')
    setError('')
  }

  async function openEdit(doc: KnowledgeDocument) {
    setError('')
    setInfo('')
    const result = await getOneKnowledgeDoc(doc.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    const full = result.data.document
    setEditing(full)
    setForm({
      title: full.title,
      filename: full.filename,
      content: full.content ?? '',
    })
    setModal('edit')
  }

  async function openView(doc: KnowledgeDocument) {
    setError('')
    const result = await getOneKnowledgeDoc(doc.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    const full = result.data.document
    setEditing(full)
    setForm({
      title: full.title,
      filename: full.filename,
      content: full.content ?? '',
    })
    setModal('view')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (modal === 'view') return

    setSaving(true)
    setError('')
    setInfo('')

    const result =
      modal === 'create'
        ? await createKnowledgeDoc({
            title: form.title.trim(),
            content: form.content,
            ...(form.filename.trim() ? { filename: form.filename.trim() } : {}),
          })
        : editing
          ? await updateKnowledgeDoc({
              documentId: editing.id,
              title: form.title.trim(),
              content: form.content,
              filename: form.filename.trim() || undefined,
            })
          : null

    setSaving(false)

    if (!result || !result.ok) {
      setError(result?.error.message ?? 'Unable to save document.')
      await load()
      return
    }

    setModal(null)
    setInfo(
      modal === 'create'
        ? 'Document created and indexed.'
        : 'Document updated and re-indexed.',
    )
    await load()
  }

  async function handleDelete(doc: KnowledgeDocument) {
    if (!window.confirm(`Delete “${doc.title}”? This removes it from the vector index too.`)) {
      return
    }
    setError('')
    setInfo('')
    const result = await deleteKnowledgeDoc(doc.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo('Document deleted.')
    await load()
  }

  async function handleReindexOne(doc: KnowledgeDocument) {
    setReindexing(true)
    setError('')
    setInfo('')
    const result = await reindexKnowledgeDocs(doc.id)
    setReindexing(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo(
      result.data.failed > 0
        ? `Reindex finished with ${result.data.failed} failure(s).`
        : `Reindexed “${doc.title}”.`,
    )
    await load()
  }

  async function handleReindexAll() {
    if (!window.confirm('Reindex all pending/failed documents?')) return
    setReindexing(true)
    setError('')
    setInfo('')
    const result = await reindexKnowledgeDocs()
    setReindexing(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo(
      `Reindex complete: ${result.data.reindexed} succeeded, ${result.data.failed} failed.`,
    )
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
          <h1>Knowledge base</h1>
          <p>Markdown docs that power FalconAI’s grounded answers. Index status shows what’s searchable.</p>
        </div>
        <div className="dash-actions">
          {canUpdate ? (
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void handleReindexAll()}
              disabled={reindexing}
            >
              {reindexing ? 'Reindexing…' : 'Reindex failed'}
            </button>
          ) : null}
          {canCreate ? (
            <button type="button" className="dash-btn" onClick={openCreate}>
              Add document
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

      <form className="dash-toolbar" onSubmit={applySearch}>
        <label className="dash-field dash-field--inline">
          <span className="sr-only">Search</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title or filename…"
          />
        </label>
        <button type="submit" className="dash-btn dash-btn--ghost dash-btn--sm">
          Search
        </button>
      </form>

      <div className="dash-panel">
        {loading ? (
          <p className="dash-muted">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="dash-muted">No documents yet. Add a markdown doc to seed the RAG index.</p>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Filename</th>
                    <th>Status</th>
                    <th>Chunks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <strong>{doc.title}</strong>
                        {doc.errorMessage ? (
                          <p className="dash-cell-hint dash-cell-hint--error">{doc.errorMessage}</p>
                        ) : null}
                      </td>
                      <td>
                        <code>{doc.filename}</code>
                      </td>
                      <td>
                        <span
                          className={`dash-badge ${
                            doc.status === 'indexed'
                              ? 'dash-badge--on'
                              : doc.status === 'failed'
                                ? 'dash-badge--off'
                                : ''
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td>{doc.chunkCount}</td>
                      <td>
                        <div className="dash-actions">
                          <button
                            type="button"
                            className="dash-btn dash-btn--ghost dash-btn--sm"
                            onClick={() => void openView(doc)}
                          >
                            View
                          </button>
                          {canUpdate ? (
                            <>
                              <button
                                type="button"
                                className="dash-btn dash-btn--ghost dash-btn--sm"
                                onClick={() => void openEdit(doc)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="dash-btn dash-btn--ghost dash-btn--sm"
                                onClick={() => void handleReindexOne(doc)}
                                disabled={reindexing}
                              >
                                Reindex
                              </button>
                            </>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--danger dash-btn--sm"
                              onClick={() => void handleDelete(doc)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

      {modal ? (
        <div className="dash-modal-backdrop" role="presentation" onClick={() => setModal(null)}>
          <div
            className="dash-modal dash-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kb-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="kb-modal-title">
              {modal === 'create'
                ? 'Add document'
                : modal === 'edit'
                  ? 'Edit document'
                  : 'View document'}
            </h2>
            <form className="dash-form" onSubmit={handleSubmit}>
              <label className="dash-field">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={255}
                  readOnly={modal === 'view'}
                />
              </label>
              <label className="dash-field">
                <span>Filename {modal === 'create' ? '(optional, must end with .md)' : ''}</span>
                <input
                  value={form.filename}
                  onChange={(e) => setForm((f) => ({ ...f, filename: e.target.value }))}
                  placeholder="onboarding-guide.md"
                  maxLength={255}
                  readOnly={modal === 'view'}
                />
              </label>
              <label className="dash-field">
                <span>Markdown content</span>
                <textarea
                  className="dash-textarea--code"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  required={modal !== 'view'}
                  readOnly={modal === 'view'}
                  rows={16}
                />
              </label>
              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={() => setModal(null)}
                >
                  {modal === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modal !== 'view' ? (
                  <button type="submit" className="dash-btn" disabled={saving}>
                    {saving ? 'Saving…' : 'Save & index'}
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
