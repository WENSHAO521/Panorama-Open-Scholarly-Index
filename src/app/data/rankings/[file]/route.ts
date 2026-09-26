// /data/rankings/pcs-<year>.{json,csv}: the full ranking edition.
import { getRankings, RANKING_VERSION, MIN_ITEMS } from '@/lib/rankings'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  const { year } = getRankings()
  return [{ file: `pcs-${year}.json` }, { file: `pcs-${year}.csv` }]
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const { ranked, notRanked, year } = getRankings()
  if (file.endsWith('.json')) {
    return Response.json({ version: RANKING_VERSION, metric: 'PCS', year, min_items: MIN_ITEMS, ranked, not_ranked: notRanked })
  }
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = 'posi_id,title,publisher,issn,psc_category,status,pcs,eligible_items,pci,category_rank,category_n,category_percentile,category_quartile,overall_rank,overall_n,overall_percentile,overall_quartile'
  const body = ranked.map(r => [r.id, r.title, r.publisher, r.issn.join(' '), r.cat, r.core ? 'core' : 'indexed', r.pcs, r.items, r.pci, r.rank, r.n, r.pct, r.q, r.oRank, r.oN, r.oPct, r.oQ].map(cell).join(','))
  return new Response([head, ...body].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
}
