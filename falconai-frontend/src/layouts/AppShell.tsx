import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FalconMark } from '../components/FalconMark'
import { NavIcon } from '../components/NavIcon'
import { NAV_ITEMS } from '../lib/nav'
import { usePermissions } from '../lib/permissions'
import { useAuthStore } from '../store/authStore'
import './AppShell.css'

const COLLAPSE_KEY = 'falconai_sidebar_collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export default function AppShell() {
  const { user, can } = usePermissions()
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const location = useLocation()
  const isChat = location.pathname === '/'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [signingOut, setSigningOut] = useState(false)

  const visibleNav = NAV_ITEMS.filter(
    (item) => item.always || (item.feature && can(item.feature, 'read')),
  )

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [collapsed])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login', { replace: true })
  }

  const initials =
    user?.fullName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'U'

  return (
    <div
      className={[
        'app-shell',
        sidebarOpen ? 'app-shell--nav-open' : '',
        collapsed ? 'app-shell--collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="app-shell-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <aside className="app-sidebar" aria-label="Sidebar">
        <div className="app-sidebar-head">
          <div className="app-sidebar-brand">
            <FalconMark className="app-sidebar-mark" />
            <div className="app-sidebar-brand-text">
              <p className="app-sidebar-name">FalconAI</p>
              <p className="app-sidebar-sub">RAG workspace</p>
            </div>
          </div>
          <button
            type="button"
            className="app-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <NavIcon name={collapsed ? 'expand' : 'collapse'} className="app-nav-icon" />
          </button>
        </div>

        <nav className="app-sidebar-nav" aria-label="Main">
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={item.label}
              className={({ isActive }) =>
                `app-nav-link${isActive ? ' app-nav-link--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <NavIcon name={item.icon} className="app-nav-icon" />
              <span className="app-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user" title={user?.fullName || 'User'}>
            <div className="app-user-avatar" aria-hidden>
              {initials}
            </div>
            <div className="app-user-text">
              <p className="app-user-name">{user?.fullName || 'User'}</p>
              <p className="app-user-email">{user?.email}</p>
              {user?.role?.name ? (
                <p className="app-user-role">{user.role.name}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="app-signout"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            aria-label="Sign out"
          >
            <NavIcon name="signout" className="app-nav-icon" />
            <span className="app-nav-label">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </span>
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
            <NavIcon name="menu" className="app-nav-icon" />
            <span>Menu</span>
          </button>
        </header>
        <div className={`app-content${isChat ? ' app-content--chat' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
