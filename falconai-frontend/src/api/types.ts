export type Pagination = {
  total: number
  count: number
  page: number
  limit: number
}

export type Permission = {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export type Feature = {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type RoleFeaturePermission = {
  id: string
  roleFeatureId: string
  permissionId: string
  permission: Permission
}

export type RoleFeature = {
  id: string
  roleId: string
  featureId: string
  feature: Feature
  roleFeaturePermissions: RoleFeaturePermission[]
}

export type Role = {
  id: string
  name: string
  description: string
  createdAt?: string
  updatedAt?: string
  roleFeatures?: RoleFeature[]
}
