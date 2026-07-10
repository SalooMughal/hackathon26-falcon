import type { AuthUser } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'sudo'

export function hasFeature(user: AuthUser | null | undefined, featureName: string): boolean {
  const roleFeature = user?.role?.roleFeatures?.find(
    (rf) => rf.feature?.name === featureName,
  )
  return Boolean(roleFeature?.feature?.isActive)
}

export function hasPermission(
  user: AuthUser | null | undefined,
  featureName: string,
  permission: PermissionAction | string,
): boolean {
  const roleFeature = user?.role?.roleFeatures?.find(
    (rf) => rf.feature?.name === featureName,
  )
  if (!roleFeature?.feature?.isActive) return false

  return Boolean(
    roleFeature.roleFeaturePermissions?.some(
      (rfp) => rfp.permission?.name === permission,
    ),
  )
}

export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  return {
    user,
    hasFeature: (featureName: string) => hasFeature(user, featureName),
    can: (featureName: string, permission: PermissionAction | string) =>
      hasPermission(user, featureName, permission),
  }
}
