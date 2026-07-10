import { apiRequest } from './client'
import type { ChatCitation, ChatConversation, ChatMessage, CitationSource } from './types'

type ConversationsResponse = {
  code: number
  message: string
  conversations: ChatConversation[]
}

type ConversationResponse = {
  code: number
  message: string
  conversation: ChatConversation
}

type HistoryResponse = {
  code: number
  message: string
  conversation: ChatConversation
  messages: ChatMessage[]
}

type SourceResponse = {
  code: number
  message: string
  source: CitationSource
}

type MessageResponse = {
  code: number
  message: string
}

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'token'; content: string }
  | {
      type: 'done'
      answer: string
      citations: ChatCitation[]
      grounded: boolean
      provider: string | null
      conversationId: string
      conversationTitle?: string
    }
  | { type: 'error'; message: string; code?: number }

export async function listConversations(limit = 50) {
  return apiRequest<ConversationsResponse>({
    method: 'GET',
    url: '/v1/chat/read/conversations',
    params: { limit },
  })
}

export async function createConversation(title?: string) {
  return apiRequest<ConversationResponse>({
    method: 'POST',
    url: '/v1/chat/create/conversation',
    data: title ? { title } : {},
  })
}

export async function updateConversation(conversationId: string, title: string) {
  return apiRequest<ConversationResponse>({
    method: 'POST',
    url: '/v1/chat/update/conversation',
    data: { conversationId, title },
  })
}

export async function deleteConversation(conversationId: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/chat/delete/conversation',
    data: { conversationId },
  })
}

export async function getChatHistory(conversationId: string, limit = 100) {
  return apiRequest<HistoryResponse>({
    method: 'GET',
    url: '/v1/chat/read/history',
    params: { conversationId, limit },
  })
}

export async function getCitationSource(documentId: string, chunkIndex?: number) {
  return apiRequest<SourceResponse>({
    method: 'GET',
    url: '/v1/chat/read/source',
    params: {
      documentId,
      ...(typeof chunkIndex === 'number' ? { chunkIndex } : {}),
    },
  })
}

/**
 * Streams an assistant answer via SSE from POST /v1/chat/create/ask-stream.
 */
export async function askChatStream(
  conversationId: string,
  question: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('falconai_access_token')
  const base = import.meta.env.VITE_API_URL ?? ''

  const response = await fetch(`${base}/v1/chat/create/ask-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ conversationId, question }),
    signal,
  })

  if (!response.ok) {
    let message = 'Unable to reach the assistant.'
    try {
      const body = (await response.json()) as { message?: string; code?: number }
      message = body.message || message
      onEvent({ type: 'error', message, code: body.code })
    } catch {
      onEvent({ type: 'error', message })
    }
    return
  }

  if (!response.body) {
    onEvent({ type: 'error', message: 'No response stream from server.' })
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const line = part
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'))
      if (!line) continue

      const raw = line.slice(5).trim()
      if (!raw || raw === '[DONE]') continue

      try {
        const event = JSON.parse(raw) as StreamEvent
        onEvent(event)
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
