import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useConversationsStore } from '../store/conversationsStore'

/** Sends `/` to the latest conversation, or creates one if none exist. */
export default function ChatHomeRedirect() {
  const conversations = useConversationsStore((s) => s.conversations)
  const loading = useConversationsStore((s) => s.loading)
  const load = useConversationsStore((s) => s.load)
  const create = useConversationsStore((s) => s.create)
  const [target, setTarget] = useState<string | null>(null)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    let cancelled = false

    async function boot() {
      await load()
      if (cancelled) return

      const latest = useConversationsStore.getState().conversations[0]
      if (latest) {
        setTarget(latest.id)
        return
      }

      const created = await create()
      if (cancelled) return
      if (created) setTarget(created.id)
      else setFailed('Unable to start a conversation.')
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [create, load])

  if (failed) {
    return (
      <section className="dash-page" style={{ padding: '2rem' }}>
        <p className="dash-alert dash-alert--error">{failed}</p>
      </section>
    )
  }

  if (!target) {
    return (
      <section className="chat-screen">
        <p className="chat-loading">{loading ? 'Loading chats…' : 'Starting chat…'}</p>
      </section>
    )
  }

  return <Navigate to={`/c/${target}`} replace />
}
