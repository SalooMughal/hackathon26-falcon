export type NavItem = {
  feature?: string
  label: string
  path: string
  always?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Chat', path: '/', always: true },
  { feature: 'admin-stats', label: 'Admin stats', path: '/admin-stats' },
  { feature: 'users', label: 'Users', path: '/users' },
  { feature: 'roles', label: 'Roles', path: '/roles' },
  { feature: 'features', label: 'Features', path: '/features' },
  { feature: 'sessions', label: 'Sessions', path: '/sessions' },
  { feature: 'notifications', label: 'Notifications', path: '/notifications' },
  { feature: 'platform-settings', label: 'Settings', path: '/platform-settings' },
  { feature: 'profile', label: 'Profile', path: '/profile' },
]
