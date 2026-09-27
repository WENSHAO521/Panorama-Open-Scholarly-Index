'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import type { RankedJournal, Quartile } from '@/lib/rankings'
import { ZONE_BOUNDS, type Zone } from '@/lib/zones'
import { fmt } from './db'

const PAGE = 100

export function QuartileBadge({ q }: { q: Quartile | null }) {
  if (!q) return <span style={{ color: 'var(--soft)' }}>n/a</span>
  // One accent, stepped in strength: Q1 is the solid teal chip.
  const tone = {
    Q1: { background: 'var(--teal)', color: 'var(--on-teal)', borderColor: 'var(--teal)' },
    Q2: { background: 'var(--teal-soft)', color: 'var(--teal)', borderColor: 'var(--teal-line)' },
    Q3: { background: 'var(--surface-2)', color: 'var(--ink-2)', borderColor: 'var(--line)' },
    Q4: { background: 'transparent', color: 'var(--muted)', borderColor: 'var(--line)' },
  }[q]
  return <span className="chip font-semibold" style={tone} title="PCS quartile: RANK-1.0 applied to PCS">PCS-{q}</span>
}

const ZONE_TITLE: Record<Zone, string> = {
  1: 'POSI Zone 1: top 5% of the ranking',
  2: 'POSI Zone 2: next 15% (top 6–20%)',
  3: 'POSI Zone 3: next 30% (top 21–50%)',
  4: 'POSI Zone 4: remaining 50%',
}

/** POSI Zone chip: numbered and outlined, distinct from the filled quartile chips. */
export function ZoneBadge({ z }: { z: Zone | null }) {
  if (!z) return <span style={{ color: 'var(--soft)' }}>n/a</span>
  const strong = z === 1
  return (
    <span className="chip font-semibold whitespace-nowrap" title={ZONE_TITLE[z]}
      style={{ color: z <= 2 ? 'var(--teal)' : z === 3 ? 'var(--ink-2)' : 'var(--muted)', borderColor: z <= 2 ? 'var(--teal)' : 'var(--line)', borderWidth: strong ? 2 : 1, background: 'transparent' }}>
      Zone {z}
    </span>
  )
}

function journalHref(r: RankedJournal) {
  if (r.code) return `/journal/${r.code}/`
  return r.issn[0] ? `/journal/?issn=${r.issn[0]}` : null
}

function csv(rows: RankedJournal[], overall: boolean) {
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = 'rank,n,percentile,quartile,zone,posi_id,title,publisher,issn,psc_category,status,pcs,eligible_items,pci'
  return [head, ...rows.map(r => [
    overall ? r.oRank : r.rank, overall ? r.oN : r.n, overall ? r.oPct : r.pct, overall ? r.oQ : r.q, overall ? r.oZone : r.zone,
    r.id, r.title, r.publisher, r.issn.join(' '), r.cat, r.core ? 'core' : 'indexed', r.pcs, r.items, r.pci,
  ].map(cell).join(','))].join('\n')
}

export function RankingTable({ rows, overall = false, fileName }: { rows: RankedJournal[]; overall?: boolean; fileName: string }) {
  const [status, setStatus] = useState<'all' | 'core' | 'indexed'>('all')
  const [quart, setQuart] = useState<Quartile | 'all'>('all')
  const [zone, setZone] = useState<Zone | 0>(0)
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const filterKey = `${status}|${quart}|${zone}|${q}`
  const [pageState, setPageState] = useState({ key: filterKey, n: 1 })
  const page = pageState.key === filterKey ? pageState.n : 1
  const tableTop = useRef<HTMLDivElement>(null)
  // Page changes return to the top of the table so the new rows are in view.
  const goTo = (n: number) => { setPageState({ key: filterKey, n }); tableTop.current?.scrollIntoView({ block: 'start' }) }

  const filtered = useMemo(() => {
    const needle = dq.trim().toLowerCase()
    return rows.filter(r =>
      (status === 'all' || (status === 'core') === r.core) &&
      (quart === 'all' || (overall ? r.oQ : r.q) === quart) &&
      (!zone || (overall ? r.oZone : r.zone) === zone) &&
      (!needle || r.title.toLowerCase().includes(needle) || (r.publisher ?? '').toLowerCase().includes(needle) || r.issn.some(i => i.includes(needle.toUpperCase()))),
    )
  }, [rows, status, quart, zone, dq, overall])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
  const coreCount = rows.filter(r => r.core).length

  function download() {
    const u = URL.createObjectURL(new Blob([csv(filtered, overall)], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = u; a.download = fileName; a.click()
    setTimeout(() => URL.revokeObjectURL(u), 1000)
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div role="tablist" aria-label="Journal status" className="inline-flex rounded-[2px] p-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          {([['all', `All (${fmt(rows.length)})`], ['core', `Core (${fmt(coreCount)})`], ['indexed', `Indexed (${fmt(rows.length - coreCount)})`]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={status === k} onClick={() => setStatus(k)}
              className="px-3 h-8 text-[13px] rounded-[2px]"
              style={status === k ? { background: 'var(--surface)', color: 'var(--ink)', fontWeight: 500, boxShadow: 'var(--shadow-1)' } : { color: 'var(--muted)' }}>
              {label}
            </button>
          ))}
        </div>
        <label htmlFor="rq" className="sr-only">Quartile</label>
        <select id="rq" value={quart} onChange={e => setQuart(e.target.value as Quartile | 'all')} className="input h-9 w-auto pr-8 text-[13px]">
          <option value="all">All quartiles</option>
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(x => <option key={x} value={x}>PCS-{x}</option>)}
        </select>
        <label htmlFor="rz" className="sr-only">POSI Zone</label>
        <select id="rz" value={zone} onChange={e => setZone(Number(e.target.value) as Zone | 0)} className="input h-9 w-auto pr-8 text-[13px]">
          <option value={0}>All zones</option>
          {ZONE_BOUNDS.map(([z]) => <option key={z} value={z}>Zone {z}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <label htmlFor="rsearch" className="sr-only">Find a journal</label>
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
          <input id="rsearch" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Find a journal, publisher or ISSN" className="input h-9 pl-9 text-[13.5px]" />
        </div>
        <button type="button" className="btn h-9" onClick={download} disabled={!filtered.length}><DownloadSimple className="h-4 w-4" /> CSV</button>
      </div>

      <div ref={tableTop} className="panel overflow-x-auto mt-4" style={{ scrollMarginTop: 72 }}>
        <table className="dtable min-w-[940px]">
          <thead>
            <tr>
              <th className="text-right w-[70px]">Rank</th>
              <th>Journal</th>
              <th className="text-right">PCS</th>
              <th className="text-right">Items</th>
              <th className="text-right">Percentile</th>
              <th>Quartile</th>
              <th>Zone</th>
              <th>Status</th>
              <th className="text-right">PCI</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(r => {
              const href = journalHref(r)
              const rank = overall ? r.oRank : r.rank
              const n = overall ? r.oN : r.n
              return (
                <tr key={r.id}>
                  <td className="text-right font-mono tnum">
                    <span style={{ color: 'var(--ink)' }}>{rank}</span>
                    <span className="text-[11px]" style={{ color: 'var(--soft)' }}>/{n}</span>
                  </td>
                  <td className="max-w-[380px]">
                    {href ? <Link href={href} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{r.title}</Link> : <span className="font-medium">{r.title}</span>}
                    <div className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                      {[r.publisher, r.issn[0] && `ISSN ${r.issn[0]}`].filter(Boolean).join(', ')}
                      {r.lowConfidence && <span title="Subject assignment has low confidence: no single topic dominates this journal"> (low-confidence subject)</span>}
                    </div>
                  </td>
                  <td className="text-right font-mono tnum">{r.pcs.toFixed(2)}</td>
                  <td className="text-right font-mono tnum" style={{ color: r.items < 20 ? 'var(--check)' : 'var(--muted)' }} title={r.items < 20 ? 'Limited sample: fewer than 20 eligible items' : undefined}>{fmt(r.items)}</td>
                  <td className="text-right font-mono tnum">{(overall ? r.oPct : r.pct)?.toFixed(1) ?? 'n/a'}</td>
                  <td><QuartileBadge q={overall ? r.oQ : r.q} /></td>
                  <td><ZoneBadge z={overall ? r.oZone : r.zone} /></td>
                  <td>
                    <span className="chip" style={r.core ? { color: 'var(--teal)', background: 'var(--teal-soft)', borderColor: 'transparent' } : undefined}>
                      {r.core ? 'Core' : 'Indexed'}
                    </span>
                  </td>
                  <td className="text-right font-mono tnum" style={{ color: r.pci == null ? 'var(--soft)' : undefined }}>{r.pci == null ? 'n/a' : r.pci.toFixed(2)}</td>
                </tr>
              )
            })}
            {!shown.length && (
              <tr><td colSpan={9} className="py-12 text-center" style={{ color: 'var(--muted)' }}>No ranked journal matches these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between mt-4 text-[13px]">
          <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => goTo(page - 1)}>Previous</button>
          <span className="font-mono" style={{ color: 'var(--muted)' }}>page {page} of {pages}</span>
          <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => goTo(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  )
}
