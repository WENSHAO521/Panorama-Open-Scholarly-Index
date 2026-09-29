// A journal's Citation Ranking in every edition that ranked it, newest
// first. Hook-free: used by the static record pages and the in-browser
// journal profiles alike. Each edition is frozen as published and computed
// under its own methodology version, so a change between years reflects both
// the journal and its category that year.

import Link from 'next/link'
import type { CitationQuartile, CitationRankingStatus, PosiZone, ZoneStatus } from '@/lib/evaluation/rules'
import { QuartileBadge, ZoneBadge, RankingStatusBadge } from './Evaluation'
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

export function RankingHistory({ rows }: { rows: RankingHistoryRow[] }) {
  if (!rows.length) return null
  return (
    <div>
      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[520px]">
          <thead><tr><th>Edition</th><th>Category</th><th className="text-right">Rank</th><th>Quartile</th><th>Zone</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const href = r.cat ? `${r.current ? '/rankings' : `/rankings/edition/${r.year}`}/${r.cat}/` : null
              return (
                <tr key={r.year}>
                  <td className="font-mono tnum whitespace-nowrap">{r.year}{r.current && <span className="ml-1.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>current</span>}</td>
                  <td className="text-[13.5px]">{href ? <Link href={href} className="link">{r.catName ?? r.cat}</Link> : (r.catName ?? r.cat ?? '–')}</td>
                  <td className="text-right font-mono tnum whitespace-nowrap">{r.rank != null ? `${fmt(r.rank)} / ${fmt(r.total ?? 0)}` : '–'}</td>
                  <td><QuartileBadge q={r.q} provisional={r.status === 'provisional'} /></td>
                  <td><ZoneBadge z={r.zone} status={r.zoneStatus ?? 'not_assigned'} /></td>
                  <td><RankingStatusBadge status={r.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] leading-snug" style={{ color: 'var(--soft)' }}>
        Each edition is published once a year and kept as published; ranks compare a journal with its category in that year.
      </p>
    </div>
  )
}
