import { apiRequest } from './client'
import type { AppNotification, NotificationStatus, NotificationType, Pagination } from './types'

type ListResponse = {
  code: number
  message: string
  notifications: AppNotification[]
  pagination: Pagination
}

type OneResponse = {
  code: number
  message: string
  notification: AppNotification
}

type CreateResponse = {
  code: number
  message: string
  notification: AppNotification
  broadcastId?: string
  recipients?: number
}

type CountsResponse = {
  code: number
  message: string
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
}

type MessageResponse = {
  code: number
  message: string
}

export async function getAllNotifications(
  page = 1,
  limit = 10,
  params?: { search?: string; status?: NotificationStatus; type?: NotificationType },
) {
  return apiRequest<ListResponse>({
    method: 'GET',
    url: '/v1/notifications/read/get-all',
    params: {
      page,
      limit,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.type ? { type: params.type } : {}),
    },
  })
}

export async function getNotificationCounts() {
  return apiRequest<CountsResponse>({
    method: 'GET',
    url: '/v1/notifications/read/get-counts',
  })
}

export async function createNotice(input: {
  title: string
  message: string
  type?: NotificationType
}) {
  return apiRequest<CreateResponse>({
    method: 'POST',
    url: '/v1/notifications/create',
    data: input,
  })
}

export async function updateNotice(input: {
  broadcastId: string
  title?: string
  message?: string
  type?: NotificationType
}) {
  return apiRequest<OneResponse & { updated?: number }>({
    method: 'POST',
    url: '/v1/notifications/update',
    data: input,
  })
}

export async function markNotificationRead(id?: string) {
  return apiRequest<MessageResponse | OneResponse>({
    method: 'POST',
    url: '/v1/notifications/update/mark-all-read',
    data: id ? { id } : {},
  })
}

export async function updateNotificationStatus(id: string, status: NotificationStatus) {
  return apiRequest<OneResponse>({
    method: 'POST',
    url: '/v1/notifications/update/update-status',
    data: { id, status },
  })
}

export async function deleteNotification(input: { id?: string; broadcastId?: string }) {
  return apiRequest<MessageResponse & { deleted?: number }>({
    method: 'POST',
    url: '/v1/notifications/delete',
    data: input,
  })
}
