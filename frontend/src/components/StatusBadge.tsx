const colors: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#fef9ec', color: '#92620a' },
  extracting: { bg: '#e6f1fb', color: '#185FA5' },
  extracted:  { bg: '#e6f1fb', color: '#185FA5' },
  chunking:   { bg: '#EEEDFE', color: '#3C3489' },
  chunked:    { bg: '#EEEDFE', color: '#3C3489' },
  embedding:  { bg: '#faeeda', color: '#854F0B' },
  embedded:   { bg: '#c0dd97', color: '#27500A' },
  failed:     { bg: '#FCEBEB', color: '#A32D2D' },
  skipped:    { bg: '#f1efe8', color: '#5F5E5A' },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = colors[status] ?? { bg: '#f1efe8', color: '#5F5E5A' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '5px',
      fontSize: '11px',
      fontWeight: '500',
      background: s.bg,
      color: s.color,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}