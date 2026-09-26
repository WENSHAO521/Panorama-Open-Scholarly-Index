'use client'

// Search across every indexed journal: OpenAlex sources and Crossref
// journals, queried together and merged on ISSN. Curated POSI records
// (Core Collection and others) are linked to their POSI pages.

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { searchSources, getSource, sourceId } from '@/lib/openalex'
import { usePosiIssnMap, matchIssn } from '@/lib/use-posi-issn'
import { recordHref } from '@/lib/records'
import { fmt } from './db'

interface Hit {
  key: string
  title: string
  publisher: string | null
  issns: string[]
  works: number | null
  oa: boolean | null
  href: string
  sources: string[]
}

const ISSN_RE = /^\d{4}-?\d{3}[\dXx]$/

async function crossrefJournals(q: string, signal: AbortSignal): Promise<Hit[]> {
  const issn = ISSN_RE.test(q.trim()) ? q.trim().toUpperCase().replace(/^(\d{4})(\d{3}[\dX])$/, '$1-$2') : null
  const url = issn
    ? `https://api.crossref.org/journals/${issn}?mailto=posi@panorama-sg.com`
    : `https://api.crossref.org/journals?query=${encodeURIComponent(q)}&rows=15&mailto=posi@panorama-sg.com`
  const r = await fetch(url, { signal })
  if (!r.ok) return []
  const j = await r.json()
  const items = issn ? [j.message] : j.message.items
  return items.map((m: { title: string; publisher?: string; ISSN?: string[]; counts?: { 'total-dois'?: number } }) => ({
    key: `cr:${m.ISSN?.[0] ?? m.title}`,
    title: m.title,
    publisher: m.publisher ?? null,
    issns: m.ISSN ?? [],
    works: m.counts?.['total-dois'] ?? null,
    oa: null,
    href: `/source/?issn=${m.ISSN?.[0] ?? ''}`,
    sources: ['Crossref'],
  }))
}

async function openalexJournals(q: string, signal: AbortSignal): Promise<Hit[]> {
  const list = ISSN_RE.test(q.trim()) ? [await getSource(q.trim(), signal)].filter(Boolean) : (await searchSources(q, 15, signal)).results
  return list.map(s => ({
    key: `oa:${sourceId(s!)}`,
    title: s!.display_name,
    publisher: s!.host_organization_name,
    issns: s!.issn ?? (s!.issn_l ? [s!.issn_l] : []),
    works: s!.works_count,
    oa: s!.is_oa,
    href: `/source/?id=${sourceId(s!)}`,
    sources: ['OpenAlex'],
  }))
}

function merge(a: Hit[], b: Hit[]): Hit[] {
  const out: Hit[] = [...a]
  for (const h of b) {
    const same = out.find(x => x.issns.some(i => h.issns.includes(i)))
    if (same) { same.sources = [...new Set([...same.sources, ...h.sources])]; continue }
    out.push(h)
  }
  return out
}

export function JournalSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState({ for: q, v: q })
  const value = draft.for === q ? draft.v : q
  const [result, setResult] = useState<{ q: string; hits: Hit[] | null; error?: boolean } | null>(null)
  const issnMap = usePosiIssnMap()

  useEffect(() => {
    if (!q.trim()) return
    const ctrl = new AbortController()
    Promise.allSettled([openalexJournals(q, ctrl.signal), crossrefJournals(q, ctrl.signal)])
      .then(([oa, cr]) => {
        if (ctrl.signal.aborted) return
        const hits = merge(oa.status === 'fulfilled' ? oa.value : [], cr.status === 'fulfilled' ? cr.value : [])
        setResult({ q, hits, error: oa.status === 'rejected' && cr.status === 'rejected' })
      })
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
            placeholder="Journal title, publisher or ISSN" className="input h-12 pl-11 text-[16px]" />
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6 text-[15px]">Search</button>
      </form>

      {q.trim() && (
        <section aria-label="Journal search results" className="mt-6">
          {!current && (
            <div className="panel divide-y" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2" style={{ borderColor: 'var(--line-soft)' }}>
                  <div className="h-4 w-1/2 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-3 w-1/3 rounded-[6px] animate-pulse" style={{ background: 'var(--surface-2)' }} />
                </div>
              ))}
            </div>
          )}
          {current?.error && <p className="text-[14px]" style={{ color: 'var(--check)' }}>The registries did not answer. Try again shortly.</p>}
          {current && !current.error && !current.hits?.length && (
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>No journal matches &ldquo;{q}&rdquo;. Try the full title or an ISSN.</p>
          )}
          {!!current?.hits?.length && (
            <ul className="panel overflow-hidden">
              {current.hits.map((h, i) => {
                const curated = matchIssn(issnMap, h.issns)
                return (
                  <li key={h.key} className="px-4 py-3 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" style={i ? { borderTop: '1px solid var(--line-soft)' } : undefined}>
                    <div className="min-w-0">
                      <Link href={curated ? recordHref(curated) : h.href} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{h.title}</Link>
                      <p className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                        {[h.publisher, h.issns.length ? `ISSN ${h.issns.join(', ')}` : null].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                      {h.works != null && <span className="font-mono tnum">{fmt(h.works)} works</span>}
                      {h.oa && <span>Open access</span>}
                      <span className="chip" style={curated?.k === 'core' ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' } : undefined}>
                        {curated?.k === 'core' ? 'Core' : 'Indexed'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
