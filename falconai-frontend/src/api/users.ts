import { apiRequest } from './client'
import type { ManagedUser, Pagination } from './types'

type UsersListResponse = {
  code: number
  message: string
  users: ManagedUser[]
  pagination: Pagination
}

type UserResponse = {
  code: number
  message: string
  user: ManagedUser
}

type MessageResponse = {
  code: number
  message: string
}

export async function getAllUsers(page = 1, limit = 10, search?: string) {
  return apiRequest<UsersListResponse>({
    method: 'GET',
    url: '/v1/users/read/get-all',
    params: { page, limit, ...(search ? { search } : {}) },
  })
}

export async function createUser(input: {
  email: string
  fullName: string
  password: string
  roleId: string
}) {
  return apiRequest<UserResponse>({
    method: 'POST',
    url: '/v1/users/create',
    data: input,
  })
}

export async function updateUser(input: {
  userId: string
  fullName?: string
  password?: string
  roleId?: string
}) {
  return apiRequest<UserResponse>({
    method: 'POST',
    url: '/v1/users/update',
    data: input,
  })
}

export async function deleteUser(userId: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/users/delete',
    data: { userId },
  })
}
