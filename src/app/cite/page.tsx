'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, XCircle, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { CitationFormatter } from '@/components/CitationFormatter'
import { crossrefGetWork } from '@/lib/api'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'

function CitePage() {
  const router = useRouter()
  const [doi, setDoi] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const urlDoi = p.get('doi')
    if (urlDoi) {
      setDoi(urlDoi)
      doLookup(urlDoi)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function doLookup(doiStr: string) {
    const trimmed = doiStr.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setArticle(null)
    try {
      const result = await crossrefGetWork(trimmed)
      setArticle(result)
      router.replace(`/cite?doi=${encodeURIComponent(trimmed)}`, { scroll: false })
    } catch {
      setError('No article metadata found for this DOI. Verify the DOI is correct and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    doLookup(doi)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--posi-text)' }}>Citation Generator</h1>
        <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>
          Enter a DOI to retrieve article metadata and generate a formatted citation in APA, MLA, Chicago, GB/T 7714, BibTeX, or RIS format.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--posi-text)' }}>
          Enter DOI
        </label>
        <div className="flex gap-3">
          <input
            value={doi}
            onChange={e => setDoi(e.target.value)}
            placeholder="e.g. 10.63802/afs.2024.008"
            className="flex-1 px-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
          />
          <button
            type="submit"
            disabled={loading || !doi.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ background: 'var(--posi-accent)' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
          >
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? 'Loading…' : 'Generate'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--posi-muted)' }}>
          Metadata retrieved from Crossref. PSG DOIs use prefix{' '}
          <span className="font-mono">10.63802</span>.
        </p>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white p-6 animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="h-4 rounded w-3/4 mb-3" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/2 mb-2" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/3" style={{ background: 'var(--posi-bg)' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-5" style={{ background: '#FBEAEC', border: '1px solid #F5C2CB' }}>
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#9B1C31' }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#9B1C31' }}>Not Found</p>
              <p className="text-xs" style={{ color: '#7f1d1d' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && article && (
        <div className="space-y-4">
          {/* Article summary card */}
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
            >
              Article Found
            </p>
            <h2 className="text-sm font-semibold leading-snug mb-2" style={{ color: 'var(--posi-text)' }}>
              {decodeHtml(article.title)}
            </h2>
            {article.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>
                {article.authors.slice(0, 5).map(a => a.display_name).join('; ')}
                {article.authors.length > 5 && (
                  <span style={{ color: 'var(--posi-soft)' }}> +{article.authors.length - 5} more</span>
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {article.journal_title && <span>{decodeHtml(article.journal_title)}</span>}
              {article.volume && <span>Vol. {article.volume}</span>}
              {article.issue && <span>No. {article.issue}</span>}
              <span>{article.publication_year}</span>
            </div>
            {article.doi && (
              <div className="mt-3">
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:underline"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  {article.doi} <ArrowSquareOut className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Citation formatter */}
          <CitationFormatter article={article} />
        </div>
      )}
    </div>
  )
}

export default function CiteGeneratorPage() {
  return <CitePage />
}
