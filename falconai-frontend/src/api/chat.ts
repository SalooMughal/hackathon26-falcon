import { apiRequest } from './client'
import type { ChatCitation, ChatMessage } from './types'

type HistoryResponse = {
  code: number
  message: string
  messages: ChatMessage[]
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
    }
  | { type: 'error'; message: string; code?: number }

export async function getChatHistory(limit = 50) {
  return apiRequest<HistoryResponse>({
    method: 'GET',
    url: '/v1/chat/read/history',
    params: { limit },
  })
}

export async function clearChatHistory() {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/chat/delete/history',
    data: {},
  })
}

/**
 * Streams an assistant answer via SSE from POST /v1/chat/create/ask-stream.
 */
export async function askChatStream(
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
    body: JSON.stringify({ question }),
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
