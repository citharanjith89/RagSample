import { useState, useEffect } from 'react'
import { ClipboardList, ShieldAlert, Cpu, Users, Calendar, ArrowRight, RefreshCw, Activity, AlertTriangle } from 'lucide-react'
import { getStats, getAuditMetrics, getMe } from '../services/api'
import { theme } from '../theme'
import { useNavigate } from 'react-router-dom'

const { color, font, radius } = theme

interface Stats {
  total_users: number
  active_users: number
  logins_today: number
  failed_attempts_today: number
  users_by_role: Record<string, number>
}

interface DailyStat {
  date: string
  logins: number
  feedbacks: number
  total_actions: number
}

interface AuditMetrics {
  action_counts: Record<string, number>
  daily_stats: DailyStat[]
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const statsData = await getStats()
      setStats(statsData)

      const metricsData = await getAuditMetrics()
      setMetrics(metricsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load system stats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '32px', fontFamily: font, color: color.textTertiary, fontSize: '13.5px' }}>
        Loading dashboard metrics...
      </div>
    )
  }

  if (error || !stats || !metrics) {
    return (
      <div style={{ padding: '32px', fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: color.dangerSoft, color: color.danger, borderRadius: radius.sm, fontSize: '13px' }}>
          <AlertTriangle size={16} />
          {error || 'Error loading dashboard data'}
        </div>
        <button
          onClick={() => void loadData()}
          style={{ marginTop: '16px', padding: '8px 16px', background: color.adminAccent, color: 'white', border: 'none', borderRadius: radius.sm, cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  // Calculate chart parameters
  const maxActions = Math.max(...metrics.daily_stats.map(d => d.total_actions), 5)

  // Chart rendering helpers
  const renderBarChart = () => {
    const chartHeight = 150
    const chartWidth = 460
    const barWidth = 36
    const gap = 24
    const paddingLeft = 40
    const paddingTop = 20

    return (
      <svg width="100%" height={chartHeight + 60} style={{ overflow: 'visible' }}>
        {/* Y Axis Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = chartHeight * (1 - ratio) + paddingTop
          const val = Math.round(maxActions * ratio)
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={chartWidth + paddingLeft} y2={y} stroke={color.border} strokeWidth="1" strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" style={{ fontSize: '10px', fill: color.textTertiary, fontFamily: 'monospace' }}>
                {val}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {metrics.daily_stats.map((day, idx) => {
          const x = idx * (barWidth + gap) + paddingLeft + 12
          const loginsHeight = (day.logins / maxActions) * chartHeight
          const feedbacksHeight = (day.feedbacks / maxActions) * chartHeight
          const otherHeight = ((day.total_actions - day.logins - day.feedbacks) / maxActions) * chartHeight

          // Stacked Bars starting from the bottom
          const yLogins = chartHeight + paddingTop - loginsHeight
          const yFeedbacks = yLogins - feedbacksHeight
          const yOther = yFeedbacks - otherHeight

          return (
            <g key={idx}>
              {/* Logins bar (success color) */}
              {day.logins > 0 && (
                <rect x={x} y={yLogins} width={barWidth} height={loginsHeight} fill={color.success} rx="2" />
              )}
              {/* Feedbacks bar (adminAccent color) */}
              {day.feedbacks > 0 && (
                <rect x={x} y={yFeedbacks} width={barWidth} height={feedbacksHeight} fill={color.adminAccent} rx="2" />
              )}
              {/* Other bar (borderStrong color) */}
              {day.total_actions - day.logins - day.feedbacks > 0 && (
                <rect x={x} y={yOther} width={barWidth} height={otherHeight} fill={color.borderStrong} rx="2" />
              )}

              {/* X Axis Labels */}
              <text x={x + barWidth / 2} y={chartHeight + paddingTop + 20} textAnchor="middle" style={{ fontSize: '11px', fill: color.textSecondary, fontWeight: 500 }}>
                {day.date}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  // Action distribution counts sorted
  const distribution = Object.entries(metrics.action_counts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)

  const totalAuditEvents = distribution.reduce((sum, item) => sum + item.count, 0)

  return (
    <div style={{ padding: '32px', fontFamily: font, background: color.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: radius.sm, background: color.adminAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: color.textPrimary, margin: 0 }}>System Dashboard & Audit Metrics</h1>
            <p style={{ fontSize: '12.5px', color: color.textTertiary, margin: '2px 0 0' }}>Real-time usage statistics and detailed system audit logging</p>
          </div>
        </div>
        <button
          onClick={() => void loadData()}
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

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#edf4f8', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: color.adminAccent }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Users</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: color.textPrimary, marginTop: '2px' }}>
              {stats.active_users} <span style={{ fontSize: '12.5px', fontWeight: 500, color: color.textTertiary }}>/ {stats.total_users} total</span>
            </div>
          </div>
        </div>

        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: color.success }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Logins Today</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: color.textPrimary, marginTop: '2px' }}>{stats.logins_today}</div>
          </div>
        </div>

        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fdf3f2', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: color.danger }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Failed Logins</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: color.textPrimary, marginTop: '2px' }}>{stats.failed_attempts_today}</div>
          </div>
        </div>

        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f0e6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: color.warning }}>
            <ClipboardList size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: color.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Audit Events</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: color.textPrimary, marginTop: '2px' }}>{totalAuditEvents}</div>
          </div>
        </div>
      </div>

      {/* Charts & Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '24px', alignItems: 'stretch' }}>
        {/* Usage Trend Chart */}
        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: color.textPrimary, margin: '0 0 4px' }}>System Activity (Last 7 Days)</h2>
          <p style={{ fontSize: '12.5px', color: color.textTertiary, margin: '0 0 24px' }}>Total actions performed across RAG search, logins, and feedback submissions</p>

          <div style={{ margin: '0 10px' }}>
            {renderBarChart()}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '11.5px', fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: color.success, borderRadius: '2px' }} />
              <span style={{ color: color.textSecondary }}>Logins</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: color.adminAccent, borderRadius: '2px' }} />
              <span style={{ color: color.textSecondary }}>Feedbacks Submitted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: color.borderStrong, borderRadius: '2px' }} />
              <span style={{ color: color.textSecondary }}>Other API Events</span>
            </div>
          </div>
        </div>

        {/* Audit Log Action Distribution */}
        <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: color.textPrimary, margin: '0 0 4px' }}>Audit Log Breakdown</h2>
          <p style={{ fontSize: '12.5px', color: color.textTertiary, margin: '0 0 16px' }}>Volume of actions recorded in system audit trails</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {distribution.map((item, idx) => {
              const pct = totalAuditEvents > 0 ? Math.round((item.count / totalAuditEvents) * 100) : 0
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500, color: color.textPrimary, fontFamily: 'monospace' }}>{item.action}</span>
                    <span style={{ color: color.textTertiary }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: color.bg, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color.adminAccent }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div
          onClick={() => navigate('/user-log')}
          style={{
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            padding: '24px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = color.adminAccent)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = color.border)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#edf4f8', borderRadius: radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.adminAccent }}>
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: color.textPrimary, margin: 0 }}>View Full Audit Logs</h3>
              <p style={{ fontSize: '12px', color: color.textTertiary, margin: '2px 0 0' }}>Search, filter, and inspect detailed system actions</p>
            </div>
          </div>
          <ArrowRight size={16} color={color.textTertiary} />
        </div>

        <div
          onClick={() => navigate('/feedback')}
          style={{
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            padding: '24px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = color.adminAccent)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = color.border)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#e8f5ee', borderRadius: radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.success }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: color.textPrimary, margin: 0 }}>Review User Feedback</h3>
              <p style={{ fontSize: '12px', color: color.textTertiary, margin: '2px 0 0' }}>Inspect reported items and resolve user comments</p>
            </div>
          </div>
          <ArrowRight size={16} color={color.textTertiary} />
        </div>
      </div>
    </div>
  )
}
