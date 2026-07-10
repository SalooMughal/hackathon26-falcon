import { apiRequest } from './client'
import type { AuthUser } from './auth'

type ProfileResponse = {
  code: number
  message: string
  user: AuthUser
}

type MessageResponse = {
  code: number
  message: string
}

export async function getMyProfile() {
  return apiRequest<ProfileResponse>({
    method: 'GET',
    url: '/v1/profile/read/me',
  })
}

export async function updateMyProfile(fullName: string) {
  return apiRequest<ProfileResponse>({
    method: 'POST',
    url: '/v1/profile/update',
    data: { fullName },
  })
}

export async function updateMyPassword(currentPassword: string, newPassword: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/profile/update/password',
    data: { currentPassword, newPassword },
  })
}
