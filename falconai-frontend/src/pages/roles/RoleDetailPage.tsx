import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAllFeatures } from '../../api/features'
import {
  addFeaturesToRole,
  addPermissionsToFeatureRole,
  getAllPermissions,
  getOneRole,
  removeFeaturesFromRole,
  removePermissionsFromFeatureRole,
} from '../../api/roles'
import type { Feature, Permission, Role, RoleFeature } from '../../api/types'
import { usePermissions } from '../../lib/permissions'
import '../../styles/dashboard.css'

export default function RoleDetailPage() {
  const { roleId = '' } = useParams()
  const { can } = usePermissions()
  const canUpdate = can('roles', 'update')

  const [role, setRole] = useState<Role | null>(null)
  const [catalogFeatures, setCatalogFeatures] = useState<Feature[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showAddFeatures, setShowAddFeatures] = useState(false)
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!roleId) return
    setLoading(true)
    setError('')

    const [roleResult, featuresResult, permissionsResult] = await Promise.all([
      getOneRole(roleId),
      getAllFeatures(1, 100),
      getAllPermissions(1, 50),
    ])

    setLoading(false)

    if (!roleResult.ok) {
      setError(roleResult.error.message)
      return
    }

    setRole(roleResult.data.role)

    if (featuresResult.ok) {
      setCatalogFeatures(featuresResult.data.features)
    }

    if (permissionsResult.ok) {
      setPermissions(permissionsResult.data.permissions)
    }
  }, [roleId])

  useEffect(() => {
    void load()
  }, [load])

  const assignedFeatureIds = useMemo(
    () => new Set(role?.roleFeatures?.map((rf) => rf.featureId) ?? []),
    [role],
  )

  const availableFeatures = catalogFeatures.filter((f) => !assignedFeatureIds.has(f.id))

  const permissionCatalog = useMemo(() => {
    const map = new Map<string, Permission>()
    for (const p of permissions) map.set(p.name, p)
    if (role?.roleFeatures) {
      for (const rf of role.roleFeatures) {
        for (const rfp of rf.roleFeaturePermissions ?? []) {
          if (rfp.permission) map.set(rfp.permission.name, rfp.permission)
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [permissions, role])

  async function handleAddFeatures() {
    if (!roleId || selectedFeatureIds.length === 0) return
    setBusy(true)
    setError('')
    setInfo('')
    const result = await addFeaturesToRole(roleId, selectedFeatureIds)
    setBusy(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setShowAddFeatures(false)
    setSelectedFeatureIds([])
    setInfo('Features added to role.')
    await load()
  }

  async function handleRemoveFeature(featureId: string, featureName: string) {
    if (!roleId) return
    if (!window.confirm(`Remove feature “${featureName}” from this role?`)) return
    setBusy(true)
    setError('')
    setInfo('')
    const result = await removeFeaturesFromRole(roleId, [featureId])
    setBusy(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setInfo('Feature removed.')
    await load()
  }

  function hasPermissionOnFeature(rf: RoleFeature, permissionName: string) {
    return Boolean(
      rf.roleFeaturePermissions?.some((rfp) => rfp.permission?.name === permissionName),
    )
  }

  function getAssignedPermissionId(rf: RoleFeature, permissionName: string) {
    return rf.roleFeaturePermissions?.find((rfp) => rfp.permission?.name === permissionName)
      ?.permissionId
  }

  async function togglePermission(rf: RoleFeature, permission: Permission) {
    if (!roleId || !canUpdate || busy) return

    const assigned = hasPermissionOnFeature(rf, permission.name)
    setBusy(true)
    setError('')
    setInfo('')

    const result = assigned
      ? await removePermissionsFromFeatureRole(roleId, rf.featureId, [
          getAssignedPermissionId(rf, permission.name) ?? permission.id,
        ])
      : await addPermissionsToFeatureRole(roleId, rf.featureId, [permission.id])

    setBusy(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    await load()
  }

  if (loading) {
    return (
      <section className="dash-page">
        <p className="dash-muted">Loading role…</p>
      </section>
    )
  }

  if (!role) {
    return (
      <section className="dash-page">
        <Link to="/roles" className="back-link">
          ← Back to roles
        </Link>
        <p className="dash-alert dash-alert--error">{error || 'Role not found.'}</p>
      </section>
    )
  }

  return (
    <section className="dash-page">
      <div>
        <Link to="/roles" className="back-link">
          ← Back to roles
        </Link>
        <header className="dash-header">
          <div>
            <h1>{role.name}</h1>
            <p>{role.description}</p>
          </div>
          {canUpdate ? (
            <div className="dash-actions">
              <button
                type="button"
                className="dash-btn"
                onClick={() => {
                  setSelectedFeatureIds([])
                  setShowAddFeatures(true)
                }}
                disabled={availableFeatures.length === 0}
              >
                Add features
              </button>
            </div>
          ) : null}
        </header>
      </div>

      {error ? <p className="dash-alert dash-alert--error" role="alert">{error}</p> : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      <div className="dash-panel">
        {!role.roleFeatures?.length ? (
          <p className="dash-muted">No features assigned to this role yet.</p>
        ) : (
          role.roleFeatures.map((rf) => (
            <article key={rf.id} className="role-feature-card">
              <div className="role-feature-head">
                <div>
                  <h3>{rf.feature?.name}</h3>
                  <p>{rf.feature?.description}</p>
                </div>
                {canUpdate ? (
                  <button
                    type="button"
                    className="dash-btn dash-btn--danger dash-btn--sm"
                    disabled={busy}
                    onClick={() => void handleRemoveFeature(rf.featureId, rf.feature?.name ?? 'feature')}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="perm-grid">
                {permissionCatalog.map((permission) => {
                  const on = hasPermissionOnFeature(rf, permission.name)
                  return (
                    <button
                      key={permission.id}
                      type="button"
                      className={`perm-chip${on ? ' perm-chip--on' : ''}`}
                      disabled={!canUpdate || busy}
                      onClick={() => void togglePermission(rf, permission)}
                      title={permission.description}
                    >
                      {permission.name}
                    </button>
                  )
                })}
              </div>
            </article>
          ))
        )}
      </div>

      {showAddFeatures ? (
        <div
          className="dash-modal-backdrop"
          role="presentation"
          onClick={() => setShowAddFeatures(false)}
        >
          <div
            className="dash-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-features-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="add-features-title">Add features</h2>
            {availableFeatures.length === 0 ? (
              <p className="dash-muted">All features are already assigned.</p>
            ) : (
              <div className="feature-picker">
                {availableFeatures.map((feature) => (
                  <label key={feature.id}>
                    <input
                      type="checkbox"
                      checked={selectedFeatureIds.includes(feature.id)}
                      onChange={(e) => {
                        setSelectedFeatureIds((ids) =>
                          e.target.checked
                            ? [...ids, feature.id]
                            : ids.filter((id) => id !== feature.id),
                        )
                      }}
                    />
                    <span>
                      <strong>{feature.name}</strong>
                      <br />
                      <span className="dash-muted">{feature.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="dash-modal-actions">
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                onClick={() => setShowAddFeatures(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dash-btn"
                disabled={busy || selectedFeatureIds.length === 0}
                onClick={() => void handleAddFeatures()}
              >
                {busy ? 'Adding…' : 'Add selected'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
