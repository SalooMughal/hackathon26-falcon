import { useEffect, useState, type MouseEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FalconMark } from '../components/FalconMark'
import { NavIcon } from '../components/NavIcon'
import { NAV_ITEMS } from '../lib/nav'
import { usePermissions } from '../lib/permissions'
import { useAuthStore } from '../store/authStore'
import { useConversationsStore } from '../store/conversationsStore'
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
  const isChat = location.pathname === '/' || location.pathname.startsWith('/c/')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [signingOut, setSigningOut] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)

  const conversations = useConversationsStore((s) => s.conversations)
  const loadConversations = useConversationsStore((s) => s.load)
  const createConversation = useConversationsStore((s) => s.create)
  const removeConversation = useConversationsStore((s) => s.remove)

  const visibleNav = NAV_ITEMS.filter(
    (item) => item.always || (item.feature && can(item.feature, 'read')),
  )
  const chatItem = visibleNav.find((item) => item.path === '/' || item.label === 'Chat')
  const otherNav = visibleNav.filter((item) => item !== chatItem)

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [collapsed])

  useEffect(() => {
    if (can('chat', 'read') || chatItem?.always) {
      void loadConversations()
    }
  }, [can, chatItem?.always, loadConversations])

  useEffect(() => {
    if (isChat) setChatOpen(true)
  }, [isChat])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login', { replace: true })
  }

  async function handleNewChat() {
    const conversation = await createConversation()
    if (!conversation) return
    setSidebarOpen(false)
    navigate(`/c/${conversation.id}`)
  }

  async function handleDeleteConversation(id: string, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return
    const ok = await removeConversation(id)
    if (!ok) return
    if (location.pathname === `/c/${id}`) {
      const remaining = useConversationsStore.getState().conversations
      if (remaining[0]) navigate(`/c/${remaining[0].id}`)
      else void handleNewChat()
    }
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
          {chatItem ? (
            <div className={`app-nav-group${chatOpen ? ' app-nav-group--open' : ''}`}>
              <button
                type="button"
                className={`app-nav-link app-nav-parent${isChat ? ' app-nav-link--active' : ''}`}
                title="Chat"
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false)
                    setChatOpen(true)
                    return
                  }
                  setChatOpen((v) => !v)
                }}
              >
                <NavIcon name={chatItem.icon} className="app-nav-icon" />
                <span className="app-nav-label">{chatItem.label}</span>
                <span className="app-nav-caret" aria-hidden>
                  {chatOpen ? '▾' : '▸'}
                </span>
              </button>

              {chatOpen ? (
                <div className="app-nav-sub">
                  <button
                    type="button"
                    className="app-nav-sublink app-nav-sublink--new"
                    onClick={() => void handleNewChat()}
                  >
                    <span className="app-nav-sub-plus">+</span>
                    <span>New chat</span>
                  </button>

                  {conversations.length === 0 ? (
                    <p className="app-nav-empty">No conversations yet</p>
                  ) : (
                    conversations.map((conversation) => (
                      <NavLink
                        key={conversation.id}
                        to={`/c/${conversation.id}`}
                        title={conversation.title}
                        className={({ isActive }) =>
                          `app-nav-sublink${isActive ? ' app-nav-sublink--active' : ''}`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="app-nav-sub-title">{conversation.title}</span>
                        {can('chat', 'delete') ? (
                          <button
                            type="button"
                            className="app-nav-sub-delete"
                            aria-label={`Delete ${conversation.title}`}
                            title="Delete"
                            onClick={(e) => void handleDeleteConversation(conversation.id, e)}
                          >
                            ×
                          </button>
                        ) : null}
                      </NavLink>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {otherNav.map((item) => (
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
