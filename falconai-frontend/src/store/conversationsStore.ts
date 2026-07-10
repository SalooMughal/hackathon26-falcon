import { create } from 'zustand'
import {
  createConversation,
  deleteConversation,
  listConversations,
  updateConversation,
} from '../api/chat'
import type { ChatConversation } from '../api/types'

type ConversationsState = {
  conversations: ChatConversation[]
  loading: boolean
  error: string
  load: () => Promise<void>
  create: (title?: string) => Promise<ChatConversation | null>
  rename: (id: string, title: string) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  upsertLocal: (conversation: ChatConversation) => void
  patchTitle: (id: string, title: string) => void
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  loading: false,
  error: '',

  load: async () => {
    set({ loading: true, error: '' })
    const result = await listConversations(50)
    if (!result.ok) {
      set({ loading: false, error: result.error.message })
      return
    }
    set({ conversations: result.data.conversations, loading: false })
  },

  create: async (title?: string) => {
    const result = await createConversation(title)
    if (!result.ok) {
      set({ error: result.error.message })
      return null
    }
    const conversation = result.data.conversation
    set({
      conversations: [conversation, ...get().conversations.filter((c) => c.id !== conversation.id)],
      error: '',
    })
    return conversation
  },

  rename: async (id, title) => {
    const result = await updateConversation(id, title)
    if (!result.ok) {
      set({ error: result.error.message })
      return false
    }
    const updated = result.data.conversation
    set({
      conversations: get().conversations.map((c) => (c.id === id ? updated : c)),
      error: '',
    })
    return true
  },

  remove: async (id) => {
    const result = await deleteConversation(id)
    if (!result.ok) {
      set({ error: result.error.message })
      return false
    }
    set({
      conversations: get().conversations.filter((c) => c.id !== id),
      error: '',
    })
    return true
  },

  upsertLocal: (conversation) => {
    set({
      conversations: [
        conversation,
        ...get().conversations.filter((c) => c.id !== conversation.id),
      ],
    })
  },

  patchTitle: (id, title) => {
    set({
      conversations: get()
        .conversations.map((c) =>
          c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c,
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    })
  },
}))
