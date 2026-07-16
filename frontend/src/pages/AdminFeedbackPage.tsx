import { useState, useEffect } from 'react'
import { MessageSquare, ThumbsUp, ThumbsDown, Filter, CheckCircle, RefreshCw, AlertCircle, FileText } from 'lucide-react'
import { getAdminFeedback, resolveFeedback, getFeedbackAnalytics } from '../services/api'
import { theme } from '../theme'

const { color, font, radius } = theme

interface FeedbackItem {
  id: number
  message_id: number
  user_email: string | null
  query: string
  assistant_response: string
  is_helpful: boolean
  comment: string | null
  status: string
  admin_notes: string | null
  created_at: string
}

interface DownvotedQuery {
  query: string
  count: number
  docs: string[]
}

interface DownvotedDoc {
  filename: string
  count: number
}

interface Analytics {
  upvotes: number
  downvotes: number
  most_downvoted_queries: DownvotedQuery[]
  most_downvoted_documents: DownvotedDoc[]
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    upvotes: 0,
    downvotes: 0,
    most_downvoted_queries: [],
    most_downvoted_documents: [],
  })

  const [activeTab, setActiveTab] = useState<'queue' | 'analytics'>('queue')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State for resolving a feedback
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [submittingResolve, setSubmittingResolve] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Fetch feedbacks
      const statusParam = statusFilter === 'all' ? undefined : statusFilter
      const isHelpfulParam = ratingFilter === 'all' ? undefined : (ratingFilter === 'helpful')

      const feedbacksData = await getAdminFeedback({
        status: statusParam,
        is_helpful: isHelpfulParam,
      })
      setFeedbacks(feedbacksData)

      // 2. Fetch analytics
      const analyticsData = await getFeedbackAnalytics()
      setAnalytics(analyticsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load feedback records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [statusFilter, ratingFilter])

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (resolvingId === null) return

    setSubmittingResolve(true)
    try {
      await resolveFeedback(resolvingId, 'resolved', adminNotes)
      // Remove or update the resolved item in local state
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === resolvingId ? { ...f, status: 'resolved', admin_notes: adminNotes } : f))
      )
      setResolvingId(null)
      setAdminNotes('')
      // Refresh analytics
      const analyticsData = await getFeedbackAnalytics()
      setAnalytics(analyticsData)
    } catch {
      window.alert('Failed to resolve feedback item.')
    } finally {
      setSubmittingResolve(false)
    }
  }

  const fmtDate = (ds: string) => {
    if (!ds) return '-'
    return new Date(ds).toLocaleString()
  }

  const totalVotes = analytics.upvotes + analytics.downvotes
  const helpfulPct = totalVotes > 0 ? Math.round((analytics.upvotes / totalVotes) * 100) : 100

  return (
    <div style={{ padding: '32px', fontFamily: font, minHeight: '100vh', background: color.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: radius.sm, background: color.adminAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: color.textPrimary, margin: 0 }}>Feedback Review Queue & Analytics</h1>
            <p style={{ fontSize: '12.5px', color: color.textTertiary, margin: '2px 0 0' }}>Monitor user satisfaction and improve LLM outputs</p>
          </div>
        </div>
        <button
          onClick={() => void fetchData()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: '#fff',
            border: `1px solid ${color.border}`,
            borderRadius: radius.sm,
            fontSize: '12.5px',
            cursor: 'pointer',
            color: color.textSecondary,
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Helpful Responses</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: color.success }}>{analytics.upvotes}</span>
            <span style={{ fontSize: '13px', color: color.textTertiary }}>upvotes</span>
          </div>
        </div>

        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unhelpful Responses</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: color.danger }}>{analytics.downvotes}</span>
            <span style={{ fontSize: '13px', color: color.textTertiary }}>downvotes</span>
          </div>
        </div>

        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Satisfaction Rate</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: color.adminAccent }}>{helpfulPct}%</span>
            <span style={{ fontSize: '13px', color: color.textTertiary }}>helpful score</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: color.border, borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${helpfulPct}%`, height: '100%', background: helpfulPct >= 70 ? color.success : helpfulPct >= 40 ? color.warning : color.danger }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${color.border}`, gap: '20px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 4px',
            border: 'none',
            borderBottom: activeTab === 'queue' ? `2px solid ${color.adminAccent}` : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'queue' ? color.adminAccent : color.textTertiary,
            fontWeight: activeTab === 'queue' ? 600 : 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Review Queue
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 4px',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? `2px solid ${color.adminAccent}` : '2px solid transparent',
            background: 'transparent',
            color: activeTab === 'analytics' ? color.adminAccent : color.textTertiary,
            fontWeight: activeTab === 'analytics' ? 600 : 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Downvote Analytics
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: color.dangerSoft, color: color.danger, borderRadius: radius.sm, marginBottom: '20px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* TAB CONTENT: Review Queue */}
      {activeTab === 'queue' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '16px', background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.sm, padding: '12px 16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: color.textSecondary, fontWeight: 500 }}>
              <Filter size={14} /> Filters:
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="statusFilter" style={{ fontSize: '12px', color: color.textTertiary }}>Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '4px 8px', border: `1px solid ${color.border}`, borderRadius: radius.sm, fontSize: '12.5px', background: '#fff', outline: 'none' }}
              >
                <option value="all">All Statuses</option>
                <option value="flagged">Flagged (Unresolved)</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="ratingFilter" style={{ fontSize: '12px', color: color.textTertiary }}>User Rating</label>
              <select
                id="ratingFilter"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                style={{ padding: '4px 8px', border: `1px solid ${color.border}`, borderRadius: radius.sm, fontSize: '12.5px', background: '#fff', outline: 'none' }}
              >
                <option value="all">All Ratings</option>
                <option value="helpful">Helpful (👍)</option>
                <option value="unhelpful">Unhelpful (👎)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ color: color.textTertiary, fontSize: '13.5px', padding: '24px 0' }}>Loading queue...</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '40px', textAlign: 'center', color: color.textTertiary, fontSize: '13.5px' }}>
              No feedback items found matching filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {feedbacks.map((f) => (
                <div key={f.id} style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: f.is_helpful ? color.successSoft : color.dangerSoft,
                        color: f.is_helpful ? color.success : color.danger,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {f.is_helpful ? <ThumbsUp size={10} fill={color.success} /> : <ThumbsDown size={10} fill={color.danger} />}
                        {f.is_helpful ? 'Helpful' : 'Unhelpful'}
                      </span>

                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: f.status === 'resolved' ? color.successSoft : f.status === 'reviewed' ? color.warningSoft : color.dangerSoft,
                        color: f.status === 'resolved' ? color.success : f.status === 'reviewed' ? color.warning : color.danger
                      }}>
                        {f.status}
                      </span>

                      <span style={{ fontSize: '12px', color: color.textTertiary }}>
                        {f.user_email || 'Anonymous'} &nbsp;•&nbsp; {fmtDate(f.created_at)}
                      </span>
                    </div>

                    {f.status !== 'resolved' && resolvingId !== f.id && (
                      <button
                        onClick={() => {
                          setResolvingId(f.id)
                          setAdminNotes(f.admin_notes || '')
                        }}
                        style={{
                          padding: '5px 12px',
                          border: 'none',
                          background: color.adminAccent,
                          color: 'white',
                          borderRadius: radius.sm,
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Resolve
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    <div style={{ background: '#fcfbf8', border: `1px solid ${color.border}`, padding: '12px', borderRadius: radius.sm }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', marginBottom: '4px' }}>User Query</div>
                      <div style={{ fontSize: '13.5px', color: color.textPrimary }}>{f.query}</div>
                    </div>

                    <div style={{ background: '#fff', border: `1px solid ${color.border}`, padding: '12px', borderRadius: radius.sm }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', marginBottom: '4px' }}>Assistant Response</div>
                      <div style={{ fontSize: '13px', color: color.textSecondary, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {f.assistant_response}
                      </div>
                    </div>

                    {f.comment && (
                      <div style={{ background: '#fff9e6', border: '1px solid #ffe8cc', padding: '12px', borderRadius: radius.sm }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#b25e00', textTransform: 'uppercase', marginBottom: '4px' }}>User Comments</div>
                        <div style={{ fontSize: '13px', color: '#854f0e', fontStyle: 'italic' }}>"{f.comment}"</div>
                      </div>
                    )}

                    {f.admin_notes && (
                      <div style={{ background: '#edf4f8', border: '1px solid #d0e2ec', padding: '12px', borderRadius: radius.sm }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: color.adminAccent, textTransform: 'uppercase', marginBottom: '4px' }}>Admin Review Notes</div>
                        <div style={{ fontSize: '13px', color: color.textPrimary }}>{f.admin_notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Inline resolve form */}
                  {resolvingId === f.id && (
                    <form onSubmit={handleResolveSubmit} style={{ marginTop: '8px', padding: '16px', background: '#f5f7f9', border: `1px solid ${color.border}`, borderRadius: radius.sm, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: color.textPrimary }}>Add admin resolution notes</div>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Detail adjustments made to the documents, prompts, or explain why this feedback is resolved..."
                        required
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          fontSize: '12.5px',
                          padding: '8px',
                          borderRadius: radius.sm,
                          border: `1px solid ${color.border}`,
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          style={{ padding: '6px 12px', border: `1px solid ${color.border}`, background: '#white', borderRadius: radius.sm, fontSize: '12.5px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingResolve}
                          style={{
                            padding: '6px 16px',
                            border: 'none',
                            background: color.success,
                            color: 'white',
                            borderRadius: radius.sm,
                            fontSize: '12.5px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          {submittingResolve ? 'Resolving...' : 'Mark as Resolved'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Downvote Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Downvoted Queries */}
          <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: color.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
              <AlertCircle size={16} color={color.danger} />
              Most Downvoted Queries
            </h2>

            {analytics.most_downvoted_queries.length === 0 ? (
              <div style={{ color: color.textTertiary, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No downvoted queries to display.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.most_downvoted_queries.map((q, idx) => (
                  <div key={idx} style={{ padding: '12px', border: `1px solid ${color.border}`, borderRadius: radius.sm, background: '#fdfcfb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: color.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                        "{q.query}"
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: color.danger, background: color.dangerSoft, padding: '2px 8px', borderRadius: '12px' }}>
                        {q.count} downvotes
                      </span>
                    </div>
                    {q.docs && q.docs.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase' }}>Citations involved:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {q.docs.map((doc, dIdx) => (
                            <span key={dIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: color.bg, color: color.textSecondary, padding: '2px 8px', borderRadius: radius.sm }}>
                              <FileText size={10} />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Downvoted Documents */}
          <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: color.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
              <FileText size={16} color={color.warning} />
              Most Downvoted Documents
            </h2>

            {analytics.most_downvoted_documents.length === 0 ? (
              <div style={{ color: color.textTertiary, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No downvoted documents to display.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics.most_downvoted_documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: `1px solid ${color.border}`, borderRadius: radius.sm, background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <FileText size={15} color={color.textTertiary} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: color.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.filename}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: color.textSecondary }}>
                      {doc.count} queries flagged
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
