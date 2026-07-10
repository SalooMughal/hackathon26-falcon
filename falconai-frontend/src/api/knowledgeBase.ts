import { apiRequest } from './client'
import type { KnowledgeDocument, Pagination } from './types'

type ListResponse = {
  code: number
  message: string
  documents: KnowledgeDocument[]
  pagination: Pagination
}

type DocResponse = {
  code: number
  message: string
  document: KnowledgeDocument
}

type MessageResponse = {
  code: number
  message: string
}

type ReindexResponse = {
  code: number
  message: string
  results: Array<{ documentId: string; success: boolean; error?: string }>
  reindexed: number
  failed: number
}

export async function getAllKnowledgeDocs(page = 1, limit = 10, search?: string) {
  return apiRequest<ListResponse>({
    method: 'GET',
    url: '/v1/knowledge-base/read/get-all',
    params: { page, limit, ...(search ? { search } : {}) },
  })
}

export async function getOneKnowledgeDoc(documentId: string) {
  return apiRequest<DocResponse>({
    method: 'GET',
    url: '/v1/knowledge-base/read/get-one',
    params: { documentId },
  })
}

export async function createKnowledgeDoc(input: {
  title: string
  content: string
  filename?: string
}) {
  return apiRequest<DocResponse>({
    method: 'POST',
    url: '/v1/knowledge-base/create',
    data: input,
  })
}

export async function updateKnowledgeDoc(input: {
  documentId: string
  title?: string
  content?: string
  filename?: string
}) {
  return apiRequest<DocResponse>({
    method: 'POST',
    url: '/v1/knowledge-base/update',
    data: input,
  })
}

export async function deleteKnowledgeDoc(documentId: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/knowledge-base/delete',
    data: { documentId },
  })
}

export async function reindexKnowledgeDocs(documentId?: string) {
  return apiRequest<ReindexResponse>({
    method: 'POST',
    url: '/v1/knowledge-base/update/reindex',
    data: documentId ? { documentId } : {},
  })
}
