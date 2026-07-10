import type { ReactNode } from 'react'

export type NavIconId =
  | 'chat'
  | 'knowledge'
  | 'stats'
  | 'users'
  | 'roles'
  | 'features'
  | 'sessions'
  | 'notifications'
  | 'settings'
  | 'profile'
  | 'collapse'
  | 'expand'
  | 'signout'
  | 'menu'

type IconProps = {
  name: NavIconId
  className?: string
}

export function NavIcon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

const icons: Record<NavIconId, ReactNode> = {
  chat: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" />
    </>
  ),
  knowledge: (
    <>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H12v16H7a2 2 0 0 1-2-2z" />
      <path d="M19 5.5A1.5 1.5 0 0 0 17.5 4H12v16h5a2 2 0 0 0 2-2z" />
    </>
  ),
  stats: (
    <>
      <path d="M4 19h16" />
      <path d="M7 16V10" />
      <path d="M12 16V6" />
      <path d="M17 16v-4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 19a4.5 4.5 0 0 1 5.5-4.3" />
    </>
  ),
  roles: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
      <path d="M16.5 7.5 19 5" />
    </>
  ),
  features: (
    <>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" />
    </>
  ),
  sessions: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M8 19v2" />
      <path d="M16 19v2" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </>
  ),
  notifications: (
    <>
      <path d="M6 16h12l-1.2-1.8a6 6 0 0 1-1-3.2V9a3.8 3.8 0 1 0-7.6 0v2a6 6 0 0 1-1 3.2z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  collapse: (
    <>
      <path d="M15 6 9 12l6 6" />
    </>
  ),
  expand: (
    <>
      <path d="M9 6l6 6-6 6" />
    </>
  ),
  signout: (
    <>
      <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      <path d="M14 12H21" />
      <path d="M18 8l4 4-4 4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
}
