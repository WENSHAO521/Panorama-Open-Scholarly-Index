'use client'

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, XCircle, ArrowSquareOut, Copy, Check, BookOpen, Globe } from '@phosphor-icons/react/dist/ssr'
import { CitationFormatter } from '@/components/CitationFormatter'
import { crossrefGetWork, openAlexGetArticle, fetchBookByIsbn } from '@/lib/api'
import type { BookInfo } from '@/lib/api'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'
import Link from 'next/link'

// ── Source detection ───────────────────────────────────────────────────────────

type InputKind = 'doi' | 'isbn' | 'url-doi' | 'url-manual'

function detectInput(raw: string): { kind: InputKind; payload: string } | null {
  const s = raw.trim()
  if (!s) return null

  // doi.org URL → extract DOI
  const doiOrgMatch = s.match(/doi\.org\/(10\.\d{4,}\/[^\s?&#]+)/)
  if (doiOrgMatch) return { kind: 'doi', payload: doiOrgMatch[1] }

  // Bare DOI
  if (/^10\.\d{4,}\/\S+/.test(s)) return { kind: 'doi', payload: s }

  // Any HTTP(S) URL
  if (/^https?:\/\//i.test(s)) {
    const doiInUrl = s.match(/10\.\d{4,}\/[^\s?&#]+/)
    if (doiInUrl) return { kind: 'url-doi', payload: doiInUrl[0] }
    return { kind: 'url-manual', payload: s }
  }

  // ISBN: 10 or 13 digits, optional hyphens/spaces
  const digits = s.replace(/[-\s]/g, '')
  if (/^\d{9}[\dX]$/i.test(digits) || /^\d{13}$/.test(digits)) {
    return { kind: 'isbn', payload: digits }
  }

  // Last-ditch: looks like a DOI fragment?
  if (/^10\./.test(s)) return { kind: 'doi', payload: s }

  return null
}

function domainFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    // Capitalize first letter and remove common TLDs for a cleaner site name
    return host.split('.')[0].replace(/^\w/, c => c.toUpperCase())
  } catch {
    return ''
  }
}

// ── PSG book citation ──────────────────────────────────────────────────────────

function invertName(n: string): string {
  const p = n.trim().split(/\s+/)
  return p.length >= 2 ? `${p[p.length - 1]}, ${p.slice(0, -1).join(' ')}` : n
}

function psgSurname(n: string): string {
  return n.trim().split(/\s+/).pop() ?? n
}

function buildPsgBook(book: BookInfo): { ref: string; intext: string } {
  const { authors, year, title, subtitle, place, publisher } = book
  let authorStr = ''
  if (authors.length === 1) authorStr = invertName(authors[0])
  else if (authors.length === 2) authorStr = `${invertName(authors[0])}, and ${authors[1]}`
  else if (authors.length > 2)
    authorStr = `${invertName(authors[0])}, ${authors.slice(1, -1).join(', ')}, and ${authors[authors.length - 1]}`

  const fullTitle = subtitle ? `${title}: ${subtitle}` : title
  let ref = authorStr ? `${authorStr}. ` : ''
  ref += `${year ?? 'n.d.'}. ${fullTitle}.`
  if (place && publisher) ref += ` ${place}: ${publisher}.`
  else if (publisher) ref += ` ${publisher}.`

  const surname = authors.length > 0 ? psgSurname(authors[0]) : ''
  const intext = `(${surname} ${year ?? 'n.d.'})`
  return { ref, intext }
}

// ── PSG webpage citation ───────────────────────────────────────────────────────

interface WebpageForm {
  author: string        // "Last, First" for person or "Organization Name" for org
  is_org: boolean
  year: string
  title: string
  site_name: string
  access_date: string
  url: string
}

function buildPsgWebpage(f: WebpageForm): { ref: string; intext: string } {
  let ref = `${f.author}. ${f.year || 'n.d.'}. `
  ref += `“${f.title}.”`
  if (f.site_name) ref += ` ${f.site_name}.`
  if (f.access_date) ref += ` Accessed ${f.access_date}.`
  ref += ` ${f.url}`  // No trailing period after URL

  const intextName = f.is_org ? f.author : psgSurname(f.author.split(',')[0])
  const intext = `(${intextName} ${f.year || 'n.d.'})`
  return { ref, intext }
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── PSG citation card (for books and webpages) ─────────────────────────────────

function PsgCitationCard({ ref: refText, intext, label }: { ref: string; intext: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try { await navigator.clipboard.writeText(refText) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--posi-border)', background: '#fef2f4' }}
      >
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: '#c41e3a' }}>
          PSG Format — {label}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[0.06em] transition-colors"
          style={{
            border: '1px solid var(--posi-border)',
            color: copied ? '#1F7A4D' : 'var(--posi-muted)',
            background: copied ? '#E8F5EE' : '#fff',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-5">
        <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-body)', color: 'var(--posi-text)' }}>
          {refText}
        </p>
      </div>
      <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-3 mb-1" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
          In-text Citation
        </p>
        <p className="text-sm font-mono" style={{ color: 'var(--posi-text)' }}>{intext}</p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Source = 'crossref' | 'openalex'

type ResultState =
  | { type: 'article'; article: Article; source: Source }
  | { type: 'book'; book: BookInfo }
  | { type: 'webpage-form'; url: string }
  | { type: 'webpage-result'; data: WebpageForm }

function CitePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ResultState | null>(null)
  const lookupCount = useRef(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Webpage form state
  const [wpForm, setWpForm] = useState<WebpageForm>({
    author: '',
    is_org: false,
    year: String(new Date().getFullYear()),
    title: '',
    site_name: '',
    access_date: todayFormatted(),
    url: '',
  })

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const urlDoi = p.get('doi')
    if (urlDoi) {
      setInput(urlDoi)
      doLookup(urlDoi)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function doLookup(raw: string) {
    const detected = detectInput(raw)
    if (!detected) {
      setError('Enter a DOI (10.xxx/…), ISBN (9780…), or a URL.')
      return
    }

    const myId = ++lookupCount.current
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      if (detected.kind === 'doi' || detected.kind === 'url-doi') {
        const doi = detected.payload
        const [cr, oa] = await Promise.all([
          crossrefGetWork(doi).catch(() => null),
          openAlexGetArticle(doi).catch(() => null),
        ])
        if (myId !== lookupCount.current) return

        let article: Article | null = null
        let src: Source = 'crossref'
        if (cr) {
          article = { ...cr }
          if (oa) {
            if (!article.abstract && oa.abstract) article = { ...article, abstract: oa.abstract }
            if (article.keywords.length === 0 && oa.keywords.length > 0) article = { ...article, keywords: oa.keywords }
            if (oa.cited_by_count > article.cited_by_count) article = { ...article, cited_by_count: oa.cited_by_count }
            if (oa.openalex_work_id) article = { ...article, openalex_work_id: oa.openalex_work_id }
          }
        } else if (oa) {
          article = oa
          src = 'openalex'
        }

        if (!article) {
          setError('No article metadata found for this DOI in Crossref or OpenAlex.')
          return
        }
        setResult({ type: 'article', article, source: src })
        router.replace(`/cite?doi=${encodeURIComponent(doi)}`, { scroll: false })

      } else if (detected.kind === 'isbn') {
        const book = await fetchBookByIsbn(detected.payload)
        if (myId !== lookupCount.current) return
        if (!book || !book.title) {
          setError('No book found for this ISBN. Try Open Library or Google Books to verify the number.')
          return
        }
        setResult({ type: 'book', book })

      } else {
        // url-manual: show the webpage form
        if (myId !== lookupCount.current) return
        const url = detected.payload
        const siteName = domainFromUrl(url)
        setWpForm(prev => ({
          ...prev,
          url,
          site_name: siteName,
          author: '',
          title: '',
          year: String(new Date().getFullYear()),
          access_date: todayFormatted(),
        }))
        setResult({ type: 'webpage-form', url })
      }
    } catch {
      if (myId !== lookupCount.current) return
      setError('Lookup failed. Check the format and try again.')
    } finally {
      if (myId === lookupCount.current) setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    doLookup(input)
  }

  function handleWpField(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setWpForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  function handleWpGenerate(e: FormEvent) {
    e.preventDefault()
    setResult({ type: 'webpage-result', data: { ...wpForm } })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--posi-text)' }}>Citation Generator</h1>
        <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>
          Enter a DOI, ISBN, or URL — generates PSG Format and other standard citation styles.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--posi-text)' }}>
          DOI, ISBN, or URL
        </label>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g.  10.63802/afs.2024.008  ·  9780679720201  ·  https://example.com/paper"
            className="flex-1 px-4 py-2.5 focus:outline-none transition-colors"
            style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', fontSize: '14px' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ background: 'var(--posi-accent)' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
          >
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? 'Loading…' : 'Generate'}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
          <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
            <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>DOI</span> — any Crossref DOI, e.g. <span className="font-mono">10.63802/afs.2024.008</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
            <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>ISBN</span> — 10 or 13 digits, e.g. <span className="font-mono">9780374528379</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
            <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>URL</span> — any web address, e.g. <span className="font-mono">https://example.com/page</span>
          </p>
        </div>
      </form>

      {/* Loading */}
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

      {/* ── Article result ── */}
      {!loading && result?.type === 'article' && (
        <div className="space-y-4">
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>
                Article Found
              </p>
              <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-[0.1em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: result.source === 'openalex' ? '#E8F5EE' : '#f5f5f5',
                  color: result.source === 'openalex' ? '#1F7A4D' : '#666',
                  border: `1px solid ${result.source === 'openalex' ? '#bbdece' : '#ddd'}`,
                }}>
                via {result.source === 'openalex' ? 'OpenAlex' : 'Crossref'}
              </span>
            </div>
            <h2 className="text-sm font-semibold leading-snug mb-2" style={{ color: 'var(--posi-text)' }}>
              {decodeHtml(result.article.title)}
            </h2>
            {result.article.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>
                {result.article.authors.slice(0, 5).map(a => a.display_name).join('; ')}
                {result.article.authors.length > 5 && <span style={{ color: 'var(--posi-soft)' }}> +{result.article.authors.length - 5} more</span>}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {result.article.journal_title && <span>{decodeHtml(result.article.journal_title)}</span>}
              {result.article.volume && <span>Vol. {result.article.volume}</span>}
              {result.article.issue && <span>No. {result.article.issue}</span>}
              <span>{result.article.publication_year}</span>
            </div>
            {result.article.doi && (
              <div className="mt-3">
                <a href={`https://doi.org/${result.article.doi}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--posi-accent)' }}>
                  {result.article.doi} <ArrowSquareOut className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          <CitationFormatter article={result.article} />
        </div>
      )}

      {/* ── Book result ── */}
      {!loading && result?.type === 'book' && (() => {
        const { ref, intext } = buildPsgBook(result.book)
        return (
          <div className="space-y-4">
            <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4" style={{ color: 'var(--posi-accent)' }} />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>Book Found</p>
                <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-mono)', background: '#f5f5f5', color: '#666', border: '1px solid #ddd' }}>
                  via Open Library
                </span>
              </div>
              <h2 className="text-sm font-semibold leading-snug mb-1" style={{ color: 'var(--posi-text)' }}>
                {result.book.title}{result.book.subtitle && <span style={{ color: 'var(--posi-muted)' }}>: {result.book.subtitle}</span>}
              </h2>
              {result.book.authors.length > 0 && (
                <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>{result.book.authors.join('; ')}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
                {result.book.year && <span>{result.book.year}</span>}
                {result.book.publisher && <span>{result.book.publisher}</span>}
                {result.book.place && <span>{result.book.place}</span>}
                <span className="font-mono">ISBN {result.book.isbn}</span>
              </div>
            </div>
            <PsgCitationCard ref={ref} intext={intext} label="Book" />
            <p className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>
              Book title should be italicized in the final document. APA, MLA, and Chicago formats for books are available in your reference manager (Zotero, Mendeley) after importing via ISBN.
            </p>
          </div>
        )
      })()}

      {/* ── Webpage form ── */}
      {!loading && result?.type === 'webpage-form' && (
        <div className="space-y-4">
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4" style={{ color: 'var(--posi-accent)' }} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>
                Webpage Citation
              </p>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>
              No DOI found in this URL. Fill in the details below to generate a PSG webpage citation.
            </p>
            <form onSubmit={handleWpGenerate} className="space-y-3">
              {/* URL (pre-filled, read-only) */}
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>URL</label>
                <input
                  value={wpForm.url}
                  readOnly
                  className="w-full px-3 py-2 text-xs font-mono"
                  style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)', background: 'var(--posi-bg)' }}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Author / Organization */}
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>
                    Author or Organization <span style={{ color: '#c41e3a' }}>*</span>
                  </label>
                  <input
                    name="author"
                    value={wpForm.author}
                    onChange={handleWpField}
                    placeholder='e.g. "Smith, John" or "WHO"'
                    required
                    className="w-full px-3 py-2 text-xs focus:outline-none"
                    style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_org"
                      checked={wpForm.is_org}
                      onChange={handleWpField}
                      className="w-3 h-3"
                    />
                    <span className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>Organization (use full name in in-text citation)</span>
                  </label>
                </div>

                {/* Page title */}
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>
                    Page Title <span style={{ color: '#c41e3a' }}>*</span>
                  </label>
                  <input
                    name="title"
                    value={wpForm.title}
                    onChange={handleWpField}
                    placeholder="e.g. Publication Ethics"
                    required
                    className="w-full px-3 py-2 text-xs focus:outline-none"
                    style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
                  />
                </div>

                {/* Website name */}
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>Website / Publisher Name</label>
                  <input
                    name="site_name"
                    value={wpForm.site_name}
                    onChange={handleWpField}
                    placeholder="e.g. Panorama Scholarly Group"
                    className="w-full px-3 py-2 text-xs focus:outline-none"
                    style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>Year</label>
                  <input
                    name="year"
                    value={wpForm.year}
                    onChange={handleWpField}
                    placeholder="2026"
                    className="w-full px-3 py-2 text-xs focus:outline-none"
                    style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
                  />
                </div>

                {/* Access date */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>Access Date</label>
                  <input
                    name="access_date"
                    value={wpForm.access_date}
                    onChange={handleWpField}
                    placeholder="June 24, 2026"
                    className="w-full px-3 py-2 text-xs focus:outline-none"
                    style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!wpForm.author.trim() || !wpForm.title.trim()}
                className="w-full py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: '#c41e3a' }}
              >
                Generate PSG Citation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Webpage citation result ── */}
      {!loading && result?.type === 'webpage-result' && (() => {
        const { ref, intext } = buildPsgWebpage(result.data)
        return (
          <div className="space-y-4">
            <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" style={{ color: 'var(--posi-muted)' }} />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
                  Webpage
                </p>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-text)' }}>{result.data.title}</p>
              <p className="text-xs mb-1" style={{ color: 'var(--posi-muted)' }}>{result.data.author}</p>
              <a href={result.data.url} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 hover:underline break-all" style={{ color: 'var(--posi-accent)' }}>
                {result.data.url} <ArrowSquareOut className="h-3 w-3 shrink-0" />
              </a>
            </div>
            <PsgCitationCard ref={ref} intext={intext} label="Webpage" />
            <button
              onClick={() => setResult({ type: 'webpage-form', url: result.data.url })}
              className="text-xs hover:underline"
              style={{ color: 'var(--posi-accent)' }}
            >
              ← Edit details
            </button>
          </div>
        )
      })()}

      {/* PSG Format link */}
      <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/psg-format" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
          PSG Format specification →
        </Link>
      </p>
    </div>
  )
}

export default function CiteGeneratorPage() {
  return <CitePage />
}
