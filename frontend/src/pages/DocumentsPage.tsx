import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { getDocuments, deleteDocument } from '../services/api'
import StatusBadge from '../components/StatusBadge'

export default function DocumentsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', statusFilter],
    queryFn: () => getDocuments(statusFilter ? { status: statusFilter } : undefined),
    refetchInterval: 5000,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const statuses = ['', 'pending', 'extracted', 'chunked', 'embedded', 'failed']

  const counts = {
    total: docs.length,
    embedded: docs.filter((d: any) => d.status === 'embedded').length,
    failed: docs.filter((d: any) => d.status === 'failed').length,
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a3d2a', margin: '0 0 4px' }}>Documents</h1>
          <p style={{ fontSize: '13px', color: '#5a8a6a', margin: 0 }}>
            {counts.embedded} of {counts.total} embedded
            {counts.failed > 0 && ` · ${counts.failed} failed`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              border: '1px solid #c8e6d0', borderRadius: '7px',
              padding: '7px 10px', fontSize: '12px', color: '#1a3d2a',
              background: '#fff', outline: 'none',
            }}
          >
            {statuses.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['documents'] })}
            style={{
              padding: '7px', borderRadius: '7px', border: '1px solid #c8e6d0',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <RefreshCw size={13} color="#5a8a6a" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <SummaryCard label="Total documents" value={counts.total} color="#1a3d2a" bg="#e8f5ee" />
        <SummaryCard label="Fully embedded" value={counts.embedded} color="#27500A" bg="#c0dd97" />
        <SummaryCard label="Failed" value={counts.failed} color="#A32D2D" bg="#FCEBEB" />
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a8a6a', fontSize: '13px' }}>Loading…</div>
      ) : docs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: '#fff', border: '1px solid #c8e6d0',
          borderRadius: '12px', color: '#5a8a6a', fontSize: '13px',
        }}>
          No documents yet. Import from Google Drive or upload files directly.
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #c8e6d0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f0faf3', borderBottom: '1px solid #c8e6d0' }}>
                {['Name', 'Type', 'Department', 'Status', 'Pages', 'Chunks', 'Uploaded', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '500', color: '#4a7a5a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc: any, i: number) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: i < docs.length - 1 ? '1px solid #edf5ee' : 'none' }}
                >
                  <td style={{ padding: '10px 14px', color: '#1a3d2a', fontWeight: '500', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.filename}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#5a8a6a', textTransform: 'uppercase', fontSize: '11px' }}>{doc.file_type}</td>
                  <td style={{ padding: '10px 14px', color: '#5a8a6a' }}>{doc.department ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={doc.status} /></td>
                  <td style={{ padding: '10px 14px', color: '#5a8a6a' }}>{doc.page_count ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#5a8a6a' }}>{doc.chunk_count ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#888780', fontSize: '11px' }}>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => deleteMut.mutate(doc.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '5px', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={13} color="#c8776a" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: '10px', padding: '14px 18px' }}>
      <div style={{ fontSize: '24px', fontWeight: '600', color }}>{value}</div>
      <div style={{ fontSize: '12px', color, opacity: 0.7, marginTop: '2px' }}>{label}</div>
    </div>
  )
}