import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Download, DownloadCloud, CheckCircle, Plus, X } from 'lucide-react'
import api from '../services/api'
import { usePipeline } from '../hooks/usePipeline'

type Drive = {
  id: string
  label: string
  credentials: object
  folderId: string
  files: any[]
  connected: boolean
}

export default function DrivePage() {
  const navigate = useNavigate()
  const { runPipeline } = usePipeline()
  const [drives, setDrives] = useState<Drive[]>([{ id: '1', label: 'Drive 1', credentials: {}, folderId: '', files: [], connected: false }])
  const [activeId, setActiveId] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const active = drives.find(d => d.id === activeId)!
  const update = (patch: Partial<Drive>) => setDrives(prev => prev.map(d => d.id === activeId ? { ...d, ...patch } : d))

  const addDrive = () => {
    const newId = String(Date.now())
    setDrives(prev => [...prev, { id: newId, label: `Drive ${prev.length + 1}`, credentials: {}, folderId: '', files: [], connected: false }])
    setActiveId(newId)
  }

  const removeDrive = (id: string) => {
    if (drives.length === 1) return
    setDrives(prev => prev.filter(d => d.id !== id))
    setActiveId(drives.find(d => d.id !== id)!.id)
  }

  const loadKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const creds = JSON.parse(ev.target?.result as string)
        update({ credentials: creds })
        setError('')
      } catch {
        setError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const browse = async () => {
    if (!active.credentials || !Object.keys(active.credentials).length) {
      setError('Please upload a JSON key first')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/drive/files', {
        credentials_json: active.credentials,
        folder_id: active.folderId || null,
      })
      update({ files: data, connected: true })
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const importAndProcess = async (files: any[]) => {
    const imported: { id: number; filename: string }[] = []
    for (const f of files) {
      try {
        const { data } = await api.post('/drive/import', {
          credentials_json: active.credentials,
          file: f,
        })
        if (data.id) imported.push({ id: data.id, filename: f.name })
      } catch {}
    }
    if (imported.length > 0) {
      navigate('/processing', { state: { docs: imported } })
      runPipeline(imported)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '860px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a3d2a', margin: '0 0 4px' }}>Google Drive</h1>
        <p style={{ fontSize: '13px', color: '#5a8a6a', margin: 0 }}>
          Connect one or more drives. Files are automatically extracted, chunked, and embedded on import.
        </p>
      </div>

      {/* Drive tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {drives.map(d => (
          <div
            key={d.id}
            onClick={() => setActiveId(d.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${d.id === activeId ? '#3B6D11' : '#c8e6d0'}`,
              background: d.id === activeId ? '#e8f5ee' : '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: d.id === activeId ? '#1a5c2e' : '#5a8a6a',
            }}
          >
            {d.connected && <CheckCircle size={12} color="#27500A" />}
            <HardDrive size={12} />
            {d.label}
            {drives.length > 1 && (
              <span onClick={(e) => { e.stopPropagation(); removeDrive(d.id) }} style={{ marginLeft: '2px', opacity: 0.5 }}>
                <X size={11} />
              </span>
            )}
          </div>
        ))}
        <button
          onClick={addDrive}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px',
            border: '1px dashed #c8e6d0', background: 'transparent',
            cursor: 'pointer', fontSize: '12px', color: '#5a8a6a',
          }}
        >
          <Plus size={12} /> Add drive
        </button>
      </div>

      {/* Connection form */}
      <div style={{
        background: '#fff', border: '1px solid #c8e6d0',
        borderRadius: '12px', padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1a3d2a', marginBottom: '6px' }}>
            Service account JSON key
          </label>
          <input
            type="file" accept=".json" onChange={loadKey}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '7px',
              border: '1px solid #c8e6d0', fontSize: '12px',
              background: active.connected ? '#f7faf8' : '#fff',
              color: '#1a3d2a', boxSizing: 'border-box',
            }}
          />
          {active.connected && (
            <div style={{ fontSize: '11px', color: '#27500A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={11} /> Key loaded
            </div>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1a3d2a', marginBottom: '6px' }}>
            Folder ID <span style={{ fontWeight: '400', color: '#5a8a6a' }}>(optional — leave empty for root)</span>
          </label>
          <input
            value={active.folderId}
            onChange={e => update({ folderId: e.target.value })}
            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '7px',
              border: '1px solid #c8e6d0', fontSize: '12px',
              color: '#1a3d2a', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <div style={{ fontSize: '11px', color: '#888780', marginTop: '4px' }}>
            From Drive URL: drive.google.com/drive/folders/<strong>THIS_PART</strong>
          </div>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '7px', background: '#FCEBEB', color: '#A32D2D', fontSize: '12px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <button
          onClick={browse}
          disabled={loading}
          style={{
            padding: '8px 18px', borderRadius: '8px',
            border: 'none', background: '#3B6D11',
            color: '#fff', fontSize: '13px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Connecting…' : 'Browse drive'}
        </button>
      </div>

      {/* File list */}
      {active.files.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #c8e6d0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid #edf5ee',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a3d2a' }}>
              {active.files.length} files found
            </span>
            <button
              onClick={() => importAndProcess(active.files)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '7px',
                border: 'none', background: '#3B6D11',
                color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              }}
            >
              <DownloadCloud size={13} />
              Import all & process
            </button>
          </div>

          {active.files.map((f, i) => (
            <div
              key={f.drive_file_id}
              style={{
                padding: '10px 18px',
                borderBottom: i < active.files.length - 1 ? '1px solid #edf5ee' : 'none',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              <HardDrive size={13} color="#5a8a6a" />
              <div style={{ flex: 1, fontSize: '13px', color: '#1a3d2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </div>
              <span style={{ fontSize: '11px', color: '#888780', textTransform: 'uppercase' }}>{f.file_type}</span>
              <span style={{ fontSize: '11px', color: '#888780' }}>
                {f.size ? `${(f.size / 1024).toFixed(1)} KB` : '—'}
              </span>
              <button
                onClick={() => importAndProcess([f])}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px',
                  border: '1px solid #c8e6d0', background: '#e8f5ee',
                  color: '#1a5c2e', fontSize: '11px', cursor: 'pointer',
                }}
              >
                <Download size={11} /> Import
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}