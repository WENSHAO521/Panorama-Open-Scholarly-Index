'use client'

// Search across every indexed journal by title, ISSN or OpenAlex id, over
// POSI's own journal index (no registry calls). Curated POSI records
// (Core Collection and others) are marked.

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { searchJournals, type JournalHit } from '@/lib/journal-search'
import { journalHref } from '@/lib/journal-profile'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { fmt } from './db'

export function JournalSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState({ for: q, v: q })
  const value = draft.for === q ? draft.v : q
  const [result, setResult] = useState<{ q: string; hits: JournalHit[]; total: number; error?: boolean } | null>(null)
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!q.trim()) return
    const ctrl = new AbortController()
    searchJournals(q, 50, ctrl.signal)
      .then(r => setResult({ q, ...r }))
      .catch(e => { if (e.name !== 'AbortError') setResult({ q, hits: [], total: 0, error: true }) })
    return () => ctrl.abort()
  }, [q])

  function submit(e: FormEvent) {
    e.preventDefault()
    const v = value.trim()
    router.push(v ? `/journals/?q=${encodeURIComponent(v)}` : '/journals/', { scroll: false })
  }

  const current = result?.q === q ? result : null

  return (
    <div>
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2 max-w-[760px]">
        <div className="relative flex-1">
          <label htmlFor="journal-q" className="sr-only">Search all journals</label>
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="journal-q" type="search" value={value} onChange={e => setDraft({ for: q, v: e.target.value })}
            placeholder="Journal title or ISSN" className="input h-12 pl-11 text-[16px]" />
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6 text-[15px]">Search</button>
      </form>

      {q.trim() && (
        <section aria-label="Journal search results" className="mt-6">
          {!current && (
            <div className="panel divide-y" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2" style={{ borderColor: 'var(--line-soft)' }}>
                  <div className="h-4 w-1/2 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-3 w-1/3 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                </div>
              ))}
            </div>
          )}
          {current?.error && <p className="text-[14px]" style={{ color: 'var(--check)' }}>The journal index could not be loaded. Check your connection and try again.</p>}
          {current && !current.error && !current.hits.length && (
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>No indexed journal matches &ldquo;{q}&rdquo;. Try another word from the title, or an ISSN.</p>
          )}
          {!!current?.hits.length && (
            <>
              <p className="mb-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                {current.total > current.hits.length
                  ? <>Top {current.hits.length} of {fmt(current.total)} journals, closest title matches first. Add words to narrow the search.</>
                  : <>{fmt(current.total)} {current.total === 1 ? 'journal' : 'journals'}</>}
              </p>
              <ul className="panel overflow-hidden">
                {current.hits.map((h, i) => {
                  const curated = matchIssn(issnMap, [h.key])
                  return (
                    <li key={h.key} className="px-4 py-3 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                      <div className="min-w-0">
                        <Link href={journalHref(h.key)} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{h.title}</Link>
                        <p className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                          {[h.publisher, `ISSN ${h.key}`].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                        {h.works > 0 && <span className="font-mono tnum">{fmt(h.works)} works</span>}
                        {h.oa && <span>Open access</span>}
                        <span className="chip" style={curated?.k === 'core' ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' } : undefined}>
                          {curated?.k === 'core' ? 'Core' : 'Indexed'}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  )
}
