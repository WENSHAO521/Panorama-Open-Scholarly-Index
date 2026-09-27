// /data/rankings/pcs-<year>.csv: every ranked journal in one file.
// /data/rankings/pcs-<year>.json: the edition's parameters and the list of
// per-category files, /data/rankings/pcs-<year>-<category>.json (ranked and
// unranked journals of that category; "unclassified" for journals without
// one). The global edition as a single JSON file is larger than a static
// host serves (Cloudflare Pages: 25 MiB per file).
import { getRankings, RANKING_VERSION, MIN_ITEMS } from '@/lib/rankings'
import { ZONES_VERSION, ZONE_BOUNDS } from '@/lib/zones'

export const dynamic = 'force-static'
export const dynamicParams = false

const UNCLASSIFIED = 'unclassified'
const catKey = (c: string | null) => c ?? UNCLASSIFIED

function categoryFiles() {
  const { ranked, notRanked, year } = getRankings()
  const byCat = new Map<string, { ranked: number; not_ranked: number }>()
  const bump = (c: string | null, k: 'ranked' | 'not_ranked') => {
    const e = byCat.get(catKey(c)) ?? { ranked: 0, not_ranked: 0 }
    e[k]++
    byCat.set(catKey(c), e)
  }
  for (const r of ranked) bump(r.cat, 'ranked')
  for (const r of notRanked) bump(r.cat, 'not_ranked')
  return [...byCat].sort(([a], [b]) => a.localeCompare(b)).map(([category, n]) => ({ category, file: `/data/rankings/pcs-${year}-${category}.json`, ...n }))
}

export function generateStaticParams() {
  const { year } = getRankings()
  return [
    { file: `pcs-${year}.json` },
    { file: `pcs-${year}.csv` },
    ...categoryFiles().map(c => ({ file: `pcs-${year}-${c.category}.json` })),
  ]
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const { ranked, notRanked, year } = getRankings()
  const meta = { version: RANKING_VERSION, zones: { version: ZONES_VERSION, bounds: ZONE_BOUNDS }, metric: 'PCS', year, min_items: MIN_ITEMS }
  if (file === `pcs-${year}.json`) {
    return Response.json({ ...meta, ranked: ranked.length, not_ranked: notRanked.length, csv: `/data/rankings/pcs-${year}.csv`, categories: categoryFiles() })
  }
  if (file.endsWith('.json')) {
    const cat = file.slice(`pcs-${year}-`.length, -'.json'.length)
    return Response.json({ ...meta, category: cat, ranked: ranked.filter(r => catKey(r.cat) === cat), not_ranked: notRanked.filter(r => catKey(r.cat) === cat) })
  }
  const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const head = 'posi_id,title,publisher,issn,psc_category,status,pcs,eligible_items,pci,category_rank,category_n,category_percentile,category_quartile,category_zone,overall_rank,overall_n,overall_percentile,overall_quartile,overall_zone'
  const body = ranked.map(r => [r.id, r.title, r.publisher, r.issn.join(' '), r.cat, r.core ? 'core' : 'indexed', r.pcs, r.items, r.pci, r.rank, r.n, r.pct, r.q, r.zone, r.oRank, r.oN, r.oPct, r.oQ, r.oZone].map(cell).join(','))
  return new Response([head, ...body].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
}
