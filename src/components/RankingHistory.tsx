// A journal's Citation Ranking in every edition that ranked it, newest
// first. Hook-free: used by the static record pages and the in-browser
// journal profiles alike. Each edition is frozen as published and computed
// under its own methodology version, so a change between years reflects both
// the journal and its category that year.

import Link from 'next/link'
import type { CitationQuartile, CitationRankingStatus, PosiZone, ZoneStatus } from '@/lib/evaluation/rules'
import { QuartileBadge, ZoneBadge } from './Evaluation'
import { fmt } from './db'

export interface RankingHistoryRow {
  year: number
  current: boolean
  cat: string | null
  catName: string | null
  rank: number | null
  total: number | null
  q: CitationQuartile | null
  zone: PosiZone | null
  zoneStatus: ZoneStatus | null
  status: CitationRankingStatus
}

/** One compact entry per edition: year and badges, then category and rank. */
export function RankingHistory({ rows }: { rows: RankingHistoryRow[] }) {
  if (!rows.length) return null
  return (
    <div>
      <ol className="divide-y divide-[var(--line-soft)]">
        {rows.map(r => {
          const href = r.cat ? `${r.current ? '/rankings' : `/rankings/edition/${r.year}`}/${r.cat}/` : null
          const zone = r.zone && r.zoneStatus !== 'not_assigned'
          return (
            <li key={r.year} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono tnum text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {r.year}{r.current && <span className="ml-1.5 font-sans text-[11.5px] font-normal" style={{ color: 'var(--muted)' }}>current</span>}
                </span>
                <span className="flex items-center gap-1.5">
                  <QuartileBadge q={r.q} provisional={r.status === 'provisional'} />
                  {zone && <ZoneBadge z={r.zone} status={r.zoneStatus!} />}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>
                {href ? <Link href={href} className="link">{r.catName ?? r.cat}</Link> : (r.catName ?? r.cat ?? '–')}
                {r.rank != null && <> · rank <span className="font-mono tnum" style={{ color: 'var(--ink-2)' }}>{fmt(r.rank)}</span> of {fmt(r.total ?? 0)}</>}
              </p>
            </li>
          )
        })}
      </ol>
      <p className="mt-2.5 text-[11.5px] leading-snug" style={{ color: 'var(--soft)' }}>
        Editions are kept as published; each ranks the journal within its category that year.
      </p>
    </div>
  )
}
