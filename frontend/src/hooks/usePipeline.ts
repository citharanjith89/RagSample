import { useState, useCallback } from 'react'
import api from '../services/api'

export type DocProgress = {
  id: number
  filename: string
  status: 'waiting' | 'extracting' | 'chunking' | 'embedding' | 'done' | 'skipped' | 'failed'
  error?: string
}

export function usePipeline() {
  const [progress, setProgress] = useState<DocProgress[]>([])
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<{ done: number; skipped: number; failed: number } | null>(null)

  const update = (id: number, patch: Partial<DocProgress>) =>
    setProgress(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))

  const runPipeline = useCallback(async (docIds: { id: number; filename: string }[]) => {
    setRunning(true)
    setSummary(null)
    const initial: DocProgress[] = docIds.map(d => ({ ...d, status: 'waiting' }))
    setProgress(initial)

    let done = 0, skipped = 0, failed = 0

    for (const doc of docIds) {
      // Poll until extracted
      update(doc.id, { status: 'extracting' })
      try {
        await pollUntilExtracted(doc.id)
      } catch (e: any) {
        update(doc.id, { status: 'skipped', error: 'No text extracted — file may be corrupt or image-only' })
        skipped++
        continue
      }

      // Chunk
      update(doc.id, { status: 'chunking' })
      try {
        await api.post(`/documents/${doc.id}/chunk`)
      } catch (e: any) {
        update(doc.id, { status: 'failed', error: e.response?.data?.detail ?? 'Chunking failed' })
        failed++
        continue
      }

      // Embed
      update(doc.id, { status: 'embedding' })
      try {
        await api.post(`/documents/${doc.id}/embed`)
        update(doc.id, { status: 'done' })
        done++
      } catch (e: any) {
        update(doc.id, { status: 'failed', error: e.response?.data?.detail ?? 'Embedding failed' })
        failed++
      }
    }

    setSummary({ done, skipped, failed })
    setRunning(false)
  }, [])

  const retry = useCallback((failedDocs: DocProgress[]) => {
    const toRetry = failedDocs
      .filter(d => d.status === 'failed' || d.status === 'skipped')
      .map(d => ({ id: d.id, filename: d.filename }))
    if (toRetry.length > 0) runPipeline(toRetry)
  }, [runPipeline])

  return { progress, running, summary, runPipeline, retry }
}

async function pollUntilExtracted(docId: number, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000)
    const { data } = await api.get(`/documents/${docId}`)
    if (data.status === 'extracted') return
    if (data.status === 'failed') throw new Error(data.extraction_error ?? 'Extraction failed')
    if (data.status === 'embedded' || data.status === 'chunked') return
  }
  throw new Error('Extraction timed out')
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}