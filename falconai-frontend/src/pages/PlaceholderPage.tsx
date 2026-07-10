import { useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../lib/nav'
import '../styles/dashboard.css'

export default function PlaceholderPage() {
  const { pathname } = useLocation()
  const item = NAV_ITEMS.find((n) => n.path === pathname)
  const title = item?.label ?? 'Module'

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>{title}</h1>
          <p>This module is permission-gated and will be implemented next.</p>
        </div>
      </header>
      <div className="dash-panel">
        <p className="dash-muted">Placeholder for <code>{pathname}</code></p>
      </div>
    </section>
  )
}
