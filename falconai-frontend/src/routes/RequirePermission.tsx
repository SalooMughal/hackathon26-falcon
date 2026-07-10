import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../lib/permissions'

type Props = {
  feature: string
  children: ReactNode
}

export default function RequirePermission({ feature, children }: Props) {
  const { can } = usePermissions()

  if (!can(feature, 'read')) {
    return <Navigate to="/" replace />
  }

  return children
}
