import { CheckCircle, XCircle, Loader, Clock, RefreshCw } from 'lucide-react'
import { usePipeline, DocProgress } from '../hooks/usePipeline'

const statusIcon = (status: DocProgress['status']) => {
  if (status === 'done') return <CheckCircle size={15} color="#27500A" />
  if (status === 'failed') return <XCircle size={15} color="#A32D2D" />
  if (status === 'skipped') return <XCircle size={15} color="#5F5E5A" />
  if (status === 'waiting') return <Clock size={15} color="#888780" />
  return <Loader size={15} color="#185FA5" className="animate-spin" />
}

const statusLabel = (status: DocProgress['status']) => {
  if (status === 'waiting') return 'Waiting'
  if (status === 'extracting') return 'Extracting text…'
  if (status === 'chunking') return 'Chunking…'
  if (status === 'embedding') return 'Embedding…'
  if (status === 'done') return 'Done'
  if (status === 'skipped') return 'Skipped'
  if (status === 'failed') return 'Failed'
  return status
}

const stageBar = (status: DocProgress['status']) => {
  const stages = ['extracting', 'chunking', 'embedding', 'done']
  const idx = stages.indexOf(status === 'done' ? 'done' : status)
  return (
    <div className="stage-bar">
      {['Extract', 'Chunk', 'Embed'].map((s, i) => {
        const active = idx === i
        const done = idx > i || status === 'done'
        return (
          <div key={s} className="stage-item">
            <div className={`stage-badge ${done ? 'done' : active ? 'active' : 'pending'}`}>{s}</div>
            {i < 2 && <div className={`stage-connector ${done ? 'done' : 'pending'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function ProcessingPage({ externalProgress, externalRunning, externalSummary, externalRetry }: {
  externalProgress?: DocProgress[]
  externalRunning?: boolean
  externalSummary?: { done: number; skipped: number; failed: number } | null
  externalRetry?: (docs: DocProgress[]) => void
}) {
  const internal = usePipeline()
  const progress = externalProgress ?? internal.progress
  const running = externalRunning ?? internal.running
  const summary = externalSummary ?? internal.summary
  const retry = externalRetry ?? internal.retry

  const failed = progress.filter(d => d.status === 'failed' || d.status === 'skipped')
  const failedOnly = progress.filter(d => d.status === 'failed')
  const doneCount = progress.filter(d => d.status === 'done').length

  return (
    <div className="processing-page">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className="processing-header">
        <h1 className="processing-title">Processing pipeline</h1>
        <p className="processing-desc">Documents are automatically extracted, chunked, and embedded.</p>
      </div>

      {progress.length === 0 && !running && (
        <div className="processing-empty">
          No processing activity yet. Import files from Google Drive or upload directly.
        </div>
      )}

      {progress.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="processing-summary">
            <div className="processing-stats">
              <Stat label="Total" value={progress.length} color="#1a3d2a" />
              <Stat label="Done" value={doneCount} color="#27500A" />
              <Stat label="Skipped" value={progress.filter(d => d.status === 'skipped').length} color="#5F5E5A" />
              <Stat label="Failed" value={progress.filter(d => d.status === 'failed').length} color="#A32D2D" />
            </div>
            {running && (
              <div className="processing-loading">
                <Loader size={13} className="animate-spin" />
                Processing {doneCount}/{progress.length}
              </div>
            )}
            {summary && !running && failed.length > 0 && (
              <button
                onClick={() => retry(failed)}
                className="processing-retry"
              >
                <RefreshCw size={12} />
                Retry {failedOnly.length} failed {failed.length > failedOnly.length && `+ ${failed.length - failedOnly.length} skipped`}
              </button>
            )}
          </div>

          {/* Per-document list */}
          <div className="processing-list">
            {progress.map((doc, i) => (
              <div
                key={doc.id}
                className={`processing-item ${doc.status === 'done' ? 'processing-item-done' : ''}`}
              >
                <div className="processing-icon">{statusIcon(doc.status)}</div>
                <div className="processing-doc">
                  <div className="processing-filename">
                    {doc.filename}
                  </div>
                  {doc.status === 'failed' || doc.status === 'skipped' ? (
                    <div className={`processing-error ${doc.status}`}>
                      {doc.error || (doc.status === 'skipped' ? 'No text content extracted' : 'Processing failed')}
                    </div>
                  ) : (
                    stageBar(doc.status)
                  )}
                </div>
                <div className="processing-status">
                  {statusLabel(doc.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Final summary */}
          {summary && !running && (
            <div className={`processing-final ${summary.failed > 0 || summary.skipped > 0 ? 'warning' : 'success'}`}>
              ✓ {summary.done} processed successfully
              {summary.skipped > 0 && ` · ${summary.skipped} skipped (no text)`}
              {summary.failed > 0 && ` · ${summary.failed} failed`}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ '--stat-color': color } as React.CSSProperties}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}