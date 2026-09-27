'use client'

import Link from 'next/link'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { publisherHref, type PublisherRow } from '@/lib/publishers'
import { fmt } from './db'

const PAGE = 50
type Sort = 'journals' | 'name' | 'works' | 'oa'

export function PublisherBrowser({ top }: { top: PublisherRow[] }) {
  const [rows, setRows] = useState<PublisherRow[]>(top)
  const [full, setFull] = useState(false)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('journals')
  const dq = useDeferredValue(q)

  // The first rows are rendered at build time; the full list loads in the background.
  useEffect(() => {
    fetch('/data/meta/publishers.json').then(r => r.json()).then((all: PublisherRow[]) => { setRows(all); setFull(true) }).catch(() => {})
  }, [])
  const filterKey = `${q}|${sort}`
  const [pageState, setPageState] = useState({ key: filterKey, n: 1 })
  const page = pageState.key === filterKey ? pageState.n : 1
  const tableTop = useRef<HTMLDivElement>(null)
  // Page changes return to the top of the table so the new rows are in view.
  const setPage = (f: (p: number) => number) => { setPageState({ key: filterKey, n: f(page) }); tableTop.current?.scrollIntoView({ block: 'start' }) }

  const filtered = useMemo(() => {
    const n = dq.trim().toLowerCase()
    const out = n ? rows.filter(r => r.name.toLowerCase().includes(n)) : [...rows]
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'works') out.sort((a, b) => b.works - a.works)
    else if (sort === 'oa') out.sort((a, b) => b.oa / b.n - a.oa / a.n || b.n - a.n)
    else out.sort((a, b) => b.n - a.n)
    return out
  }, [rows, dq, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)

  return (
    <div>
      <div className="panel p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="pub-search" className="sr-only">Filter publishers</label>
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="pub-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by publisher name" className="input h-10 pl-9" />
        </div>
        <label htmlFor="pub-sort" className="sr-only">Sort</label>
        <select id="pub-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="input h-10 w-auto pr-8">
          <option value="journals">Most journals</option>
          <option value="works">Most works</option>
          <option value="oa">Highest open-access share</option>
          <option value="name">Name A to Z</option>
        </select>
      </div>

      <p className="mt-4 mb-2 text-[13px]" style={{ color: 'var(--muted)' }} aria-live="polite">
        <span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{fmt(filtered.length)}</span> publishers
        {!full && <span style={{ color: 'var(--soft)' }}>, loading the full list</span>}
      </p>

      <div ref={tableTop} className="panel overflow-x-auto" style={{ scrollMarginTop: 72 }}>
        <table className="dtable min-w-[720px]">
          <thead>
            <tr>
              <th>Publisher</th>
              <th className="text-right">Journals</th>
              <th className="text-right">Core</th>
              <th className="text-right">Open access</th>
              <th className="text-right">In DOAJ</th>
              <th className="text-right">Works</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.slug}>
                <td className="max-w-[360px]">
                  <Link href={publisherHref(r)} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{r.name}</Link>
                </td>
                <td className="text-right font-mono tnum">{fmt(r.n)}</td>
                <td className="text-right font-mono tnum" style={{ color: r.core ? 'var(--ink)' : 'var(--soft)' }}>{fmt(r.core)}</td>
                <td className="text-right font-mono tnum">{Math.round((r.oa / r.n) * 100)}%</td>
                <td className="text-right font-mono tnum" style={{ color: r.doaj ? 'var(--ink)' : 'var(--soft)' }}>{fmt(r.doaj)}</td>
                <td className="text-right font-mono tnum" style={{ color: 'var(--muted)' }}>{fmt(r.works)}</td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={6} className="py-12 text-center" style={{ color: 'var(--muted)' }}>No publisher matches that name.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between mt-4 text-[13px]">
          <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className="font-mono" style={{ color: 'var(--muted)' }}>page {page} of {fmt(pages)}</span>
          <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </nav>
      )}
    </div>
  )
}
