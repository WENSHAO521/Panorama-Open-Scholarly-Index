'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { extractDoi } from '@/lib/utils'
import { getTotalWorks, getTotalJournals } from '@/lib/openalex'
import { OPENALEX_TOTALS } from '@/lib/openalex-totals'

const SCOPES = [
  { key: 'sources', label: 'Journals', placeholder: 'Journal title or ISSN' },
  { key: 'publications', label: 'Publications', placeholder: 'Title, author, keyword or DOI' },
  { key: 'publishers', label: 'Publishers', placeholder: 'Publisher name' },
] as const
type Scope = typeof SCOPES[number]['key']

export function HomeSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('sources')
  const active = SCOPES.find(s => s.key === scope)!

  function submit(e: FormEvent) {
    e.preventDefault()
    const v = q.trim()
    const enc = encodeURIComponent(v)
    if (scope === 'publications') {
      const doi = v ? extractDoi(v) : null
      router.push(doi ? `/work/?id=${encodeURIComponent(doi)}` : v ? `/publications/?q=${enc}` : '/publications/')
    } else if (scope === 'sources') {
      router.push(v ? `/journals/?q=${enc}` : '/journals/')
    } else {
      router.push('/publishers/')
    }
  }

  return (
    <div className="w-full">
      <div role="tablist" aria-label="Search scope" className="inline-flex gap-1 p-1 mb-3 rounded-[var(--radius-lg)]" style={{ background: 'var(--surface-2)' }}>
        {SCOPES.map(s => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={scope === s.key}
            onClick={() => setScope(s.key)}
            className="h-8 px-4 rounded-[var(--radius)] text-[13.5px] font-medium transition-colors"
            style={scope === s.key
              ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--posi-shadow-card), 0 0 0 1px var(--line)' }
              : { color: 'var(--muted)' }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="home-search" className="sr-only">Search {active.label.toLowerCase()}</label>
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input
            id="home-search"
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={active.placeholder}
            className="input h-[52px] pl-12 text-[16px] rounded-[var(--radius-lg)]"
            style={{ boxShadow: 'var(--posi-shadow-card)' }}
          />
        </div>
        <button type="submit" className="btn btn-primary h-[52px] px-8 text-[15px] rounded-[var(--radius-lg)]">Search</button>
      </form>
    </div>
  )
}

/** Live total of works in OpenAlex; shows the round figure until it arrives, or if it never does. */
export function LiveWorksCount() {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    getTotalWorks(c.signal).then(setN).catch(() => { if (!c.signal.aborted) setN(-1) })
    return () => c.abort()
  }, [])
  const snap = OPENALEX_TOTALS.works
  return n === null || n === -1 ? (n === -1 && snap ? <>{snap.toLocaleString('en-US')}</> : <>300 million+</>) : <>{n.toLocaleString('en-US')}</>
}

/** Live total of journals in OpenAlex (every one is indexed by POSI). */
export function LiveJournalsCount() {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    getTotalJournals(c.signal).then(setN).catch(() => { if (!c.signal.aborted && OPENALEX_TOTALS.journals) setN(OPENALEX_TOTALS.journals) })
    return () => c.abort()
  }, [])
  return n === null
    ? <span className="inline-block h-6 w-24 align-middle rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} aria-label="Loading" />
    : <>{n.toLocaleString('en-US')}</>
}
