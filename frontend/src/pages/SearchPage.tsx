import { useState } from 'react'
import { Search, FileText, Loader2 } from 'lucide-react'
import api from '../services/api'
import './searchPage.css'

interface SearchResult {
  score: number
  semantic_score?: number
  bm25_score?: number
  combined_score?: number
  confidence_score?: number
  search_type: 'semantic' | 'bm25' | 'hybrid'
  qdrant_point_id?: string

  doc_name?: string
  doc_id?: number
  path?: string
  chunk_id: number
  chunk_index: number
  page?: number | null

  document_id?: number
  page_number?: number | null
  text_preview: string
  department: string | null
  access_level: string
  filename?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [normalizedQuery, setNormalizedQuery] = useState('')
  const [hasAnswer, setHasAnswer] = useState(true)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const res = await api.post('/search', { query, limit: 5 })
      setResults(res.data.results || [])
      setNormalizedQuery(res.data.normalized_query || '')
      setHasAnswer(res.data.has_answer ?? true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Search failed')
      setResults([])
      setHasAnswer(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-page">
      <h1 className="search-title">Search Documents</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-form-row">
          <div className="search-input-wrap">
            <Search
              size={18}
              // Webhint no-inline-styles: keep minimal class-based styling
              className="search-input-icon"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your documents..."
              className="search-input"
            />
          </div>

          <button type="submit" disabled={loading || !query.trim()} className="search-submit">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Search
          </button>
        </div>
      </form>

      {/* Error */}
      {error && <div className="search-error">{error}</div>}

      {/* Results */}
      {searched && !loading && (
        <div className="search-results-wrap">
          {!hasAnswer ? (
            <div className="no-answer">No confident answer found. Try rephrasing your question.</div>
          ) : results.length === 0 ? (
            <div className="no-results">No results found</div>
          ) : (
            <>
              <div className="search-summary">
                Found {results.length} results for "{query}"
                {normalizedQuery && normalizedQuery !== query && (
                  <span className="search-normalized">(normalized: "{normalizedQuery}")</span>
                )}
              </div>

              <div className="search-cards">
                {results.map((r, i) => (
                  <div key={r.chunk_id || i} className="search-card">
                    <div className="search-card-header">
                      <div className="search-card-title-row">
                        <FileText size={16} className="search-icon" />
                        <span className="search-card-docname">{r.doc_name || r.filename || `Document ${r.doc_id ?? ''}`}</span>

                        {r.search_type && (
                          <span
                            className={
                              r.search_type === 'semantic'
                                ? 'search-tag search-tag--semantic'
                                : r.search_type === 'bm25'
                                  ? 'search-tag search-tag--bm25'
                                  : 'search-tag'
                            }
                          >
                            {r.search_type}
                          </span>
                        )}
                      </div>

                      <span className="search-score-badge" title="Confidence score">
                        {typeof r.confidence_score === 'number'
                          ? `${(r.confidence_score * 100).toFixed(1)}% confidence`
                          : r.combined_score
                            ? `${(r.combined_score * 100).toFixed(1)}%`
                            : r.search_type === 'semantic'
                              ? `${(r.semantic_score ? r.semantic_score * 100 : 0).toFixed(1)}%`
                              : `BM25: ${r.bm25_score?.toFixed(1) || 0}`}
                      </span>
                    </div>

                    <div className="search-meta-row">
                      {typeof (r.page ?? r.page_number) === 'number' && <div className="search-meta-item">Page {r.page ?? r.page_number}</div>}
                      {typeof r.chunk_id === 'number' && <div className="search-meta-item">Chunk {r.chunk_id}</div>}
                      {typeof r.doc_id === 'number' && <div className="search-meta-item">Doc ID {r.doc_id}</div>}

                      {r.path && (
                        <div className="search-source-path" title={r.path}>
                          Source: {r.path}
                        </div>
                      )}
                    </div>

                    <div className="search-preview">{r.text_preview}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && <div className="search-initial">Enter a query to search your documents</div>}
    </div>
  )
}
