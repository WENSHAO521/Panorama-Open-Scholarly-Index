'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import type { RankedJournal } from '@/lib/rankings'
import { AJR_RATING_SCALE, type CitationQuartile, type CitationRankingStatus, type LifecycleStage, type PosiZone } from '@/lib/evaluation/rules'
import { fmtPercentile, fmtScore, quartileLabel, RANKING_STATUS_LABEL } from '@/lib/evaluation/display'
import { QuartileBadge, ZoneBadge, RankingStatusBadge } from './Evaluation'
import { fmt } from './db'

export { QuartileBadge, ZoneBadge }

const PAGE = 100

function journalHref(r: RankedJournal) {
  if (r.code) return `/journal/${r.code}/`
  return r.issn[0] ? `/journal/?issn=${r.issn[0]}` : null
}

function csv(rows: RankedJournal[]) {
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = 'citation_rank,citation_rank_total,psc_category,pnci,citation_percentile,citation_quartile,posi_zone,zone_status,ajr_rating,citation_ranking_status,posi_id,title,publisher,issn,collection,eligible_items,citation_coverage,pci,pcs'
  return [head, ...rows.map(r => [
    r.rank, r.n, r.cat, r.pnci, r.pct, r.q, r.zone, r.zoneStatus, r.ajr, r.status,
    r.id, r.title, r.publisher, r.issn.join(' '), r.core ? 'core' : 'indexed', r.items, r.coverage, r.pci, r.pcs,
  ].map(cell).join(','))].join('\n')
}

const LIFECYCLE_LABEL: Record<Exclude<LifecycleStage, 'unknown'>, string> = { observation: 'Observation', early_stage: 'AJR-E (12–59 months)', mature: 'AJR-M (60+ months)' }

/**
 * Citation Ranking table. Rows are ordered by PNCI, highest first; ranks are
 * always category ranks. `categories` (for the all-categories list) adds a
 * PSC category filter and column.
 */
export function RankingTable({ rows, fileName, categories }: { rows: RankedJournal[]; fileName: string; categories?: { code: string; name: string }[] }) {
  const [collection, setCollection] = useState<'all' | 'core' | 'indexed'>('all')
  const [cat, setCat] = useState('all')
  const [quart, setQuart] = useState<CitationQuartile | 'all'>('all')
  const [zone, setZone] = useState<PosiZone | 0>(0)
  const [ajr, setAjr] = useState('all')
  const [life, setLife] = useState<LifecycleStage | 'all'>('all')
  const [status, setStatus] = useState<CitationRankingStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const filterKey = [collection, cat, quart, zone, ajr, life, status, q].join('|')
  const [pageState, setPageState] = useState({ key: filterKey, n: 1 })
  const page = pageState.key === filterKey ? pageState.n : 1
  const tableTop = useRef<HTMLDivElement>(null)
  const goTo = (n: number) => { setPageState({ key: filterKey, n }); tableTop.current?.scrollIntoView({ block: 'start' }) }

  const filtered = useMemo(() => {
    const needle = dq.trim().toLowerCase()
    return rows.filter(r =>
      (collection === 'all' || (collection === 'core') === r.core) &&
      (cat === 'all' || r.cat === cat) &&
      (quart === 'all' || r.q === quart) &&
      (!zone || r.zone === zone) &&
      (ajr === 'all' || r.ajr === ajr) &&
      (life === 'all' || r.lifecycle === life) &&
      (status === 'all' || r.status === status) &&
      (!needle || r.title.toLowerCase().includes(needle) || !!r.alt?.some(t => t.toLowerCase().includes(needle)) || (r.publisher ?? '').toLowerCase().includes(needle) || r.issn.some(i => i.includes(needle.toUpperCase()))),
    )
  }, [rows, collection, cat, quart, zone, ajr, life, status, dq])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
  const coreCount = rows.filter(r => r.core).length
  const hasAjr = rows.some(r => r.ajr)
  const hasLife = rows.some(r => r.lifecycle)

  function download() {
    const u = URL.createObjectURL(new Blob([csv(filtered)], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = u; a.download = fileName; a.click()
    setTimeout(() => URL.revokeObjectURL(u), 1000)
  }

  const select = 'input h-9 w-auto pr-8 text-[13px]'
  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div role="tablist" aria-label="Collection" className="inline-flex rounded-[2px] p-0.5 self-start" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            {([['all', `All (${fmt(rows.length)})`], ['core', `Core (${fmt(coreCount)})`], ['indexed', `Indexed (${fmt(rows.length - coreCount)})`]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={collection === k} onClick={() => setCollection(k)}
                className="px-3 h-8 text-[13px] rounded-[2px]"
                style={collection === k ? { background: 'var(--surface)', color: 'var(--ink)', fontWeight: 500, boxShadow: 'var(--shadow-1)' } : { color: 'var(--muted)' }}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <label htmlFor="rsearch" className="sr-only">Find a journal</label>
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
            <input id="rsearch" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Find a journal, publisher or ISSN" className="input h-9 pl-9 text-[13.5px]" />
          </div>
          <button type="button" className="btn h-9 self-start" onClick={download} disabled={!filtered.length}><DownloadSimple className="h-4 w-4" /> CSV</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories && (
            <>
              <label htmlFor="rcat" className="sr-only">PSC category</label>
              <select id="rcat" value={cat} onChange={e => setCat(e.target.value)} className={select}>
                <option value="all">All PSC categories</option>
                {categories.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
              </select>
            </>
          )}
          <label htmlFor="rq" className="sr-only">Citation Quartile</label>
          <select id="rq" value={quart} onChange={e => setQuart(e.target.value as CitationQuartile | 'all')} className={select}>
            <option value="all">All Citation Quartiles</option>
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(x => <option key={x} value={x}>{quartileLabel(x)}</option>)}
          </select>
          <label htmlFor="rz" className="sr-only">POSI Zone</label>
          <select id="rz" value={zone} onChange={e => setZone(Number(e.target.value) as PosiZone | 0)} className={select}>
            <option value={0}>All POSI Zones</option>
            {([1, 2, 3, 4] as const).map(z => <option key={z} value={z}>Zone {z}</option>)}
          </select>
          {hasAjr && (
            <>
              <label htmlFor="rajr" className="sr-only">AJR Rating</label>
              <select id="rajr" value={ajr} onChange={e => setAjr(e.target.value)} className={select}>
                <option value="all">All AJR Ratings</option>
                {AJR_RATING_SCALE.map(([r]) => <option key={r} value={r}>Rating {r}</option>)}
              </select>
            </>
          )}
          {hasLife && (
            <>
              <label htmlFor="rlife" className="sr-only">Lifecycle</label>
              <select id="rlife" value={life} onChange={e => setLife(e.target.value as LifecycleStage | 'all')} className={select}>
                <option value="all">All lifecycle stages</option>
                {(Object.keys(LIFECYCLE_LABEL) as (keyof typeof LIFECYCLE_LABEL)[]).map(k => <option key={k} value={k}>{LIFECYCLE_LABEL[k]}</option>)}
              </select>
            </>
          )}
          <label htmlFor="rst" className="sr-only">Ranking status</label>
          <select id="rst" value={status} onChange={e => setStatus(e.target.value as CitationRankingStatus | 'all')} className={select}>
            <option value="all">Official and provisional</option>
            <option value="official">{RANKING_STATUS_LABEL.official}</option>
            <option value="provisional">{RANKING_STATUS_LABEL.provisional}</option>
          </select>
        </div>
      </div>

      <div ref={tableTop} className="panel overflow-x-auto mt-4" style={{ scrollMarginTop: 72 }}>
        <table className="dtable min-w-[1000px]">
          <thead>
            <tr>
              <th className="text-right w-[80px]" title="Rank within the PSC category">Rank</th>
              <th>Journal</th>
              {categories && <th>PSC</th>}
              <th className="text-right" title="POSI Normalized Citation Indicator (PNCI-1.0), the ranking metric">PNCI</th>
              <th className="text-right">Percentile</th>
              <th>Citation Quartile</th>
              <th>POSI Zone</th>
              <th>AJR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(r => {
              const href = journalHref(r)
              return (
                <tr key={r.id}>
                  <td className="text-right font-mono tnum">
                    <span style={{ color: 'var(--ink)' }}>{r.rank}</span>
                    <span className="text-[11px]" style={{ color: 'var(--soft)' }}>/{r.n}</span>
                  </td>
                  <td className="max-w-[360px]">
                    {href ? <Link href={href} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{r.title}</Link> : <span className="font-medium">{r.title}</span>}
                    <div className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                      {[r.core ? 'Core Collection' : null, r.publisher, r.issn[0] && `ISSN ${r.issn[0]}`].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  {categories && <td className="font-mono text-[12.5px]"><Link href={`/rankings/${r.cat}/`} className="hover:underline">{r.cat}</Link></td>}
                  <td className="text-right font-mono tnum">{fmtScore(r.pnci, '–')}</td>
                  <td className="text-right font-mono tnum">{fmtPercentile(r.pct, '–')}</td>
                  <td><QuartileBadge q={r.q} provisional={r.status === 'provisional'} /></td>
                  <td><ZoneBadge z={r.zone} status={r.zoneStatus} /></td>
                  <td className="text-[13px] whitespace-nowrap">{r.ajr ? `Rating ${r.ajr}` : <span style={{ color: 'var(--soft)' }}>–</span>}</td>
                  <td><RankingStatusBadge status={r.status} /></td>
                </tr>
              )
            })}
            {!shown.length && (
              <tr><td colSpan={categories ? 9 : 8} className="py-12 text-center" style={{ color: 'var(--muted)' }}>No ranked journal matches these filters.</td></tr>
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
