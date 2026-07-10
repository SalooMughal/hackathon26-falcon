import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { askChatStream, getChatHistory } from '../api/chat'
import type { ChatCitation, ChatMessage } from '../api/types'
import { usePermissions } from '../lib/permissions'
import { useConversationsStore } from '../store/conversationsStore'
import '../styles/dashboard.css'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: ChatCitation[]
  streaming?: boolean
  grounded?: boolean
  provider?: string | null
}

function toUi(msg: ChatMessage): UiMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    citations: Array.isArray(msg.citations) ? msg.citations : [],
  }
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canAsk = can('chat', 'create')
  const canDelete = can('chat', 'delete')

  const conversations = useConversationsStore((s) => s.conversations)
  const createConversation = useConversationsStore((s) => s.create)
  const removeConversation = useConversationsStore((s) => s.remove)
  const patchTitle = useConversationsStore((s) => s.patchTitle)

  const [messages, setMessages] = useState<UiMessage[]>([])
  const [title, setTitle] = useState('New chat')
  const [input, setInput] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadHistory = useCallback(async (id: string) => {
    setLoadingHistory(true)
    setError('')
    const result = await getChatHistory(id, 100)
    setLoadingHistory(false)
    if (!result.ok) {
      setError(result.error.message)
      setMessages([])
      return
    }
    setTitle(result.data.conversation.title)
    setMessages(result.data.messages.map(toUi))
  }, [])

  useEffect(() => {
    abortRef.current?.abort()
    setInput('')
    setStatus('')
    setSending(false)

    if (!conversationId) {
      setLoadingHistory(false)
      setMessages([])
      setTitle('New chat')
      return
    }

    void loadHistory(conversationId)
    return () => {
      abortRef.current?.abort()
    }
  }, [conversationId, loadHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  async function handleNewChat() {
    const conversation = await createConversation()
    if (!conversation) return
    navigate(`/c/${conversation.id}`)
  }

  async function handleDelete() {
    if (!conversationId || !canDelete) return
    if (!window.confirm('Delete this conversation?')) return
    const ok = await removeConversation(conversationId)
    if (!ok) return
    const next = conversations.find((c) => c.id !== conversationId)
    if (next) navigate(`/c/${next.id}`)
    else void handleNewChat()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || sending || !canAsk || !conversationId) return

    setInput('')
    setError('')
    setStatus('')
    setSending(true)

    const userLocalId = `local-user-${Date.now()}`
    const assistantId = `local-assistant-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: userLocalId, role: 'user', content: question, citations: [] },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        citations: [],
        streaming: true,
      },
    ])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await askChatStream(
        conversationId,
        question,
        (event) => {
          if (event.type === 'status') {
            setStatus(event.message)
            return
          }
          if (event.type === 'token') {
            setStatus('')
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content, streaming: true }
                  : m,
              ),
            )
            return
          }
          if (event.type === 'done') {
            setStatus('')
            if (event.conversationTitle) {
              setTitle(event.conversationTitle)
              patchTitle(conversationId, event.conversationTitle)
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: event.answer || m.content,
                      citations: event.citations || [],
                      grounded: event.grounded,
                      provider: event.provider,
                      streaming: false,
                    }
                  : m,
              ),
            )
            return
          }
          if (event.type === 'error') {
            setStatus('')
            setError(event.message)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: m.content || event.message,
                      streaming: false,
                    }
                  : m,
              ),
            )
          }
        },
        controller.signal,
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message || 'Stream failed.')
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        )
      }
    } finally {
      setSending(false)
      setStatus('')
      abortRef.current = null
    }
  }

  const showEmpty = !loadingHistory && messages.length === 0

  return (
    <section className="chat-screen">
      <header className="chat-top">
        <div className="chat-top-inner">
          <h1>{title}</h1>
          <div className="chat-top-actions">
            <button type="button" className="chat-top-action" onClick={() => void handleNewChat()}>
              New chat
            </button>
            {canDelete && conversationId && messages.length > 0 ? (
              <button
                type="button"
                className="chat-top-action"
                onClick={() => void handleDelete()}
                disabled={sending}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <p className="chat-banner" role="alert">
          {error}
        </p>
      ) : null}

      <div className="chat-scroll sleek-scroll" aria-live="polite">
        <div className="chat-column">
          {loadingHistory ? (
            <p className="chat-loading">Loading conversation…</p>
          ) : showEmpty ? (
            <div className="chat-hero">
              <h2>How can I help?</h2>
              <p>Ask about onboarding, setup, architecture, or team practices.</p>
              <div className="chat-suggestions">
                {[
                  'How do I set up the local environment?',
                  'What is our PR review process?',
                  'Where do I find architecture docs?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chat-suggestion"
                    disabled={!canAsk || sending || !conversationId}
                    onClick={() => {
                      setInput(suggestion)
                      textareaRef.current?.focus()
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <article
                key={msg.id}
                className={`chat-row chat-row--${msg.role}${msg.streaming ? ' chat-row--streaming' : ''}`}
              >
                <div className="chat-row-inner">
                  <div className="chat-avatar" aria-hidden>
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div className="chat-msg">
                    <div className="chat-msg-body">
                      {msg.content || (msg.streaming ? '' : '')}
                      {msg.streaming && !msg.content ? (
                        <span className="chat-typing" aria-label="Thinking">
                          <span />
                          <span />
                          <span />
                        </span>
                      ) : null}
                      {msg.streaming && msg.content ? (
                        <span className="chat-cursor" aria-hidden />
                      ) : null}
                    </div>
                    {msg.citations.length > 0 ? (
                      <ul className="chat-citations">
                        {msg.citations.map((c) => (
                          <li key={`${msg.id}-${c.documentId}-${c.chunkIndex ?? 0}`}>
                            {c.title}
                            <span> · {c.filename}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {msg.role === 'assistant' && msg.provider && !msg.streaming ? (
                      <p className="chat-meta">
                        {msg.grounded === false ? 'Ungrounded · ' : ''}
                        via {msg.provider}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
          {status ? <p className="chat-status">{status}</p> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="chat-footer">
        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              canAsk
                ? 'Message FalconAI…'
                : 'You do not have permission to send messages.'
            }
            rows={1}
            disabled={!canAsk || sending || !conversationId}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSubmit(e)
              }
            }}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={!canAsk || sending || !input.trim() || !conversationId}
            aria-label="Send message"
          >
            {sending ? '…' : '↑'}
          </button>
        </form>
        <p className="chat-disclaimer">Answers are grounded in your knowledge base.</p>
      </div>
    </section>
  )
}
