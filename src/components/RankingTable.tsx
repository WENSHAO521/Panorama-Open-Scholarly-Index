'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import type { RankedJournal } from '@/lib/rankings'
import { AJR_RATING_SCALE, type CitationQuartile, type CitationRankingStatus, type LifecycleStage, type PosiZone } from '@/lib/evaluation/rules'
import { fmtPercentile, fmtScore, quartileLabel } from '@/lib/evaluation/display'
import { QuartileBadge, ZoneBadge, RankingStatusBadge, rankingStatusLabel } from './Evaluation'
import { fmt } from './db'
import type { Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

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

const en = {
  collection: 'Collection', all: 'All ({n})', core: 'Core ({n})', indexed: 'Indexed ({n})',
  find: 'Find a journal', findPlaceholder: 'Find a journal, publisher or ISSN',
  category: 'PSC category', allCategories: 'All PSC categories',
  quartile: 'Citation Quartile', allQuartiles: 'All Citation Quartiles',
  zone: 'POSI Zone', allZones: 'All POSI Zones',
  ajr: 'AJR Rating', allAjr: 'All AJR Ratings', rating: 'Rating {r}',
  lifecycle: 'Lifecycle', allLifecycle: 'All lifecycle stages',
  lifecycles: { observation: 'Observation', early_stage: 'AJR-E (12–59 months)', mature: 'AJR-M (60+ months)' } as Record<Exclude<LifecycleStage, 'unknown'>, string>,
  status: 'Ranking status', allStatus: 'Official and provisional',
  cols: { rank: 'Rank', rankTitle: 'Rank within the PSC category', journal: 'Journal', pnciTitle: 'POSI Normalized Citation Indicator (PNCI-1.0), the ranking metric', percentile: 'Percentile', quartile: 'Citation Quartile', zone: 'POSI Zone', ajr: 'AJR', status: 'Status' },
  coreCollection: 'Core Collection', sep: ', ',
  none: 'No ranked journal matches these filters.',
  pagination: 'Pagination', previous: 'Previous', next: 'Next', page: 'page {page} of {pages}',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    collection: '收录类型', all: '全部（{n}）', core: '核心合集（{n}）', indexed: '收录（{n}）',
    find: '查找期刊', findPlaceholder: '查找期刊、出版商或 ISSN',
    category: 'PSC 学科类别', allCategories: '全部 PSC 类别',
    quartile: '引文分区', allQuartiles: '全部引文分区',
    zone: 'POSI Zone', allZones: '全部 POSI Zone',
    ajr: 'AJR 评级', allAjr: '全部 AJR 评级', rating: '评级 {r}',
    lifecycle: '生命周期', allLifecycle: '全部生命周期阶段',
    lifecycles: { observation: '观察期', early_stage: 'AJR-E（创刊 12–59 个月）', mature: 'AJR-M（创刊 60 个月及以上）' },
    status: '排名状态', allStatus: '正式与暂定',
    cols: { rank: '名次', rankTitle: '在 PSC 类别内的名次', journal: '期刊', pnciTitle: 'POSI 标准化引文指标（PNCI-1.0），即排名指标', percentile: '百分位', quartile: '引文分区', zone: 'POSI Zone', ajr: 'AJR', status: '状态' },
    coreCollection: '核心合集', sep: '，',
    none: '没有符合筛选条件的排名期刊。',
    pagination: '分页', previous: '上一页', next: '下一页', page: '第 {page} 页，共 {pages} 页',
  },
}

/**
 * Citation Ranking table. Rows are ordered by PNCI, highest first; ranks are
 * always category ranks. `categories` (for the all-categories list) adds a
 * PSC category filter and column.
 */
export function RankingTable({ rows, fileName, categories }: { rows: RankedJournal[]; fileName: string; categories?: { code: string; name: string }[] }) {
  const locale = useLocale()
  const w = WORDS[locale]
  const LIFECYCLE_LABEL = w.lifecycles
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
          <div role="tablist" aria-label={w.collection} className="inline-flex rounded-[var(--radius)] p-0.5 self-start" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            {([['all', fill(w.all, { n: fmt(rows.length) })], ['core', fill(w.core, { n: fmt(coreCount) })], ['indexed', fill(w.indexed, { n: fmt(rows.length - coreCount) })]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={collection === k} onClick={() => setCollection(k)}
                className="px-3 h-8 text-[13px] rounded-[var(--radius)]"
                style={collection === k ? { background: 'var(--surface)', color: 'var(--ink)', fontWeight: 500, boxShadow: 'var(--shadow-1)' } : { color: 'var(--muted)' }}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <label htmlFor="rsearch" className="sr-only">{w.find}</label>
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--soft)' }} />
            <input id="rsearch" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={w.findPlaceholder} className="input h-9 pl-9 text-[13.5px]" />
          </div>
          <button type="button" className="btn h-9 self-start" onClick={download} disabled={!filtered.length}><DownloadSimple className="h-4 w-4" /> CSV</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories && (
            <>
              <label htmlFor="rcat" className="sr-only">{w.category}</label>
              <select id="rcat" value={cat} onChange={e => setCat(e.target.value)} className={select}>
                <option value="all">{w.allCategories}</option>
                {categories.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
              </select>
            </>
          )}
          <label htmlFor="rq" className="sr-only">{w.quartile}</label>
          <select id="rq" value={quart} onChange={e => setQuart(e.target.value as CitationQuartile | 'all')} className={select}>
            <option value="all">{w.allQuartiles}</option>
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(x => <option key={x} value={x}>{quartileLabel(x)}</option>)}
          </select>
          <label htmlFor="rz" className="sr-only">{w.zone}</label>
          <select id="rz" value={zone} onChange={e => setZone(Number(e.target.value) as PosiZone | 0)} className={select}>
            <option value={0}>{w.allZones}</option>
            {([1, 2, 3, 4] as const).map(z => <option key={z} value={z}>Zone {z}</option>)}
          </select>
          {hasAjr && (
            <>
              <label htmlFor="rajr" className="sr-only">{w.ajr}</label>
              <select id="rajr" value={ajr} onChange={e => setAjr(e.target.value)} className={select}>
                <option value="all">{w.allAjr}</option>
                {AJR_RATING_SCALE.map(([r]) => <option key={r} value={r}>{fill(w.rating, { r })}</option>)}
              </select>
            </>
          )}
          {hasLife && (
            <>
              <label htmlFor="rlife" className="sr-only">{w.lifecycle}</label>
              <select id="rlife" value={life} onChange={e => setLife(e.target.value as LifecycleStage | 'all')} className={select}>
                <option value="all">{w.allLifecycle}</option>
                {(Object.keys(LIFECYCLE_LABEL) as (keyof typeof LIFECYCLE_LABEL)[]).map(k => <option key={k} value={k}>{LIFECYCLE_LABEL[k]}</option>)}
              </select>
            </>
          )}
          <label htmlFor="rst" className="sr-only">{w.status}</label>
          <select id="rst" value={status} onChange={e => setStatus(e.target.value as CitationRankingStatus | 'all')} className={select}>
            <option value="all">{w.allStatus}</option>
            <option value="official">{rankingStatusLabel('official', locale)}</option>
            <option value="provisional">{rankingStatusLabel('provisional', locale)}</option>
          </select>
        </div>
      </div>

      <div ref={tableTop} className="panel overflow-x-auto mt-4" style={{ scrollMarginTop: 72 }}>
        <table className="dtable min-w-[1000px]">
          <thead>
            <tr>
              <th className="text-right w-[80px]" title={w.cols.rankTitle}>{w.cols.rank}</th>
              <th>{w.cols.journal}</th>
              {categories && <th>PSC</th>}
              <th className="text-right" title={w.cols.pnciTitle}>PNCI</th>
              <th className="text-right">{w.cols.percentile}</th>
              <th>{w.cols.quartile}</th>
              <th>{w.cols.zone}</th>
              <th>{w.cols.ajr}</th>
              <th>{w.cols.status}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(r => {
              const jh = journalHref(r)
              const href = jh && localizedHref(locale, jh)
              return (
                <tr key={r.id}>
                  <td className="text-right font-mono tnum">
                    <span style={{ color: 'var(--ink)' }}>{r.rank}</span>
                    <span className="text-[11px]" style={{ color: 'var(--soft)' }}>/{r.n}</span>
                  </td>
                  <td className="max-w-[360px]">
                    {href ? <Link href={href} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{r.title}</Link> : <span className="font-medium">{r.title}</span>}
                    <div className="text-[12.5px] truncate" style={{ color: 'var(--muted)' }}>
                      {[r.core ? w.coreCollection : null, r.publisher, r.issn[0] && `ISSN ${r.issn[0]}`].filter(Boolean).join(w.sep)}
                    </div>
                  </td>
                  {categories && <td className="font-mono text-[12.5px]"><Link href={localizedHref(locale, `/rankings/${r.cat}/`)} className="hover:underline">{r.cat}</Link></td>}
                  <td className="text-right font-mono tnum">{fmtScore(r.pnci, '–')}</td>
                  <td className="text-right font-mono tnum">{fmtPercentile(r.pct, '–')}</td>
                  <td><QuartileBadge q={r.q} provisional={r.status === 'provisional'} locale={locale} /></td>
                  <td><ZoneBadge z={r.zone} status={r.zoneStatus} locale={locale} /></td>
                  <td className="text-[13px] whitespace-nowrap">{r.ajr ? fill(w.rating, { r: r.ajr }) : <span style={{ color: 'var(--soft)' }}>–</span>}</td>
                  <td><RankingStatusBadge status={r.status} locale={locale} /></td>
                </tr>
              )
            })}
            {!shown.length && (
              <tr><td colSpan={categories ? 9 : 8} className="py-12 text-center" style={{ color: 'var(--muted)' }}>{w.none}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label={w.pagination} className="flex items-center justify-between mt-4 text-[13px]">
          <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => goTo(page - 1)}>{w.previous}</button>
          <span className="font-mono" style={{ color: 'var(--muted)' }}>{fill(w.page, { page, pages })}</span>
          <button type="button" className="btn btn-sm" disabled={page === pages} onClick={() => goTo(page + 1)}>{w.next}</button>
        </nav>
      )}
    </div>
  )
}
