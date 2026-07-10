import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { getAllRoles } from '../../api/roles'
import { createUser, deleteUser, getAllUsers, updateUser } from '../../api/users'
import type { ManagedUser, Role } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard.css'

type ModalMode = 'create' | 'edit' | null

const emptyForm = {
  email: '',
  fullName: '',
  password: '',
  roleId: '',
}

export default function UsersPage() {
  const { can } = usePermissions()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const canCreate = can('users', 'create')
  const canUpdate = can('users', 'update')
  const canDelete = can('users', 'delete')

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [form, setForm] = useState(emptyForm)

  const assignableRoles = useMemo(
    () => roles.filter((r) => r.name !== 'super-admin'),
    [roles],
  )

  const loadRoles = useCallback(async () => {
    const result = await getAllRoles(1, 100)
    if (result.ok) setRoles(result.data.roles)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAllUsers(page, limit, search || undefined)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setUsers(result.data.users)
    setTotal(result.data.pagination.total)
  }, [page, limit, search])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      roleId: assignableRoles.find((r) => r.name === 'user')?.id || assignableRoles[0]?.id || '',
    })
    setModal('create')
    setError('')
  }

  function openEdit(user: ManagedUser) {
    setEditing(user)
    setForm({
      email: user.email,
      fullName: user.fullName,
      password: '',
      roleId: user.role?.id || user.roleId || '',
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
      const result = await createUser({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
        roleId: form.roleId,
      })
      setSaving(false)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setModal(null)
      setInfo('User created.')
      await load()
      return
    }

    if (!editing) {
      setSaving(false)
      return
    }

    const payload: {
      userId: string
      fullName?: string
      password?: string
      roleId?: string
    } = {
      userId: editing.id,
      fullName: form.fullName.trim(),
    }

    if (form.password.trim()) payload.password = form.password
    if (form.roleId && form.roleId !== (editing.role?.id || editing.roleId)) {
      payload.roleId = form.roleId
    }

    const result = await updateUser(payload)
    setSaving(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setModal(null)
    setInfo('User updated.')
    await load()
  }

  async function handleDelete(user: ManagedUser) {
    if (user.id === currentUserId) {
      setError('You cannot delete your own account.')
      return
    }
    if (!window.confirm(`Delete user “${user.fullName}”?`)) return
    setError('')
    setInfo('')
    const result = await deleteUser(user.id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setInfo('User deleted.')
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
          <h1>Users</h1>
          <p>Create accounts, assign roles, and remove users from the workspace.</p>
        </div>
        {canCreate ? (
          <div className="dash-actions">
            <button type="button" className="dash-btn" onClick={openCreate}>
              Create user
            </button>
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="dash-alert dash-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      <form className="dash-toolbar" onSubmit={applySearch}>
        <label className="dash-field dash-field--inline">
          <span className="sr-only">Search users</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
          />
        </label>
        <button type="submit" className="dash-btn dash-btn--ghost dash-btn--sm">
          Search
        </button>
      </form>

      <div className="dash-panel">
        {loading ? (
          <p className="dash-muted">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="dash-muted">No users found.</p>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.fullName}</strong>
                        {user.id === currentUserId ? (
                          <span className="dash-badge" style={{ marginLeft: '0.5rem' }}>
                            You
                          </span>
                        ) : null}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="dash-badge dash-badge--on">
                          {user.role?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="dash-actions">
                          {canUpdate ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              onClick={() => openEdit(user)}
                            >
                              Edit
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--danger dash-btn--sm"
                              onClick={() => void handleDelete(user)}
                              disabled={user.id === currentUserId}
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
            aria-labelledby="user-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="user-modal-title">{modal === 'create' ? 'Create user' : 'Edit user'}</h2>
            <form className="dash-form" onSubmit={handleSubmit}>
              <label className="dash-field">
                <span>Full name</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                  maxLength={255}
                />
              </label>
              <label className="dash-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required={modal === 'create'}
                  readOnly={modal === 'edit'}
                  maxLength={255}
                />
              </label>
              <label className="dash-field">
                <span>
                  Password
                  {modal === 'edit' ? ' (leave blank to keep current)' : ''}
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={modal === 'create'}
                  minLength={modal === 'create' || form.password ? 8 : undefined}
                  autoComplete="new-password"
                />
              </label>
              <label className="dash-field">
                <span>Role</span>
                <select
                  value={form.roleId}
                  onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                  required
                  disabled={editing?.id === currentUserId}
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {assignableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              {editing?.id === currentUserId ? (
                <p className="dash-muted">You cannot change your own role here.</p>
              ) : null}
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
