import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FalconMark } from '../components/FalconMark'
import { NAV_ITEMS } from '../lib/nav'
import { usePermissions } from '../lib/permissions'
import { useAuthStore } from '../store/authStore'
import './AppShell.css'

export default function AppShell() {
  const { user, can } = usePermissions()
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const visibleNav = NAV_ITEMS.filter(
    (item) => item.always || (item.feature && can(item.feature, 'read')),
  )

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className={`app-shell${sidebarOpen ? ' app-shell--nav-open' : ''}`}>
      <div
        className="app-shell-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <FalconMark className="app-sidebar-mark" />
          <div>
            <p className="app-sidebar-name">FalconAI</p>
            <p className="app-sidebar-sub">RAG workspace</p>
          </div>
        </div>

        <nav className="app-sidebar-nav" aria-label="Main">
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `app-nav-link${isActive ? ' app-nav-link--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user">
            <p className="app-user-name">{user?.fullName || 'User'}</p>
            <p className="app-user-email">{user?.email}</p>
            {user?.role?.name ? (
              <p className="app-user-role">{user.role.name}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="app-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="app-menu-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            Menu
          </button>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
