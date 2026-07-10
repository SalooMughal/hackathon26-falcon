import { useEffect, useState, type FormEvent } from 'react'
import { getMyProfile, updateMyPassword, updateMyProfile } from '../../api/profile'
import { usePermissions } from '../../lib/permissions'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard.css'

export default function ProfilePage() {
  const { can, user } = usePermissions()
  const setSession = useAuthStore((s) => s.setSession)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const canUpdate = can('profile', 'update')

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [roleName, setRoleName] = useState(user?.role?.name || '')
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError('')
      const result = await getMyProfile()
      if (cancelled) return
      setLoading(false)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setFullName(result.data.user.fullName || '')
      setEmail(result.data.user.email)
      setRoleName(result.data.user.role?.name || '')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canUpdate) return
    setSavingName(true)
    setError('')
    setInfo('')

    const result = await updateMyProfile(fullName.trim())
    setSavingName(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    if (user && accessToken && refreshToken) {
      setSession(
        { access_token: accessToken, refresh_token: refreshToken },
        {
          ...user,
          fullName: result.data.user.fullName,
          updatedAt: result.data.user.updatedAt,
        },
      )
    }

    setInfo('Name updated.')
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canUpdate) return
    setError('')
    setInfo('')

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSavingPassword(true)
    const result = await updateMyPassword(currentPassword, newPassword)
    setSavingPassword(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setInfo('Password updated.')
  }

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Profile</h1>
          <p>Update your display name and password.</p>
        </div>
      </header>

      {error ? (
        <p className="dash-alert dash-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="dash-alert dash-alert--info">{info}</p> : null}

      {loading ? (
        <div className="dash-panel">
          <p className="dash-muted">Loading profile…</p>
        </div>
      ) : (
        <div className="profile-grid">
          <div className="dash-panel">
            <h2 className="profile-section-title">Account</h2>
            <form className="dash-form" onSubmit={handleNameSubmit}>
              <label className="dash-field">
                <span>Email</span>
                <input value={email} readOnly />
              </label>
              <label className="dash-field">
                <span>Role</span>
                <input value={roleName || '—'} readOnly />
              </label>
              <label className="dash-field">
                <span>Full name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={255}
                  disabled={!canUpdate}
                />
              </label>
              {canUpdate ? (
                <div className="dash-actions">
                  <button type="submit" className="dash-btn" disabled={savingName}>
                    {savingName ? 'Saving…' : 'Save name'}
                  </button>
                </div>
              ) : (
                <p className="dash-muted">You don’t have permission to edit your profile.</p>
              )}
            </form>
          </div>

          <div className="dash-panel">
            <h2 className="profile-section-title">Password</h2>
            {canUpdate ? (
              <form className="dash-form" onSubmit={handlePasswordSubmit}>
                <label className="dash-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
                <label className="dash-field">
                  <span>New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <label className="dash-field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <div className="dash-actions">
                  <button type="submit" className="dash-btn" disabled={savingPassword}>
                    {savingPassword ? 'Updating…' : 'Update password'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="dash-muted">You don’t have permission to change your password here.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
