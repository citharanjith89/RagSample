import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, CheckCircle } from 'lucide-react'
import api from '../services/api'
import { usePipeline } from '../hooks/usePipeline'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [department, setDepartment] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { runPipeline } = usePipeline()

  const allowed = ['pdf', 'docx', 'pptx', 'txt']

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      return allowed.includes(ext)
    })
    setFiles(prev => [...prev, ...valid])
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    try {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      if (department) form.append('department', department)
      const { data } = await api.post('/upload/bulk', form)
      const imported = data.results
        .filter((r: any) => r.id)
        .map((r: any) => ({ id: r.id, filename: r.filename }))
      setFiles([])
      if (imported.length > 0) {
        navigate('/processing')
        runPipeline(imported)
      }
    } catch (e: any) {
      alert(e.response?.data?.detail ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a3d2a', margin: '0 0 4px' }}>Upload files</h1>
        <p style={{ fontSize: '13px', color: '#5a8a6a', margin: 0 }}>
          Files are automatically extracted, chunked, and embedded after upload.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed #c0dd97',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          cursor: 'pointer',
          background: '#f7faf8',
          transition: 'background 0.1s',
        }}
      >
        <Upload size={28} color="#5a8a6a" style={{ marginBottom: '10px' }} />
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a3d2a', marginBottom: '4px' }}>
          Drop files here or click to browse
        </div>
        <div style={{ fontSize: '12px', color: '#5a8a6a' }}>PDF, DOCX, PPTX, TXT</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.pptx,.txt" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
      </div>

      {/* Department */}
      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1a3d2a', marginBottom: '6px' }}>
          Department <span style={{ fontWeight: '400', color: '#5a8a6a' }}>(optional)</span>
        </label>
        <input
          value={department}
          onChange={e => setDepartment(e.target.value)}
          placeholder="e.g. HR, Finance, Engineering"
          style={{
            width: '100%', padding: '8px 10px', borderRadius: '7px',
            border: '1px solid #c8e6d0', fontSize: '13px',
            color: '#1a3d2a', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff', border: '1px solid #c8e6d0',
              borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
            }}>
              <span style={{ color: '#1a3d2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button
                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginLeft: '8px' }}
              >
                <X size={13} color="#888780" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: 'none',
          background: files.length && !uploading ? '#3B6D11' : '#c8e6d0',
          color: files.length && !uploading ? '#fff' : '#5a8a6a',
          fontSize: '13px',
          fontWeight: '500',
          cursor: files.length && !uploading ? 'pointer' : 'not-allowed',
        }}
      >
        {uploading ? 'Uploading…' : `Upload ${files.length || ''} file${files.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}