'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { extractDoi } from '@/lib/utils'
import { getTotalWorks, getTotalJournals } from '@/lib/openalex'

const SCOPES = [
  { key: 'publications', label: 'Publications', placeholder: 'Title, author, keyword or DOI' },
  { key: 'sources', label: 'Sources', placeholder: 'Journal title, ISSN or POSI-J id' },
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
    <div className="w-full max-w-[600px]">
      <div role="tablist" aria-label="Search scope" className="flex gap-1 mb-2">
        {SCOPES.map(s => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={scope === s.key}
            onClick={() => setScope(s.key)}
            className="px-3 py-1.5 text-[13.5px] rounded-[6px] transition-colors"
            style={scope === s.key ? { background: 'var(--teal-soft)', color: 'var(--teal)', fontWeight: 500 } : { color: 'var(--muted)' }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="home-search" className="sr-only">Search {active.label.toLowerCase()}</label>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input
            id="home-search"
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={active.placeholder}
            className="input h-12 pl-11 text-[16px]"
          />
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6 text-[15px]">Search</button>
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
  if (n === -1) return <span className="text-[15px]">Over 300 million</span>
  return n === null
    ? <span className="inline-block h-6 w-28 align-middle rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} aria-label="Loading" />
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
    ? <span className="inline-block h-6 w-24 align-middle rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} aria-label="Loading" />
    : <>{n.toLocaleString('en-US')}</>
}
