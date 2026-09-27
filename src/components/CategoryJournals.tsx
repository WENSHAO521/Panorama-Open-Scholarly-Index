'use client'

// All journals in one subject category, loaded from the static directory
// files (/data/journals/<category>.json, or per-letter parts for very large
// groups). Filter, sort, page and export in the browser.

import Link from 'next/link'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import type { DirRecord } from '@/lib/global-journals'
import { fmt } from './db'

const PAGE = 50
type Sort = 'title' | 'works'

function csv(rows: DirRecord[]) {
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  return ['id,title,publisher,issn,country,open_access,doaj,works,status',
    ...rows.map(r => [r.id, r.t, r.p, r.i.join(' '), r.co, r.oa, r.dj, r.w, r.core ? 'core' : 'indexed'].map(cell).join(','))].join('\n')
}

export function CategoryJournals({ code, files, total }: { code: string; files: string[]; total: number }) {
  const params = useSearchParams()
  const split = files.length > 1
  const letters = files.map(f => f.replace(/^.*--/, '').replace('.json', ''))
  const [letter, setLetter] = useState(letters[0])
  const file = split ? `${code}--${letter}.json` : files[0]

  const [data, setData] = useState<{ file: string; rows: DirRecord[] } | { file: string; error: true } | null>(null)
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const [oa, setOa] = useState(params.get('oa') === '1')
  const [doaj, setDoaj] = useState(false)
  const [coreOnly, setCoreOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('works')
  const key = `${file}|${dq}|${oa}|${doaj}|${coreOnly}|${sort}`
  const [pageState, setPageState] = useState({ key, n: 1 })
  const page = pageState.key === key ? pageState.n : 1

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/data/journals/${file}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((rows: DirRecord[]) => setData({ file, rows }))
      .catch(e => { if (e.name !== 'AbortError') setData({ file, error: true }) })
    return () => ctrl.abort()
  }, [file])

  const current = data?.file === file ? data : null
  const rows = current && 'rows' in current ? current.rows : null

  const filtered = useMemo(() => {
    if (!rows) return []
    const n = dq.trim().toLowerCase()
    const out = rows.filter(r =>
      (!oa || r.oa) && (!doaj || r.dj) && (!coreOnly || r.core) &&
      (!n || r.t.toLowerCase().includes(n) || (r.p ?? '').toLowerCase().includes(n) || r.i.some(i => i.includes(n.toUpperCase()))))
    if (sort === 'works') out.sort((a, b) => (b.w ?? -1) - (a.w ?? -1))
    return out
  }, [rows, dq, oa, doaj, coreOnly, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)

  function download() {
    const u = URL.createObjectURL(new Blob([csv(filtered)], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = u; a.download = `posi-journals-${code}${split ? `-${letter}` : ''}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(u), 1000)
  }

  return (
    <div>
      {split && (
        <nav aria-label="By first letter" className="flex flex-wrap gap-1 mb-4">
          {letters.map(l => (
            <button key={l} type="button" onClick={() => setLetter(l)} aria-pressed={letter === l}
              className="h-8 min-w-8 px-2 rounded-[2px] text-[13px] font-mono uppercase"
              style={letter === l ? { background: 'var(--teal)', color: 'var(--on-teal)' } : { background: 'var(--surface-2)', color: 'var(--ink-2)' }}>
              {l === '0' ? '#' : l}
            </button>
          ))}
        </nav>
      )}

      <div className="panel p-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <div className="relative">
          <label htmlFor="cat-q" className="sr-only">Filter journals</label>
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="cat-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by title, publisher or ISSN" className="input h-10 pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13.5px]">
          {([['Open access', oa, setOa], ['In DOAJ', doaj, setDoaj], ['Core only', coreOnly, setCoreOnly]] as const).map(([label, val, set]) => (
            <label key={label} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={val} onChange={() => set(!val)} style={{ accentColor: 'var(--teal)' }} /> {label}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="cat-sort" className="sr-only">Sort</label>
          <select id="cat-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="input h-10 w-auto pr-8">
            <option value="works">Most works</option>
            <option value="title">Title A to Z</option>
          </select>
          <button type="button" className="btn h-10" onClick={download} disabled={!filtered.length}><DownloadSimple className="h-4 w-4" /> CSV</button>
        </div>
      </div>

      <p className="mt-4 mb-2 text-[13px]" style={{ color: 'var(--muted)' }} aria-live="polite">
        {rows
          ? <><span className="font-semibold tnum" style={{ color: 'var(--ink)' }}>{fmt(filtered.length)}</span> journals{split ? ` starting with ${letter === '0' ? 'a digit or symbol' : letter.toUpperCase()}` : ''} (of {fmt(total)} in this category)</>
          : current ? 'The journal list could not be loaded.' : 'Loading journals'}
      </p>

      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[760px]">
          <thead>
            <tr><th>Journal</th><th>ISSN</th><th>Country</th><th className="text-right">Works</th><th>Access</th><th>Status</th></tr>
          </thead>
          <tbody>
            {!rows && Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} aria-hidden="true">{Array.from({ length: 6 }).map((__, j) => <td key={j}><div className="h-3.5 rounded-[2px] animate-pulse" style={{ background: 'var(--surface-3)' }} /></td>)}</tr>
            ))}
            {shown.map(r => (
              <tr key={r.id}>
                <td className="max-w-[420px]">
                  <Link href={r.h} prefetch={false} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{r.t}</Link>
                  {r.p && <div className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>{r.p}</div>}
                </td>
                <td className="font-mono text-[12.5px] whitespace-nowrap">{r.i[0] ?? ''}</td>
                <td className="text-[13px]">{r.co ?? ''}</td>
                <td className="text-right font-mono tnum text-[12.5px]">{r.w != null ? fmt(r.w) : ''}</td>
                <td className="text-[12.5px]">{[r.oa ? 'Open access' : null, r.dj ? 'DOAJ' : null].filter(Boolean).join(', ')}</td>
                <td>
                  <span className="chip" style={r.core ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' } : undefined}>
                    {r.core ? 'Core' : 'Indexed'}
                  </span>
                </td>
              </tr>
            ))}
            {rows && !shown.length && (
              <tr><td colSpan={6} className="py-12 text-center" style={{ color: 'var(--muted)' }}>No journal matches these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between mt-4 text-[13px]">
          <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => setPageState({ key, n: page - 1 })}>Previous</button>
          <span className="font-mono" style={{ color: 'var(--muted)' }}>page {page} of {fmt(pages)}</span>
          <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => setPageState({ key, n: page + 1 })}>Next</button>
        </nav>
      )}
    </div>
  )
}
