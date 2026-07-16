import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMe } from './services/api'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import AdminLayout from './components/AdminLayout'
import DocumentsPage from './pages/DocumentsPage'
import ProcessingPage from './pages/ProcessingPage'
import DrivePage from './pages/DrivePage'
import UsersPage from './pages/UsersPage'
import UserLogPage from './pages/UserLogPage'
import AddAdminPage from './pages/AddAdminPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminFeedbackPage from './pages/AdminFeedbackPage'


export default function App() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((u) => setRole(u.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', color: '#63604F', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  if (!role) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setRole} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/chat" element={<ChatPage role={role} />} />

      {role === 'admin' && (
        <Route path="/" element={<AdminLayout role={role} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="processing" element={<ProcessingPage />} />
          <Route path="drive" element={<DrivePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="user-log" element={<UserLogPage />} />
          <Route path="add-admin" element={<AddAdminPage />} />
        </Route>
      )}

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}
