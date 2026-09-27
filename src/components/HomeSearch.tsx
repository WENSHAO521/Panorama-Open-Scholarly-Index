'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { extractDoi } from '@/lib/utils'
import { getTotalWorks, getTotalJournals } from '@/lib/openalex'

const SCOPES = [
  { key: 'publications', label: 'Publications', placeholder: 'Title, author, keyword or DOI' },
  { key: 'sources', label: 'Journals', placeholder: 'Journal title or ISSN' },
  { key: 'publishers', label: 'Publishers', placeholder: 'Publisher name' },
] as const
type Scope = typeof SCOPES[number]['key']

export function HomeSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('publications')
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
      <div role="tablist" aria-label="Search scope" className="flex">
        {SCOPES.map(s => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={scope === s.key}
            onClick={() => setScope(s.key)}
            className="h-9 px-4 text-[13.5px] font-medium transition-colors"
            style={scope === s.key
              ? { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', borderBottomColor: 'var(--surface)', borderTop: '2px solid var(--teal)', marginBottom: -1, position: 'relative' }
              : { color: 'var(--muted)', border: '1px solid transparent' }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2 p-3" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div className="relative flex-1">
          <label htmlFor="home-search" className="sr-only">Search {active.label.toLowerCase()}</label>
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input
            id="home-search"
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={active.placeholder}
            className="input h-11 pl-10 text-[15px]"
          />
        </div>
        <button type="submit" className="btn btn-primary h-11 px-7 text-[14px]">Search</button>
      </form>
    </div>
  )
}

/** Live total of works in OpenAlex; renders nothing until it arrives. */
export function LiveWorksCount() {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    getTotalWorks(c.signal).then(setN).catch(() => { if (!c.signal.aborted) setN(-1) })
    return () => c.abort()
  }, [])
  if (n === -1) return <span>Over 300 million</span>
  return n === null
    ? <span className="inline-block h-6 w-28 align-middle rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} aria-label="Loading" />
    : <>{n.toLocaleString('en-US')}</>
}

/** Live total of journals in OpenAlex (every one is indexed by POSI). */
export function LiveJournalsCount() {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    getTotalJournals(c.signal).then(setN).catch(() => {})
    return () => c.abort()
  }, [])
  return n === null
    ? <span className="inline-block h-6 w-24 align-middle rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} aria-label="Loading" />
    : <>{n.toLocaleString('en-US')}</>
}
