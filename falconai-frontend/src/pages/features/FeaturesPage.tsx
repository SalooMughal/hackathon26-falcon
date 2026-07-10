import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createFeature,
  deleteFeature,
  getAllFeatures,
  updateFeature,
} from '../../api/features'
import type { Feature } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import '../../styles/dashboard.css'

type ModalMode = 'create' | 'edit' | null

const emptyForm = {
  name: '',
  description: '',
  isActive: true,
}

export default function FeaturesPage() {
  const { can } = usePermissions()
  const canCreate = can('features', 'create')
  const canUpdate = can('features', 'update')
  const canDelete = can('features', 'delete')

  const [features, setFeatures] = useState<Feature[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<Feature | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAllFeatures(page, limit)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setFeatures(result.data.features)
    setTotal(result.data.pagination.total)
  }, [page, limit])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModal('create')
    setError('')
  }

  function openEdit(feature: Feature) {
    setEditing(feature)
    setForm({
      name: feature.name,
      description: feature.description,
      isActive: feature.isActive,
    })
    setModal('edit')
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setInfo('')

    const result =
      modal === 'create'
        ? await createFeature(form)
        : editing
          ? await updateFeature({
              featureId: editing.id,
              name: form.name,
              description: form.description,
              isActive: form.isActive,
            })
          : null

    setSaving(false)

    if (!result || !result.ok) {
      setError(result?.error.message ?? 'Unable to save feature.')
      return
    }

    setModal(null)
    setInfo(modal === 'create' ? 'Feature created.' : 'Feature updated.')
    await load()
  }

  async function handleDelete(feature: Feature) {
    if (!window.confirm(`Delete feature “${feature.name}”?`)) return
    setError('')
    setInfo('')
    const result = await deleteFeature(feature.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo('Feature deleted.')
    await load()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Features</h1>
          <p>Define product modules that roles can be granted access to.</p>
        </div>
        {canCreate ? (
          <div className="dash-actions">
            <button type="button" className="dash-btn" onClick={openCreate}>
              Create feature
            </button>
          </div>
        ) : null}
      </header>

      {error ? <p className="dash-alert dash-alert--error" role="alert">{error}</p> : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      <div className="dash-panel">
        {loading ? (
          <p className="dash-muted">Loading features…</p>
        ) : features.length === 0 ? (
          <p className="dash-muted">No features yet.</p>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.id}>
                      <td>
                        <strong>{feature.name}</strong>
                      </td>
                      <td>{feature.description}</td>
                      <td>
                        <span
                          className={`dash-badge ${feature.isActive ? 'dash-badge--on' : 'dash-badge--off'}`}
                        >
                          {feature.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="dash-actions">
                          {canUpdate ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              onClick={() => openEdit(feature)}
                            >
                              Edit
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--danger dash-btn--sm"
                              onClick={() => void handleDelete(feature)}
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
            className="dash-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="feature-modal-title">
              {modal === 'create' ? 'Create feature' : 'Edit feature'}
            </h2>
            <form className="dash-form" onSubmit={handleSubmit}>
              <label className="dash-field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. documents"
                  required
                  maxLength={255}
                />
              </label>
              <label className="dash-field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What this feature controls"
                  required
                  maxLength={500}
                />
              </label>
              <label className="dash-check">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
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
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
