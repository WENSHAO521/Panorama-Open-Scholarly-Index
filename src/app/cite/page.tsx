'use client'

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlass, XCircle, ArrowSquareOut, Copy, Check,
  BookOpen, Globe, PencilSimple, Plus, Trash, Newspaper, UploadSimple,
} from '@phosphor-icons/react/dist/ssr'
import { CitationFormatter } from '@/components/CitationFormatter'
import { BatchRun } from '@/components/BatchConverter'
import { parseInput, MAX_BATCH } from '@/lib/cite-parse'
import type { RefEntry } from '@/lib/cite-parse'
import { crossrefGetWork, crossrefSearchMany, openAlexGetArticle, fetchBookByIsbn } from '@/lib/cite-sources'
import type { BookInfo } from '@/lib/cite-sources'
import { decodeHtml } from '@/lib/utils'
import type { Article } from '@/lib/types'
import Link from 'next/link'
import { PageHeader } from '@/components/db'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ManualAuthor { first: string; last: string }
type ManualSourceType = 'article' | 'book' | 'website'

interface ManualArticleForm {
  authors: ManualAuthor[]
  year: string; title: string; journal: string
  volume: string; issue: string; pages: string; doi: string
}

interface ManualBookForm {
  authors: ManualAuthor[]
  year: string; title: string; subtitle: string
  edition: string; publisher: string; place: string; isbn: string
}

interface ManualWebsiteForm {
  authorName: string; isOrg: boolean
  year: string; monthDay: string
  title: string; siteName: string
  accessDate: string; url: string
}

interface CitPair { html: string; plain: string; intext: string }
interface AllCitations { psg: CitPair; apa: CitPair; mla: CitPair; chicago: CitPair }

type InputKind = 'doi' | 'isbn' | 'url-doi' | 'url-manual' | 'search'
type Source = 'crossref' | 'openalex'

type AutoResult =
  | { type: 'article'; article: Article; source: Source }
  | { type: 'book'; citations: AllCitations; book: BookInfo }
  | { type: 'search'; query: string; results: Article[] }
  | { type: 'webpage-form'; url: string }
  | { type: 'webpage-result'; citations: AllCitations; title: string }

// ── Author formatting helpers ─────────────────────────────────────────────────

const EMPTY_AUTHOR: ManualAuthor = { first: '', last: '' }

function initials(first: string): string {
  return first.split(/\s+/).filter(Boolean).map(n => n[0].toUpperCase() + '.').join(' ')
}

/** Adds a closing full stop unless the text already ends with one (initials). */
function endStop(t: string): string {
  return t.endsWith('.') ? t : `${t}.`
}

function apaFmt({ first, last }: ManualAuthor): string {
  if (!last && !first) return ''
  if (!last) return initials(first)
  if (!first) return last
  return `${last}, ${initials(first)}`
}

function apaAuthors(authors: ManualAuthor[]): string {
  const v = authors.filter(a => a.last || a.first)
  if (!v.length) return ''
  if (v.length === 1) return apaFmt(v[0])
  if (v.length === 2) return `${apaFmt(v[0])}, & ${apaFmt(v[1])}`
  if (v.length <= 20) return v.slice(0, -1).map(apaFmt).join(', ') + ', & ' + apaFmt(v[v.length - 1])
  return v.slice(0, 19).map(apaFmt).join(', ') + ', . . . ' + apaFmt(v[v.length - 1])
}

function mlaFmt({ first, last }: ManualAuthor, isFirst: boolean): string {
  if (!last && !first) return ''
  if (!last) return first
  if (!first) return last
  return isFirst ? `${last}, ${first}` : `${first} ${last}`
}

function mlaAuthors(authors: ManualAuthor[]): string {
  const v = authors.filter(a => a.last || a.first)
  if (!v.length) return ''
  if (v.length === 1) return mlaFmt(v[0], true)
  if (v.length === 2) return `${mlaFmt(v[0], true)}, and ${mlaFmt(v[1], false)}`
  return `${mlaFmt(v[0], true)}, et al.`
}

function chicagoAuthors(authors: ManualAuthor[]): string {
  const v = authors.filter(a => a.last || a.first)
  if (!v.length) return ''
  if (v.length === 1) return mlaFmt(v[0], true)
  if (v.length === 2) return `${mlaFmt(v[0], true)}, and ${mlaFmt(v[1], false)}`
  if (v.length === 3) return `${mlaFmt(v[0], true)}, ${mlaFmt(v[1], false)}, and ${mlaFmt(v[2], false)}`
  return `${mlaFmt(v[0], true)}, et al.`
}

function apaIntext(authors: ManualAuthor[], year: string): string {
  const v = authors.filter(a => a.last || a.first)
  const y = year || 'n.d.'
  if (!v.length) return `(${y})`
  const nm = v.length === 1 ? v[0].last : v.length === 2
    ? `${v[0].last} & ${v[1].last}` : `${v[0].last} et al.`
  return `(${nm}, ${y})`
}

function chicagoIntext(authors: ManualAuthor[], year: string): string {
  const v = authors.filter(a => a.last || a.first)
  const y = year || 'n.d.'
  if (!v.length) return `(${y})`
  const nm = v.length === 1 ? v[0].last : v.length === 2
    ? `${v[0].last} and ${v[1].last}` : `${v[0].last} et al.`
  return `(${nm} ${y})`
}

function mlaIntext(authors: ManualAuthor[], pages: string): string {
  const v = authors.filter(a => a.last || a.first)
  const pg = pages ? fmtPages(pages).split('-')[0] : ''
  if (!v.length) return pg ? `(${pg})` : ''
  const nm = v.length === 1 ? v[0].last : v.length === 2
    ? `${v[0].last} and ${v[1].last}` : `${v[0].last} et al.`
  return pg ? `(${nm} ${pg})` : `(${nm})`
}

function fmtPages(p: string): string {
  return p.trim().replace(/\s*[---]+\s*/, '-')
}

function cp(html: string, intext: string): CitPair {
  return { html, plain: html.replace(/<\/?em>/g, ''), intext }
}

function parseAuthorStr(s: string): ManualAuthor {
  const t = s.trim()
  if (t.includes(',')) {
    const i = t.indexOf(',')
    return { last: t.slice(0, i).trim(), first: t.slice(i + 1).trim() }
  }
  const parts = t.split(/\s+/)
  if (parts.length === 1) return { last: t, first: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}

// ── PSG builders ──────────────────────────────────────────────────────────────

function buildPsgArticle(f: ManualArticleForm): CitPair {
  const auth = chicagoAuthors(f.authors)
  const y = f.year || 'n.d.'
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. "${f.title || 'Untitled'}." `
  h += `<em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += ` ${f.volume}`
  if (f.issue) h += `(${f.issue})`
  if (pg) h += `: ${pg}`
  h += '.'
  if (f.doi) h += ` doi:${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`
  return cp(h, chicagoIntext(f.authors, f.year))
}

function buildPsgBook(f: ManualBookForm): CitPair {
  const auth = chicagoAuthors(f.authors)
  const y = f.year || 'n.d.'
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. <em>${ft || 'Untitled'}</em>.`
  if (f.edition) h += ` ${f.edition} ed.`
  if (f.place && f.publisher) h += ` ${f.place}: ${f.publisher}.`
  else if (f.publisher) h += ` ${f.publisher}.`
  return cp(h, chicagoIntext(f.authors, f.year))
}

function buildPsgWebsite(f: ManualWebsiteForm): CitPair {
  const auth = f.authorName || 'Author'
  const y = f.year || 'n.d.'
  let h = `${auth}. ${y}. "${f.title || 'Untitled'}."`
  if (f.siteName) h += ` ${f.siteName}.`
  if (f.accessDate) h += ` Accessed ${f.accessDate}.`
  if (f.url) h += ` ${f.url}`
  const nm = f.isOrg ? auth : auth.split(',')[0].trim()
  return cp(h, `(${nm} ${y})`)
}

// ── APA 7th builders ──────────────────────────────────────────────────────────

function buildApaArticle(f: ManualArticleForm): CitPair {
  const auth = apaAuthors(f.authors)
  const y = f.year || 'n.d.'
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `(${y}). ${f.title || 'Untitled'}. `
  h += `<em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += `, <em>${f.volume}</em>`
  if (f.issue) h += `(${f.issue})`
  if (pg) h += `, ${pg}`
  h += '.'
  if (f.doi) h += ` https://doi.org/${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`
  return cp(h, apaIntext(f.authors, f.year))
}

function buildApaBook(f: ManualBookForm): CitPair {
  const auth = apaAuthors(f.authors)
  const y = f.year || 'n.d.'
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `(${y}). <em>${ft || 'Untitled'}</em>`
  if (f.edition) h += ` (${f.edition} ed.)`
  h += '.'
  if (f.publisher) h += ` ${f.publisher}.`
  return cp(h, apaIntext(f.authors, f.year))
}

function buildApaWebsite(f: ManualWebsiteForm): CitPair {
  let authStr = f.authorName
  if (!f.isOrg && f.authorName.includes(',')) {
    const [last, ...rest] = f.authorName.split(',')
    authStr = apaFmt({ last: last.trim(), first: rest.join(',').trim() })
  }
  const dateStr = f.monthDay ? `${f.year}, ${f.monthDay}` : f.year || 'n.d.'
  let h = authStr ? `${authStr}. ` : ''
  h += `(${dateStr}). ${f.title || 'Untitled'}.`
  if (f.siteName) h += ` <em>${f.siteName}</em>.`
  if (f.url) h += ` ${f.url}`
  const nm = f.isOrg ? f.authorName : f.authorName.split(',')[0].trim()
  return cp(h, `(${nm || 'Author'}, ${f.year || 'n.d.'})`)
}

// ── MLA 9th builders ──────────────────────────────────────────────────────────

function buildMlaArticle(f: ManualArticleForm): CitPair {
  const auth = mlaAuthors(f.authors)
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `"${f.title || 'Untitled'}." <em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += `, vol. ${f.volume}`
  if (f.issue) h += `, no. ${f.issue}`
  if (f.year) h += `, ${f.year}`
  if (pg) h += `, pp. ${pg}`
  const doi = f.doi.replace(/^https?:\/\/doi\.org\//i, '')
  if (doi) h += `, doi.org/${doi}`
  h += '.'
  return cp(h, mlaIntext(f.authors, f.pages))
}

function buildMlaBook(f: ManualBookForm): CitPair {
  const auth = mlaAuthors(f.authors)
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `<em>${ft || 'Untitled'}</em>.`
  if (f.edition) h += ` ${f.edition} ed.,`
  if (f.publisher) h += ` ${f.publisher},`
  if (f.year) h += ` ${f.year}`
  h += '.'
  return cp(h, mlaIntext(f.authors, ''))
}

function buildMlaWebsite(f: ManualWebsiteForm): CitPair {
  const auth = f.isOrg ? f.authorName : (() => {
    if (!f.authorName.includes(',')) return f.authorName
    const [last, ...rest] = f.authorName.split(',')
    return `${last.trim()}, ${rest.join(',').trim()}`
  })()
  let h = auth ? `${endStop(auth)} ` : ''
  h += `"${f.title || 'Untitled'}." `
  if (f.siteName) h += `<em>${f.siteName}</em>, `
  const dateStr = f.monthDay ? `${f.monthDay} ${f.year}` : f.year || 'n.d.'
  h += `${dateStr},`
  if (f.url) h += ` ${f.url}`
  h += '.'
  const nm = f.isOrg ? f.authorName : f.authorName.split(',')[0].trim()
  return cp(h, `(${nm || 'Author'})`)
}

// ── Chicago 17th (author-date) builders ───────────────────────────────────────

function buildChicagoArticle(f: ManualArticleForm): CitPair {
  const auth = chicagoAuthors(f.authors)
  const y = f.year || 'n.d.'
  const pg = f.pages ? fmtPages(f.pages) : ''
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. "${f.title || 'Untitled'}." <em>${f.journal || 'Journal'}</em>`
  if (f.volume) h += ` ${f.volume}`
  if (f.issue) h += ` (${f.issue})`
  if (pg) h += `: ${pg}`
  h += '.'
  if (f.doi) h += ` https://doi.org/${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`
  return cp(h, chicagoIntext(f.authors, f.year))
}

function buildChicagoBook(f: ManualBookForm): CitPair {
  const auth = chicagoAuthors(f.authors)
  const y = f.year || 'n.d.'
  const ft = f.subtitle ? `${f.title}: ${f.subtitle}` : f.title
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. <em>${ft || 'Untitled'}</em>.`
  if (f.edition) h += ` ${f.edition} ed.`
  if (f.place && f.publisher) h += ` ${f.place}: ${f.publisher}.`
  else if (f.publisher) h += ` ${f.publisher}.`
  return cp(h, chicagoIntext(f.authors, f.year))
}

function buildChicagoWebsite(f: ManualWebsiteForm): CitPair {
  const auth = f.authorName
  const y = f.year || 'n.d.'
  let h = auth ? `${endStop(auth)} ` : ''
  h += `${y}. "${f.title || 'Untitled'}."`
  if (f.siteName) h += ` ${f.siteName}.`
  if (f.accessDate) h += ` Accessed ${f.accessDate}.`
  if (f.url) h += ` ${f.url}.`
  const nm = f.isOrg ? auth : auth.split(',')[0].trim()
  return cp(h, `(${nm || 'Author'} ${y})`)
}

// ── All-format builders ───────────────────────────────────────────────────────

function buildAllArticle(f: ManualArticleForm): AllCitations {
  return { psg: buildPsgArticle(f), apa: buildApaArticle(f), mla: buildMlaArticle(f), chicago: buildChicagoArticle(f) }
}
function buildAllBook(f: ManualBookForm): AllCitations {
  return { psg: buildPsgBook(f), apa: buildApaBook(f), mla: buildMlaBook(f), chicago: buildChicagoBook(f) }
}
function buildAllWebsite(f: ManualWebsiteForm): AllCitations {
  return { psg: buildPsgWebsite(f), apa: buildApaWebsite(f), mla: buildMlaWebsite(f), chicago: buildChicagoWebsite(f) }
}

function bookInfoToForm(b: BookInfo): ManualBookForm {
  return {
    authors: b.authors.map(parseAuthorStr),
    year: b.year ?? '',
    title: b.title,
    subtitle: b.subtitle ?? '',
    edition: '',
    publisher: b.publisher ?? '',
    place: b.place ?? '',
    isbn: b.isbn,
  }
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function detectInput(raw: string): { kind: InputKind; payload: string } | null {
  const s = raw.trim()
  if (!s) return null
  const doiOrgMatch = s.match(/doi\.org\/(10\.\d{4,}\/[^\s?&#]+)/)
  if (doiOrgMatch) return { kind: 'doi', payload: doiOrgMatch[1] }
  if (/^10\.\d{4,}\/\S+/.test(s)) return { kind: 'doi', payload: s }
  if (/^https?:\/\//i.test(s)) {
    const doiInUrl = s.match(/10\.\d{4,}\/[^\s?&#]+/)
    if (doiInUrl) return { kind: 'url-doi', payload: doiInUrl[0] }
    return { kind: 'url-manual', payload: s }
  }
  const digits = s.replace(/[-\s]/g, '')
  if (/^\d{9}[\dX]$/i.test(digits) || /^\d{13}$/.test(digits)) return { kind: 'isbn', payload: digits }
  if (/^10\./.test(s)) return { kind: 'doi', payload: s }
  return s.length >= 6 ? { kind: 'search', payload: s } : null
}

function domainFromUrl(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').split('.')[0].replace(/^\w/, c => c.toUpperCase()) }
  catch { return '' }
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── UI sub-components ─────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
        setCopied(true); setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[0.06em] transition-colors"
      style={{
        border: '1px solid var(--posi-border)', fontFamily: 'var(--font-mono)',
        color: copied ? 'var(--verified)' : 'var(--posi-muted)',
        background: copied ? 'var(--verified-soft)' : '#fff',
      }}
    >
      {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const FMT_LABELS: Record<string, string> = { psg: 'PSG Format', apa: 'APA 7th', mla: 'MLA 9th', chicago: 'Chicago 17th' }
const FMT_COLORS: Record<string, [string, string]> = {
  psg: ['#fef2f4', 'var(--teal)'],
  apa: ['var(--info-soft)', 'var(--info)'],
  mla: ['var(--verified-soft)', 'var(--verified)'],
  chicago: ['var(--check-soft)', 'var(--check)'],
}

function CitCard({ fmt, pair }: { fmt: string; pair: CitPair }) {
  const [bg, color] = FMT_COLORS[fmt] ?? ['var(--surface-2)', '#333']
  return (
    <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border)', background: bg }}>
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color }}>
          {FMT_LABELS[fmt] ?? fmt}
        </span>
        <CopyBtn text={pair.plain} />
      </div>
      <div className="p-5">
        <p
          className="text-[13px] leading-relaxed text-justify"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--posi-text)' }}
          dangerouslySetInnerHTML={{ __html: pair.html }}
        />
      </div>
      <div className="px-5 pb-4 pt-3" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
          In-text
        </p>
        <p className="text-sm font-mono" style={{ color: 'var(--posi-text)' }}>{pair.intext}</p>
      </div>
    </div>
  )
}

function MultiFormatCards({ citations }: { citations: AllCitations }) {
  return (
    <div className="space-y-3">
      {(['psg', 'apa', 'mla', 'chicago'] as const).map(fmt => (
        <CitCard key={fmt} fmt={fmt} pair={citations[fmt]} />
      ))}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 text-xs focus:outline-none"
const inputStyle = { border: '1px solid var(--posi-border)', color: 'var(--posi-text)' } as React.CSSProperties
function onFocusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'var(--posi-primary)'
}
function onBlurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'var(--posi-border)'
}

function FL({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--posi-muted)' }}>{children}</label>
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} style={inputStyle} onFocus={onFocusBorder} onBlur={onBlurBorder} />
}

function AuthorList({ authors, onChange }: { authors: ManualAuthor[]; onChange: (a: ManualAuthor[]) => void }) {
  const update = (i: number, f: keyof ManualAuthor, v: string) =>
    onChange(authors.map((a, idx) => idx === i ? { ...a, [f]: v } : a))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FL>Authors</FL>
        <button type="button" onClick={() => onChange([...authors, { ...EMPTY_AUTHOR }])}
          className="flex items-center gap-1 text-[10px] px-2 py-1"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      {authors.map((a, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <FInput value={a.first} onChange={e => update(i, 'first', e.target.value)} placeholder="Given name(s)" className={inputCls} />
          <div className="flex gap-2 items-center">
            <FInput value={a.last} onChange={e => update(i, 'last', e.target.value)} placeholder="Family name" className={inputCls} />
            {authors.length > 1 && (
              <button type="button" onClick={() => onChange(authors.filter((_, idx) => idx !== i))}
                className="p-1.5 hover:opacity-70 shrink-0" style={{ color: 'var(--posi-muted)' }}>
                <Trash className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function GenBtn({ disabled }: { disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled}
      className="w-full py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
      style={{ background: 'var(--teal)' }}>
      Generate Citations
    </button>
  )
}

// ── Manual entry forms ────────────────────────────────────────────────────────

function ArticleForm({
  form, setForm, onSubmit,
}: { form: ManualArticleForm; setForm: (f: ManualArticleForm) => void; onSubmit: FormEvent<HTMLFormElement> extends never ? never : (e: FormEvent<HTMLFormElement>) => void }) {
  const s = (k: keyof ManualArticleForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthorList authors={form.authors} onChange={authors => setForm({ ...form, authors })} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <FL>Article Title <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.title} onChange={s('title')} placeholder="Title of the article" required />
        </div>
        <div>
          <FL>Journal Name <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.journal} onChange={s('journal')} placeholder="Name of the journal" required />
        </div>
        <div>
          <FL>Year</FL>
          <FInput value={form.year} onChange={s('year')} placeholder="2024" />
        </div>
        <div>
          <FL>Volume</FL>
          <FInput value={form.volume} onChange={s('volume')} placeholder="12" />
        </div>
        <div>
          <FL>Issue</FL>
          <FInput value={form.issue} onChange={s('issue')} placeholder="3" />
        </div>
        <div>
          <FL>Pages</FL>
          <FInput value={form.pages} onChange={s('pages')} placeholder="45-67" />
        </div>
        <div>
          <FL>DOI (optional)</FL>
          <FInput value={form.doi} onChange={s('doi')} placeholder="10.xxxx/xxxxx" />
        </div>
      </div>
      <GenBtn disabled={!form.title.trim() || !form.journal.trim()} />
    </form>
  )
}

function BookForm({
  form, setForm, onSubmit,
}: { form: ManualBookForm; setForm: (f: ManualBookForm) => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const s = (k: keyof ManualBookForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthorList authors={form.authors} onChange={authors => setForm({ ...form, authors })} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <FL>Book Title <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.title} onChange={s('title')} placeholder="Title of the book" required />
        </div>
        <div>
          <FL>Subtitle</FL>
          <FInput value={form.subtitle} onChange={s('subtitle')} placeholder="Subtitle (if any)" />
        </div>
        <div>
          <FL>Year</FL>
          <FInput value={form.year} onChange={s('year')} placeholder="2024" />
        </div>
        <div>
          <FL>Edition</FL>
          <FInput value={form.edition} onChange={s('edition')} placeholder="e.g. 2nd" />
        </div>
        <div>
          <FL>Publisher</FL>
          <FInput value={form.publisher} onChange={s('publisher')} placeholder="Publisher name" />
        </div>
        <div>
          <FL>Place of Publication</FL>
          <FInput value={form.place} onChange={s('place')} placeholder="City, Country" />
        </div>
        <div>
          <FL>ISBN (optional)</FL>
          <FInput value={form.isbn} onChange={s('isbn')} placeholder="9780xxxxxxxxxxxx" />
        </div>
      </div>
      <GenBtn disabled={!form.title.trim()} />
    </form>
  )
}

function WebsiteForm({
  form, setForm, onSubmit,
}: { form: ManualWebsiteForm; setForm: (f: ManualWebsiteForm) => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const s = (k: keyof ManualWebsiteForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <FL>Author / Organization <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.authorName} onChange={s('authorName')} placeholder='"Smith, John" or "WHO"' required />
          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
            <input type="checkbox" checked={form.isOrg}
              onChange={e => setForm({ ...form, isOrg: e.target.checked })} className="w-3 h-3" />
            <span className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>Organization (not a person)</span>
          </label>
        </div>
        <div>
          <FL>Page Title <span style={{ color: 'var(--teal)' }}>*</span></FL>
          <FInput value={form.title} onChange={s('title')} placeholder="Title of the webpage" required />
        </div>
        <div>
          <FL>Website / Publisher Name</FL>
          <FInput value={form.siteName} onChange={s('siteName')} placeholder="e.g. WHO" />
        </div>
        <div>
          <FL>Year</FL>
          <FInput value={form.year} onChange={s('year')} placeholder="2024" />
        </div>
        <div>
          <FL>Month & Day (optional)</FL>
          <FInput value={form.monthDay} onChange={s('monthDay')} placeholder="June 25" />
        </div>
        <div>
          <FL>Access Date</FL>
          <FInput value={form.accessDate} onChange={s('accessDate')} placeholder="June 25, 2026" />
        </div>
        <div className="sm:col-span-2">
          <FL>URL</FL>
          <FInput value={form.url} onChange={s('url')} placeholder="https://example.com/page" type="url" />
        </div>
      </div>
      <GenBtn disabled={!form.authorName.trim() || !form.title.trim()} />
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const DEFAULT_A_FORM: ManualArticleForm = {
  authors: [{ ...EMPTY_AUTHOR }],
  year: '', title: '', journal: '', volume: '', issue: '', pages: '', doi: '',
}
const DEFAULT_B_FORM: ManualBookForm = {
  authors: [{ ...EMPTY_AUTHOR }],
  year: '', title: '', subtitle: '', edition: '', publisher: '', place: '', isbn: '',
}

function CitePage() {
  const router = useRouter()
  const [batch, setBatch] = useState<{ id: number; entries: RefEntry[] } | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [input, setInput] = useState('')
  const [autoResult, setAutoResult] = useState<AutoResult | null>(null)
  const lookupCount = useRef(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual entry
  const [showManual, setShowManual] = useState(false)
  const manualRef = useRef<HTMLDivElement>(null)
  const [manualType, setManualType] = useState<ManualSourceType>('article')
  const [manualResult, setManualResult] = useState<{ citations: AllCitations; label: string } | null>(null)

  // Form state
  const [aForm, setAForm] = useState<ManualArticleForm>(DEFAULT_A_FORM)
  const [bForm, setBForm] = useState<ManualBookForm>(DEFAULT_B_FORM)
  const [wForm, setWForm] = useState<ManualWebsiteForm>({
    authorName: '', isOrg: false, year: String(new Date().getFullYear()),
    monthDay: '', title: '', siteName: '', accessDate: todayFormatted(), url: '',
  })

  // Webpage auto-detect form
  const [wpForm, setWpForm] = useState({ author: '', is_org: false, year: String(new Date().getFullYear()), title: '', site_name: '', access_date: todayFormatted(), url: '' })

  // A ?doi= link runs the lookup once, after the first render.
  useEffect(() => {
    const urlDoi = new URLSearchParams(window.location.search).get('doi')
    if (!urlDoi) return
    const t = setTimeout(() => { setInput(urlDoi); doLookup(urlDoi) }, 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function runBatch(entries: RefEntry[]) {
    ++lookupCount.current
    setLoading(false); setAutoResult(null)
    if (!entries.length) { setBatch(null); setError('Nothing to convert - no entries found.'); return }
    if (entries.length > MAX_BATCH) { setBatch(null); setError(`At most ${MAX_BATCH} entries at a time (found ${entries.length}).`); return }
    setError(null)
    setBatch({ id: Date.now(), entries })
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const text = await f.text()
    setInput(text)
    doLookup(text)
  }

  async function doLookup(raw: string) {
    const parsed = parseInput(raw)
    if (parsed.format !== 'text' || parsed.entries.length > 1) { runBatch(parsed.entries); return }
    setBatch(null)
    const detected = detectInput(raw)
    if (!detected) { setError('Enter a DOI (10.xxx/…), ISBN (9780…), a URL, or an article title.'); return }
    const myId = ++lookupCount.current
    setLoading(true); setError(null); setAutoResult(null)
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
            if (!article.keywords.length && oa.keywords.length) article = { ...article, keywords: oa.keywords }
            if (oa.cited_by_count > article.cited_by_count) article = { ...article, cited_by_count: oa.cited_by_count }
            if (oa.openalex_work_id) article = { ...article, openalex_work_id: oa.openalex_work_id }
          }
        } else if (oa) { article = oa; src = 'openalex' }
        if (!article) { setError('No article metadata found for this DOI in Crossref or OpenAlex.'); return }
        setAutoResult({ type: 'article', article, source: src })
        router.replace(`/cite/?doi=${encodeURIComponent(doi)}`, { scroll: false })
      } else if (detected.kind === 'search') {
        const results = await crossrefSearchMany(detected.payload)
        if (myId !== lookupCount.current) return
        if (!results.length) { setError('No articles found for this title. Try more words from the title, or enter the details manually below ↓'); return }
        setPicked(new Set()); setAutoResult({ type: 'search', query: detected.payload, results })
      } else if (detected.kind === 'isbn') {
        const book = await fetchBookByIsbn(detected.payload)
        if (myId !== lookupCount.current) return
        if (!book?.title) {
          setError('No book found for this ISBN. Enter details manually below ↓')
          setShowManual(true)
          setManualType('book')
          setBForm(f => ({ ...f, isbn: detected.payload }))
          setTimeout(() => manualRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          return
        }
        const citations = buildAllBook(bookInfoToForm(book))
        setAutoResult({ type: 'book', citations, book })
      } else {
        if (myId !== lookupCount.current) return
        const url = detected.payload
        setWpForm({ author: '', is_org: false, year: String(new Date().getFullYear()), title: '', site_name: domainFromUrl(url), access_date: todayFormatted(), url })
        setAutoResult({ type: 'webpage-form', url })
      }
    } catch {
      if (myId !== lookupCount.current) return
      setError('Lookup failed. Check the format and try again.')
    } finally {
      if (myId === lookupCount.current) setLoading(false)
    }
  }

  function handleWpSubmit(e: FormEvent) {
    e.preventDefault()
    const f: ManualWebsiteForm = {
      authorName: wpForm.author, isOrg: wpForm.is_org, year: wpForm.year,
      monthDay: '', title: wpForm.title, siteName: wpForm.site_name,
      accessDate: wpForm.access_date, url: wpForm.url,
    }
    setAutoResult({ type: 'webpage-result', citations: buildAllWebsite(f), title: wpForm.title })
  }

  function handleManualArticle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualResult({ citations: buildAllArticle(aForm), label: `Journal Article - ${aForm.title || 'Untitled'}` })
  }
  function handleManualBook(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualResult({ citations: buildAllBook(bForm), label: `Book - ${bForm.title || 'Untitled'}` })
  }
  function handleManualWebsite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManualResult({ citations: buildAllWebsite(wForm), label: `Website - ${wForm.title || 'Untitled'}` })
  }

  const TABS: { key: ManualSourceType; label: string; icon: React.ReactNode }[] = [
    { key: 'article', label: 'Journal Article', icon: <Newspaper className="h-3.5 w-3.5" /> },
    { key: 'book', label: 'Book', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: 'website', label: 'Website', icon: <Globe className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="wrap pb-12">
     <div className="max-w-[860px] space-y-6">
      <PageHeader
        title="Citation generator"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Services' }, { label: 'Citation generator' }]}
        actions={<Link href="/psg-format/" className="btn">PSG Format</Link>}
      >
        <p>Enter a DOI, ISBN or web address, or fill in the details by hand. Citations are produced in PSG, APA, MLA and Chicago styles. Paste several lines (100+ DOIs, titles, or references in AMA, APA, GB/T and other styles), or open a BibTeX / RIS file, to convert many at once.</p>
      </PageHeader>


      {/* Auto-lookup input */}
      <form onSubmit={e => { e.preventDefault(); doLookup(input) }}
        className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--posi-text)' }}>
          DOI, ISBN, URL, or article title
        </label>
        <div className="flex gap-3">
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={input.includes('\n') ? 8 : 2}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doLookup(input) } }}
            placeholder={'e.g.  10.63802/afs.2024.008  ·  9780374528379  ·  article title\nOne per line for many: 100+ DOIs, titles or references (AMA, APA, GB/T…)'}
            className="flex-1 px-4 py-2.5 focus:outline-none transition-colors resize-y"
            style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', fontSize: '14px' }}
            onFocus={onFocusBorder as never} onBlur={onBlurBorder as never} />
          <button type="submit" disabled={loading || !input.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--posi-accent)' }}>
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? 'Loading…' : 'Generate'}
          </button>
        </div>
        <label className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1.5 text-[11px] cursor-pointer"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
          <UploadSimple className="h-3 w-3" /> Open .bib / .ris / .txt / .json file
          <input type="file" accept=".bib,.bibtex,.ris,.txt,.json,text/plain" className="hidden" onChange={onFile} />
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
          {[
            ['DOI', 'any Crossref DOI, e.g. 10.63802/afs.2024.008'],
            ['ISBN', '10 or 13 digits, e.g. 9780374528379'],
            ['URL', 'any web address, e.g. https://example.com/page'],
            ['Title', 'article title, with author or journal if you have it'],
            ['Many', 'one per line, any mix of the above, or a BibTeX / RIS / CSL JSON file (up to 1,000)'],
          ].map(([k, v]) => (
            <p key={k} className="text-xs" style={{ color: 'var(--posi-muted)' }}>
              <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>{k}</span> - {v}
            </p>
          ))}
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
        <div className="p-5" style={{ background: 'var(--rejected-soft)', border: '1px solid #F5C2CB' }}>
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--rejected)' }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--rejected)' }}>Not Found</p>
              <p className="text-xs leading-relaxed text-justify" style={{ color: '#7f1d1d' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Many entries */}
      {batch && <BatchRun key={batch.id} entries={batch.entries} />}

      {/* Title search results */}
      {!loading && autoResult?.type === 'search' && (
        <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
          <p className="px-5 py-3 text-xs font-mono" style={{ borderBottom: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
            Select the article to cite
          </p>
          <ul className="divide-y divide-[var(--line-soft)]">
            {autoResult.results.map(a => (
              <li key={a.doi}>
                <div className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--surface-2)]">
                <input type="checkbox" className="mt-1.5 w-3.5 h-3.5 shrink-0" aria-label="Select for batch conversion"
                  checked={picked.has(a.doi)}
                  onChange={e => setPicked(p => { const n = new Set(p); if (e.target.checked) n.add(a.doi); else n.delete(a.doi); return n })} />
                <button type="button" className="flex-1 text-left"
                  onClick={() => { setAutoResult({ type: 'article', article: a, source: 'crossref' }); router.replace(`/cite/?doi=${encodeURIComponent(a.doi)}`, { scroll: false }) }}>
                  <span className="block text-sm font-medium" style={{ color: 'var(--posi-text)' }}>{decodeHtml(a.title)}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--posi-muted)' }}>
                    {a.authors.slice(0, 3).map(x => x.display_name).join('; ')}{a.authors.length > 3 ? ' et al.' : ''}
                    {a.journal_title ? ` · ${decodeHtml(a.journal_title)}` : ''} · {a.publication_year}
                  </span>
                </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--posi-border)' }}>
            <button type="button" disabled={!picked.size}
              onClick={() => runBatch(autoResult.results.filter(a => picked.has(a.doi)).map(a => ({ raw: a.doi, source: 'text' as const, doi: a.doi, authors: [] })))}
              className="px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ background: 'var(--teal)' }}>
              Convert {picked.size || ''} selected
            </button>
            <span className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>Tick several to convert them together, or click one title for all citation styles.</span>
          </div>
        </div>
      )}

      {/* Article result */}
      {!loading && autoResult?.type === 'article' && (
        <div className="space-y-4">
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>Article Found</p>
              <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-mono)', background: autoResult.source === 'openalex' ? 'var(--verified-soft)' : 'var(--surface-2)', color: autoResult.source === 'openalex' ? 'var(--verified)' : 'var(--muted)', border: `1px solid ${autoResult.source === 'openalex' ? '#bbdece' : '#ddd'}` }}>
                via {autoResult.source === 'openalex' ? 'OpenAlex' : 'Crossref'}
              </span>
            </div>
            <h2 className="text-sm font-semibold leading-snug mb-2" style={{ color: 'var(--posi-text)' }}>
              {decodeHtml(autoResult.article.title)}
            </h2>
            {autoResult.article.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>
                {autoResult.article.authors.slice(0, 5).map(a => a.display_name).join('; ')}
                {autoResult.article.authors.length > 5 && <span style={{ color: 'var(--posi-soft)' }}> +{autoResult.article.authors.length - 5} more</span>}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {autoResult.article.journal_title && <span>{decodeHtml(autoResult.article.journal_title)}</span>}
              {autoResult.article.volume && <span>Vol. {autoResult.article.volume}</span>}
              {autoResult.article.issue && <span>No. {autoResult.article.issue}</span>}
              <span>{autoResult.article.publication_year}</span>
            </div>
            {autoResult.article.doi && (
              <div className="mt-3">
                <a href={`https://doi.org/${autoResult.article.doi}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--posi-accent)' }}>
                  {autoResult.article.doi} <ArrowSquareOut className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          <CitationFormatter article={autoResult.article} />
        </div>
      )}

      {/* Book result (ISBN found) */}
      {!loading && autoResult?.type === 'book' && (
        <div className="space-y-4">
          <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4" style={{ color: 'var(--posi-accent)' }} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>Book Found</p>
            </div>
            <h2 className="text-sm font-semibold leading-snug mb-1" style={{ color: 'var(--posi-text)' }}>
              {autoResult.book.title}{autoResult.book.subtitle && <span style={{ color: 'var(--posi-muted)' }}>: {autoResult.book.subtitle}</span>}
            </h2>
            {autoResult.book.authors.length > 0 && (
              <p className="text-xs mb-2" style={{ color: 'var(--posi-muted)' }}>{autoResult.book.authors.join('; ')}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
              {autoResult.book.year && <span>{autoResult.book.year}</span>}
              {autoResult.book.publisher && <span>{autoResult.book.publisher}</span>}
              {autoResult.book.place && <span>{autoResult.book.place}</span>}
              <span>ISBN {autoResult.book.isbn}</span>
            </div>
          </div>
          <MultiFormatCards citations={autoResult.citations} />
        </div>
      )}

      {/* Webpage form */}
      {!loading && autoResult?.type === 'webpage-form' && (
        <div className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4" style={{ color: 'var(--posi-accent)' }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>Webpage Citation</p>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--posi-muted)' }}>No DOI found. Fill in details to generate citations in all formats.</p>
          <form onSubmit={handleWpSubmit} className="space-y-3">
            <div>
              <FL>URL</FL>
              <input value={wpForm.url} readOnly className={inputCls} style={{ ...inputStyle, background: 'var(--posi-bg)' }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FL>Author or Organization <span style={{ color: 'var(--teal)' }}>*</span></FL>
                <FInput value={wpForm.author} onChange={e => setWpForm(f => ({ ...f, author: e.target.value }))} placeholder='"Smith, John" or "WHO"' required />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input type="checkbox" checked={wpForm.is_org} onChange={e => setWpForm(f => ({ ...f, is_org: e.target.checked }))} className="w-3 h-3" />
                  <span className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>Organization</span>
                </label>
              </div>
              <div>
                <FL>Page Title <span style={{ color: 'var(--teal)' }}>*</span></FL>
                <FInput value={wpForm.title} onChange={e => setWpForm(f => ({ ...f, title: e.target.value }))} placeholder="Title of the page" required />
              </div>
              <div>
                <FL>Website Name</FL>
                <FInput value={wpForm.site_name} onChange={e => setWpForm(f => ({ ...f, site_name: e.target.value }))} placeholder="Site name" />
              </div>
              <div>
                <FL>Year</FL>
                <FInput value={wpForm.year} onChange={e => setWpForm(f => ({ ...f, year: e.target.value }))} placeholder="2026" />
              </div>
              <div className="sm:col-span-2">
                <FL>Access Date</FL>
                <FInput value={wpForm.access_date} onChange={e => setWpForm(f => ({ ...f, access_date: e.target.value }))} placeholder="June 25, 2026" />
              </div>
            </div>
            <button type="submit" disabled={!wpForm.author.trim() || !wpForm.title.trim()}
              className="w-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--teal)' }}>
              Generate Citations
            </button>
          </form>
        </div>
      )}

      {/* Webpage result */}
      {!loading && autoResult?.type === 'webpage-result' && (
        <div className="space-y-4">
          <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-3.5 w-3.5" style={{ color: 'var(--posi-muted)' }} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>Webpage</p>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--posi-text)' }}>{autoResult.title}</p>
          </div>
          <MultiFormatCards citations={autoResult.citations} />
          <button onClick={() => setAutoResult({ type: 'webpage-form', url: autoResult.citations.psg.plain.match(/https?:\/\/\S+/)?.[0] ?? '' })}
            className="text-xs hover:underline" style={{ color: 'var(--posi-accent)' }}>
            ← Edit details
          </button>
        </div>
      )}

      {/* ── Manual Entry Section ─────────────────────────────────────────────── */}
      <div ref={manualRef}>
        <button
          onClick={() => setShowManual(v => !v)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: showManual ? 'var(--posi-accent)' : 'var(--posi-muted)' }}
        >
          <PencilSimple className="h-4 w-4" />
          {showManual ? 'Hide manual entry' : 'Or enter details manually →'}
        </button>

        {showManual && (
          <div className="mt-4 bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            {/* Source type tabs */}
            <div className="flex" style={{ borderBottom: '1px solid var(--posi-border)' }}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setManualType(tab.key); setManualResult(null) }}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors"
                  style={{
                    borderBottom: manualType === tab.key ? '2px solid var(--teal)' : '2px solid transparent',
                    color: manualType === tab.key ? 'var(--teal)' : 'var(--posi-muted)',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {manualType === 'article' && (
                <ArticleForm form={aForm} setForm={f => { setAForm(f); setManualResult(null) }} onSubmit={handleManualArticle} />
              )}
              {manualType === 'book' && (
                <BookForm form={bForm} setForm={f => { setBForm(f); setManualResult(null) }} onSubmit={handleManualBook} />
              )}
              {manualType === 'website' && (
                <WebsiteForm form={wForm} setForm={f => { setWForm(f); setManualResult(null) }} onSubmit={handleManualWebsite} />
              )}

              {/* Manual result */}
              {manualResult && (
                <div className="space-y-3">
                  <p className="text-xs font-mono font-medium" style={{ color: 'var(--posi-muted)' }}>
                    {manualResult.label}
                  </p>
                  <MultiFormatCards citations={manualResult.citations} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
        <Link href="/psg-format/" className="link">PSG Format specification</Link>
      </p>
     </div>
    </div>
  )
}

export default function CiteGeneratorPage() {
  return <CitePage />
}
