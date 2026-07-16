import { useState, useEffect } from 'react'
import { UserCheck, Trash2 } from 'lucide-react'
import api from '../services/api'

interface AdminUser {
  id: number
  email: string
  full_name: string | null
}

export default function AddAdminPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const fetchAdmins = async () => {
    setAdminsLoading(true)
    try {
      const res = await api.get('/admin/users')
      setAdmins(res.data.filter((u: any) => u.role === 'admin'))
    } catch {
      // ignore
    } finally {
      setAdminsLoading(false)
    }
  }

  useEffect(() => { fetchAdmins() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      const res = await api.post('/admin/users/promote-to-admin', { email: email.trim() })
      setSuccess(res.data.message)
      setEmail('')
      fetchAdmins()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (user: AdminUser) => {
    const confirmed = window.confirm(`Remove admin access from ${user.email}?`)
    if (!confirmed) return
    setRemovingId(user.id)
    try {
      await api.put('/admin/users/role', { user_id: user.id, role: 'employee' })
      setSuccess(`${user.email} removed from admin`)
      fetchAdmins()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove admin')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '520px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <UserCheck size={20} color="#1a5c2e" />
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1a5c2e', margin: 0 }}>Add Admin</h1>
      </div>
      <p style={{ fontSize: '13px', color: '#7a9a7a', marginBottom: '28px', lineHeight: 1.6 }}>
        Enter an employee's email to grant them admin access. Their current session will be invalidated.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#4a7a5a', display: 'block', marginBottom: '6px' }}>
          Employee email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setSuccess(''); setError('') }}
          placeholder="employee@company.com"
          required
          style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #c8e6d0', borderRadius: '10px', outline: 'none', background: 'white', boxSizing: 'border-box', marginBottom: '16px' }}
        />

        {success && (
          <div style={{ padding: '12px 16px', background: '#e8f5ee', border: '1px solid #c8e6d0', borderRadius: '8px', fontSize: '13px', color: '#1a5c2e', marginBottom: '16px' }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', fontSize: '13px', color: '#c00', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          style={{ padding: '10px 24px', background: loading || !email.trim() ? '#c8e6d0' : '#1a5c2e', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: loading || !email.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
        >
          {loading ? 'Promoting...' : 'Make admin'}
        </button>
      </form>

      {/* Current admins list */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a5c2e', marginBottom: '12px' }}>
          Current admins
        </div>
        {adminsLoading ? (
          <div style={{ fontSize: '12px', color: '#7a9a7a' }}>Loading...</div>
        ) : admins.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#7a9a7a' }}>No admins found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {admins.map(u => (
              <div
                key={u.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', border: '1px solid #e0ece6', borderRadius: '10px' }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{u.email}</div>
                  {u.full_name && <div style={{ fontSize: '11px', color: '#7a9a7a', marginTop: '2px' }}>{u.full_name}</div>}
                </div>
                <button
                  onClick={() => handleRemove(u)}
                  disabled={removingId === u.id}
                  title="Remove admin"
                  style={{ padding: '6px', background: 'transparent', border: '1px solid #fcc', borderRadius: '6px', cursor: removingId === u.id ? 'not-allowed' : 'pointer', color: '#c00', display: 'flex', alignItems: 'center', opacity: removingId === u.id ? 0.5 : 1 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
