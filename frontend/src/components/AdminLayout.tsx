import { Outlet, NavLink } from 'react-router-dom'
import {
  FileText, HardDrive, Users, LogOut, Cpu,
  MessageSquare, ClipboardList, UserCheck, Shield,
} from 'lucide-react'
import { logout } from '../services/api'
import { theme } from '../theme'

const { color, font, radius } = theme

const chatNav = [{ to: '/chat', icon: MessageSquare, label: 'Chat' }]

const adminNav = [
  { to: '/dashboard', icon: ClipboardList, label: 'Dashboard' },
  { to: '/feedback', icon: MessageSquare, label: 'Feedback Review' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/processing', icon: Cpu, label: 'Processing' },
  { to: '/drive', icon: HardDrive, label: 'Google Drive' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/user-log', icon: ClipboardList, label: 'User Log' },
  { to: '/add-admin', icon: UserCheck, label: 'Add Admin' },
]


interface AdminLayoutProps {
  role?: string
}

export default function AdminLayout({ role }: AdminLayoutProps) {
  const isAdmin = role === 'admin'
  const nav = isAdmin ? [...chatNav, ...adminNav] : chatNav

  const handleLogout = async () => {
    try { await logout() } finally {
      window.location.href = '/login'
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: font, background: color.bg }}>
      <aside
        style={{
          width: '240px',
          background: color.surface,
          borderRight: `1px solid ${color.border}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${color.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px', height: '28px', borderRadius: radius.sm,
                background: color.adminAccent, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Shield size={15} color="#fff" strokeWidth={2.25} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: color.textPrimary, letterSpacing: '-0.01em' }}>
                Enterprise RAG
              </div>
              <div style={{ fontSize: '11px', color: color.textTertiary, marginTop: '1px' }}>
                {isAdmin ? 'Admin workspace' : 'Document search'}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {nav.map(({ to, icon: Icon, label }, i) => (
            <div key={to}>
              {isAdmin && i === 1 && (
                <div
                  style={{
                    fontSize: '10.5px', fontWeight: 600, color: color.textTertiary,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    padding: '14px 10px 6px',
                  }}
                >
                  Administration
                </div>
              )}
              <NavLink
                to={to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '8px 10px', borderRadius: radius.sm,
                  fontSize: '13.5px', fontWeight: 500, textDecoration: 'none',
                  color: isActive ? color.adminAccent : color.textSecondary,
                  background: isActive ? color.adminAccentSoft : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                })}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </NavLink>
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '14px 20px', borderTop: `1px solid ${color.border}`,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '13.5px', fontWeight: 500, color: color.textSecondary,
            width: '100%', textAlign: 'left', transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = color.danger)}
          onMouseLeave={(e) => (e.currentTarget.style.color = color.textSecondary)}
        >
          <LogOut size={15} strokeWidth={2} />
          Log out
        </button>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: color.bg }}>
        <Outlet />
      </main>
    </div>
  )
}
