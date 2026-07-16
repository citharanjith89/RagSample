import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  withCredentials: true,
})

// Add error interceptor to handle network and server errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`API Error [${error.response.status}]:`, error.response.data)
      if (error.response.status === 401) {
        // Session timeout / unauthorized: redirect to login
        if (!window.location.pathname.endsWith('/login') && !window.location.pathname.endsWith('/register')) {
          window.location.href = '/login'
        }
      }
    } else if (error.request) {
      console.error("Network Error: No response from server", error.request)
    } else {
      console.error("Error:", error.message)
    }
    return Promise.reject(error)
  }
)


export default api

export const uploadFile = (file: File, department?: string) => {
  const form = new FormData()
  form.append('file', file)
  if (department) form.append('department', department)
  return api.post('/upload', form)
}

export const uploadBulk = (files: File[], department?: string) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  if (department) form.append('department', department)
  return api.post('/upload/bulk', form)
}

export const getDocuments = (params?: { status?: string; department?: string }) =>
  api.get('/documents', { params }).then((r) => r.data)

export const getDocument = (id: number) =>
  api.get(`/documents/${id}`).then((r) => r.data)

export const deleteDocument = (id: number) => api.delete(`/documents/${id}`)

export const chunkDocument = (id: number) => api.post(`/documents/${id}/chunk`)
export const chunkAll = () => api.post('/chunk/all')
export const getChunks = (docId: number) =>
  api.get(`/documents/${docId}/chunks`).then((r) => r.data)

export const embedDocument = (id: number) => api.post(`/documents/${id}/embed`)
export const embedAll = () => api.post('/embed/all')
export const getEmbeddingStatus = (id: number) =>
  api.get(`/documents/${id}/embedding-status`).then((r) => r.data)
export const getQdrantStats = () => api.get('/qdrant/stats').then((r) => r.data)
export const reprocessDocument = (id: number) => api.post(`/documents/${id}/reprocess`)

export const register = (email: string, password: string, full_name: string) =>
  api.post('/auth/register', { email, password, full_name }).then((r) => r.data)

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const logout = () => api.post('/auth/logout')

export const getMe = () => api.get('/auth/me').then((r) => r.data)
export const getUsers = () => api.get('/admin/users').then((r) => r.data)
export const getStats = () => api.get("/admin/stats").then((r) => r.data)
export const getLoginActivity = () => api.get("/admin/login-activity").then((r) => r.data)
export const updateRole = (userId: number, role: string) =>
  api.put('/admin/users/role', { user_id: userId, role })
export const disableUser = (userId: number) => api.put(`/admin/users/${userId}/disable`)
export const enableUser = (userId: number) => api.put(`/admin/users/${userId}/enable`)
export const promoteToAdmin = (email: string) =>
  api.post('/admin/users/promote-to-admin', { email }).then((r) => r.data)

export const getDriveFiles = (credentials_json: object, folder_id?: string) =>
  api.post('/drive/files', { credentials_json, folder_id }).then((r) => r.data)

export const importDriveFile = (credentials_json: object, file: object) =>
  api.post('/drive/import', { credentials_json, file }).then((r) => r.data)

export const importAllDriveFiles = (credentials_json: object, files: object[]) =>
  api.post('/drive/import-all', { credentials_json, files }).then((r) => r.data)

export const search = (query: string, limit = 5, department?: string) =>
  api.post('/search', { query, limit, department }).then((r) => r.data)

export const chat = (query: string, limit = 5, department?: string) =>
  api.post('/chat', { query, limit, department }).then((r) => r.data)

export const submitFeedback = (messageId: number, isHelpful: boolean, comment?: string) =>
  api.post('/feedback', { message_id: messageId, is_helpful: isHelpful, comment }).then((r) => r.data)

export const getAdminFeedback = (params?: { status?: string; is_helpful?: boolean }) =>
  api.get('/admin/feedback', { params }).then((r) => r.data)

export const resolveFeedback = (feedbackId: number, status: string, adminNotes?: string) =>
  api.put(`/admin/feedback/${feedbackId}`, { status, admin_notes: adminNotes }).then((r) => r.data)

export const getFeedbackAnalytics = () =>
  api.get('/admin/feedback-analytics').then((r) => r.data)

export const getAuditMetrics = () =>
  api.get('/admin/audit-metrics').then((r) => r.data)




export const extractFileText = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/extract-text', form).then((r) => r.data)
}
