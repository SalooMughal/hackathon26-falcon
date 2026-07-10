import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createRole, deleteRole, getAllRoles } from '../../api/roles'
import type { Role } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import '../../styles/dashboard.css'

export default function RolesPage() {
  const { can } = usePermissions()
  const canCreate = can('roles', 'create')
  const canUpdate = can('roles', 'update')
  const canDelete = can('roles', 'delete')

  const [roles, setRoles] = useState<Role[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAllRoles(page, limit)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setRoles(result.data.roles)
    setTotal(result.data.pagination.total)
  }, [page, limit])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setInfo('')

    const result = await createRole(name.trim(), description.trim())
    setSaving(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setShowCreate(false)
    setName('')
    setDescription('')
    setInfo('Role created.')
    await load()
  }

  async function handleDelete(role: Role) {
    if (!window.confirm(`Delete role “${role.name}”?`)) return
    setError('')
    setInfo('')
    const result = await deleteRole(role.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo('Role deleted.')
    await load()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Roles</h1>
          <p>Create roles and manage which features and permissions they receive.</p>
        </div>
        {canCreate ? (
          <div className="dash-actions">
            <button type="button" className="dash-btn" onClick={() => setShowCreate(true)}>
              Create role
            </button>
          </div>
        ) : null}
      </header>

      {error ? <p className="dash-alert dash-alert--error" role="alert">{error}</p> : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      <div className="dash-panel">
        {loading ? (
          <p className="dash-muted">Loading roles…</p>
        ) : roles.length === 0 ? (
          <p className="dash-muted">No roles yet.</p>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Features</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <strong>{role.name}</strong>
                      </td>
                      <td>{role.description}</td>
                      <td>{role.roleFeatures?.length ?? 0}</td>
                      <td>
                        <div className="dash-actions">
                          {canUpdate ? (
                            <Link
                              to={`/roles/${role.id}`}
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              style={{ textDecoration: 'none' }}
                            >
                              Manage
                            </Link>
                          ) : can('roles', 'read') ? (
                            <Link
                              to={`/roles/${role.id}`}
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              style={{ textDecoration: 'none' }}
                            >
                              View
                            </Link>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--danger dash-btn--sm"
                              onClick={() => void handleDelete(role)}
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

      {showCreate ? (
        <div
          className="dash-modal-backdrop"
          role="presentation"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="dash-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="role-modal-title">Create role</h2>
            <form className="dash-form" onSubmit={handleCreate}>
              <label className="dash-field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. loan-officer"
                  required
                  maxLength={255}
                />
              </label>
              <label className="dash-field">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Who this role is for"
                  required
                  maxLength={500}
                />
              </label>
              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dash-btn" disabled={saving}>
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
