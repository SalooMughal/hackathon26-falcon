import type { NavIconId } from '../components/NavIcon'

export type NavItem = {
  feature?: string
  label: string
  path: string
  always?: boolean
  icon: NavIconId
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Chat', path: '/', always: true, icon: 'chat' },
  {
    feature: 'knowledge-base',
    label: 'Knowledge base',
    path: '/knowledge-base',
    icon: 'knowledge',
  },
  { feature: 'admin-stats', label: 'Admin stats', path: '/admin-stats', icon: 'stats' },
  { feature: 'users', label: 'Users', path: '/users', icon: 'users' },
  { feature: 'roles', label: 'Roles', path: '/roles', icon: 'roles' },
  { feature: 'features', label: 'Features', path: '/features', icon: 'features' },
  { feature: 'sessions', label: 'Sessions', path: '/sessions', icon: 'sessions' },
  {
    feature: 'notifications',
    label: 'Noticeboard',
    path: '/notifications',
    icon: 'notifications',
  },
  {
    feature: 'platform-settings',
    label: 'Settings',
    path: '/platform-settings',
    icon: 'settings',
  },
  { feature: 'profile', label: 'Profile', path: '/profile', icon: 'profile' },
]
