import { apiRequest } from './client'
import type { Feature, Pagination } from './types'

type FeaturesListResponse = {
  code: number
  message: string
  features: Feature[]
  pagination: Pagination
}

type FeatureResponse = {
  code: number
  message: string
  feature: Feature
}

type MessageResponse = {
  code: number
  message: string
}

export async function getAllFeatures(page = 1, limit = 20) {
  return apiRequest<FeaturesListResponse>({
    method: 'GET',
    url: '/v1/features/read/get-all',
    params: { page, limit },
  })
}

export async function getOneFeature(featureId: string) {
  return apiRequest<FeatureResponse>({
    method: 'GET',
    url: '/v1/features/read/get-one',
    params: { featureId },
  })
}

export async function createFeature(input: {
  name: string
  description: string
  isActive?: boolean
}) {
  return apiRequest<FeatureResponse>({
    method: 'POST',
    url: '/v1/features/create',
    data: input,
  })
}

export async function updateFeature(input: {
  featureId: string
  name?: string
  description?: string
  isActive?: boolean
}) {
  return apiRequest<FeatureResponse>({
    method: 'POST',
    url: '/v1/features/update',
    data: input,
  })
}

export async function deleteFeature(featureId: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/features/delete',
    data: { featureId },
  })
}
