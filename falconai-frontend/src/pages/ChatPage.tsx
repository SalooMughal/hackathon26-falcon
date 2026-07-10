import '../styles/dashboard.css'

export default function ChatPage() {
  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Chat</h1>
          <p>Your AI RAG assistant will live here. Ask about mortgages, documents, and next steps.</p>
        </div>
      </header>

      <div className="dash-panel chat-placeholder">
        <p className="chat-placeholder-title">Conversation coming soon</p>
        <p className="chat-placeholder-copy">
          This workspace is ready for the chatbot module. For now, manage access from Roles and Features.
        </p>
      </div>
    </section>
  )
}
