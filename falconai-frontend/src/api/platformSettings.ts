import { apiRequest } from './client'
import type { PlatformSetting } from './types'

type ListResponse = {
  code: number
  message: string
  settings: PlatformSetting[]
}

type UpdateResponse = {
  code: number
  message: string
  results: Array<{
    key: string
    success: boolean
    oldValue?: string
    newValue?: string
    error?: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

export async function getAllPlatformSettings() {
  return apiRequest<ListResponse>({
    method: 'GET',
    url: '/v1/platform-settings/read/get-all',
  })
}

export async function updatePlatformSettings(
  settings: Array<{ key: string; value: string }>,
) {
  return apiRequest<UpdateResponse>({
    method: 'POST',
    url: '/v1/platform-settings/update',
    data: { settings },
  })
}
