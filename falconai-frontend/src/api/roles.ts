import { apiRequest } from './client'
import type { Pagination, Permission, Role } from './types'

type RolesListResponse = {
  code: number
  message: string
  roles: Role[]
  pagination: Pagination
}

type RoleResponse = {
  code: number
  message: string
  role: Role
}

type PermissionsListResponse = {
  code: number
  message: string
  permissions: Permission[]
  pagination: Pagination
}

type MessageResponse = {
  code: number
  message: string
}

export async function getAllRoles(page = 1, limit = 20) {
  return apiRequest<RolesListResponse>({
    method: 'GET',
    url: '/v1/roles/read/get-all',
    params: { page, limit },
  })
}

export async function getOneRole(roleId: string) {
  return apiRequest<RoleResponse>({
    method: 'GET',
    url: '/v1/roles/read/get-one',
    params: { roleId },
  })
}

export async function createRole(name: string, description: string) {
  return apiRequest<RoleResponse>({
    method: 'POST',
    url: '/v1/roles/create',
    data: { name, description },
  })
}

export async function deleteRole(roleId: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/roles/delete',
    data: { roleId },
  })
}

export async function addFeaturesToRole(roleId: string, featureIds: string[]) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/roles/update/add-features',
    data: { roleId, featureIds },
  })
}

export async function removeFeaturesFromRole(roleId: string, featureIds: string[]) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/roles/update/remove-features',
    data: { roleId, featureIds },
  })
}

export async function addPermissionsToFeatureRole(
  roleId: string,
  featureId: string,
  permissionIds: string[],
) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/roles/update/add-permissions',
    data: { roleId, featureId, permissionIds },
  })
}

export async function removePermissionsFromFeatureRole(
  roleId: string,
  featureId: string,
  permissionIds: string[],
) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/roles/update/remove-permissions',
    data: { roleId, featureId, permissionIds },
  })
}

export async function getAllPermissions(page = 1, limit = 50) {
  return apiRequest<PermissionsListResponse>({
    method: 'GET',
    url: '/v1/roles/read/permissions/get-all',
    params: { page, limit },
  })
}
