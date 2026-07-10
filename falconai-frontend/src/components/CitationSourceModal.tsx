import { useEffect, useMemo, useRef, useState } from 'react'
import { getCitationSource } from '../api/chat'
import type { ChatCitation, CitationSource } from '../api/types'
import '../styles/dashboard.css'

type Props = {
  citation: ChatCitation | null
  onClose: () => void
}

function findHighlightRange(documentContent: string, excerpt: string) {
  if (!excerpt.trim() || !documentContent) return null
  const exact = documentContent.indexOf(excerpt)
  if (exact >= 0) return { start: exact, end: exact + excerpt.length }

  const trimmed = excerpt.trim()
  const soft = documentContent.indexOf(trimmed)
  if (soft >= 0) return { start: soft, end: soft + trimmed.length }

  return null
}

function HighlightedDocument({
  documentContent,
  excerpt,
}: {
  documentContent: string
  excerpt: string
}) {
  const range = useMemo(
    () => findHighlightRange(documentContent, excerpt),
    [documentContent, excerpt],
  )
  const markRef = useRef<HTMLElement>(null)

  useEffect(() => {
    markRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [documentContent, excerpt, range?.start])

  if (!documentContent.trim() && !excerpt.trim()) {
    return <p className="dash-muted">Document content is unavailable.</p>
  }

  if (!documentContent.trim() && excerpt.trim()) {
    return (
      <div className="citation-excerpt-only">
        <p className="citation-excerpt-label">Cited passage</p>
        <mark className="citation-mark citation-mark--block">{excerpt}</mark>
      </div>
    )
  }

  if (!range) {
    return (
      <>
        {excerpt.trim() ? (
          <div className="citation-excerpt-only">
            <p className="citation-excerpt-label">Cited passage</p>
            <mark className="citation-mark citation-mark--block">{excerpt}</mark>
          </div>
        ) : null}
        <pre className="citation-doc-body">{documentContent}</pre>
      </>
    )
  }

  const before = documentContent.slice(0, range.start)
  const hit = documentContent.slice(range.start, range.end)
  const after = documentContent.slice(range.end)

  return (
    <pre className="citation-doc-body">
      {before}
      <mark ref={markRef} className="citation-mark">
        {hit}
      </mark>
      {after}
    </pre>
  )
}

export default function CitationSourceModal({ citation, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<CitationSource | null>(null)

  useEffect(() => {
    if (!citation) {
      setSource(null)
      setError('')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    setSource(
      citation.content
        ? {
            documentId: citation.documentId,
            title: citation.title,
            filename: citation.filename,
            chunkIndex: citation.chunkIndex ?? 0,
            excerpt: citation.content,
            documentContent: '',
          }
        : null,
    )

    void (async () => {
      const result = await getCitationSource(citation.documentId, citation.chunkIndex)
      if (cancelled) return
      setLoading(false)
      if (!result.ok) {
        if (!citation.content) setError(result.error.message)
        return
      }
      setSource(result.data.source)
    })()

    return () => {
      cancelled = true
    }
  }, [citation])

  useEffect(() => {
    if (!citation) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [citation, onClose])

  if (!citation) return null

  const title = source?.title || citation.title
  const filename = source?.filename || citation.filename
  const excerpt = source?.excerpt || citation.content || ''
  const documentContent = source?.documentContent || ''
  const chunkIndex = source?.chunkIndex ?? citation.chunkIndex ?? 0

  return (
    <div className="dash-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dash-modal dash-modal--wide citation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="citation-modal-head">
          <div>
            <p className="citation-modal-kicker">Source citation</p>
            <h2 id="citation-modal-title">{title}</h2>
            <p className="citation-modal-meta">
              <code>{filename}</code>
              <span>· chunk {chunkIndex}</span>
            </p>
          </div>
          <button type="button" className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onClose}>
            Close
          </button>
        </div>

        {error ? (
          <p className="dash-alert dash-alert--error" role="alert">
            {error}
          </p>
        ) : null}

        {loading && !documentContent && !excerpt ? (
          <p className="dash-muted">Loading source…</p>
        ) : (
          <div className="citation-modal-body sleek-scroll">
            {excerpt && documentContent ? (
              <p className="citation-hint">Highlighted text is the passage used for this answer.</p>
            ) : null}
            <HighlightedDocument
              documentContent={documentContent}
              excerpt={excerpt}
            />
          </div>
        )}
      </div>
    </div>
  )
}
