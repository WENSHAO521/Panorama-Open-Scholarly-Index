// POSI Citation Ranking downloads (POSI-EVAL-1.0):
//   /data/rankings/citation-<year>.json             the edition's parameters and the per-category files
//   /data/rankings/citation-<year>.csv              the ranked journals (official and provisional)
//   /data/rankings/citation-<year>-all-<n>.csv      every journal of the edition, all statuses, in parts
//     (Cloudflare Pages serves files of at most 25 MiB; the whole edition,
//     ~158,000 journals, is larger than that as one CSV)
//   /data/rankings/citation-<year>-<category>.json  the journals of one PSC category ("unclassified": none)
//
// Deprecated, kept so existing links and scripts keep working:
//   /data/rankings/pcs-<year>.json, .csv, -<category>.json  PCS values only. The
//   PCS-Q rank, percentile, quartile and zone columns are empty: PCS no longer
//   determines any rank (see the `deprecated` notice in pcs-<year>.json).
import { getRankings, RANKING_VERSION, PNCI_VERSION, ZONES_EDITION_VERSION, EVALUATION_EDITION_VERSION, RANKING_SNAPSHOT, RANKING_THRESHOLDS, type RankedJournal } from '@/lib/rankings'

export const dynamic = 'force-static'
export const dynamicParams = false

const UNCLASSIFIED = 'unclassified'
/** Rows per part of the complete CSV: ~9 MiB, well under Pages' 25 MiB file limit. */
const PART_ROWS = 60_000
const partCount = (n: number) => Math.max(1, Math.ceil(n / PART_ROWS))
const partFiles = (year: number, n: number) => Array.from({ length: partCount(n) }, (_, i) => `citation-${year}-all-${i + 1}.csv`)
const catKey = (c: string | null) => c ?? UNCLASSIFIED

function categories(prefix: string) {
  const { all, year } = getRankings()
  const byCat = new Map<string, { journals: number; ranked: number; official: number }>()
  for (const r of all) {
    const e = byCat.get(catKey(r.cat)) ?? { journals: 0, ranked: 0, official: 0 }
    e.journals++
    if (r.rank != null) e.ranked++
    if (r.status === 'official') e.official++
    byCat.set(catKey(r.cat), e)
  }
  return [...byCat].sort(([a], [b]) => a.localeCompare(b)).map(([category, n]) => ({ category, file: `/data/rankings/${prefix}-${year}-${category}.json`, ...n }))
}

export function generateStaticParams() {
  const { all, year } = getRankings()
  return [...partFiles(year, all.length).map(file => ({ file })), ...['citation', 'pcs'].flatMap(prefix => [
    { file: `${prefix}-${year}.json` },
    { file: `${prefix}-${year}.csv` },
    ...categories(prefix).map(c => ({ file: `${prefix}-${year}-${c.category}.json` })),
  ])]
}

const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }

function row(r: RankedJournal) {
  return {
    posi_id: r.id, title: r.title, publisher: r.publisher, issn: r.issn, collection: r.core ? 'core' : 'indexed',
    ranking_category_id: r.cat, pnci: r.pnci, eligible_citable_items: r.items, citation_coverage: r.coverage,
    citation_rank: r.rank, citation_rank_total: r.n, citation_percentile: r.pct, citation_quartile: r.q,
    posi_zone: r.zone, zone_status: r.zoneStatus, citation_ranking_status: r.status, ranking_status_reason: r.reason,
    ajr_rating: r.ajr, lifecycle_stage: r.lifecycle, pci: r.pci, pcs: r.pcs,
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const { all, year } = getRankings()
  const legacy = file.startsWith('pcs-')
  const prefix = legacy ? 'pcs' : 'citation'
  const meta = {
    evaluation_version: EVALUATION_EDITION_VERSION, ranking_methodology_version: RANKING_VERSION, pnci_model_version: PNCI_VERSION,
    zones_version: ZONES_EDITION_VERSION, metric_year: year, ranking_snapshot_date: RANKING_SNAPSHOT, ranking_metric: 'PNCI',
    thresholds: RANKING_THRESHOLDS,
    note: 'Citation Quartiles and POSI Zones are based on PNCI-derived percentiles within eligible PSC categories. PCS and PCI are descriptive.',
  }
  const deprecated = {
    deprecated: true,
    notice: 'PCS-Q is retired (POSI-EVAL-1.0, 2026-09-28). PCS is a supplementary citation indicator and does not determine the official POSI Citation Rank, Citation Percentile, Citation Quartile, or POSI Zone. Rank, percentile, quartile and zone fields in this file are empty.',
    superseded_by: `/data/rankings/citation-${year}.json`,
  }
  if (file === `${prefix}-${year}.json`) {
    return Response.json(legacy
      ? { ...deprecated, metric: 'PCS', year, journals: all.length, csv: `/data/rankings/pcs-${year}.csv`, categories: categories('pcs') }
      : {
          ...meta, journals: all.length, ranked: all.filter(r => r.rank != null).length,
          csv: `/data/rankings/citation-${year}.csv`, csv_contents: 'ranked journals (official and provisional)',
          csv_all_parts: partFiles(year, all.length).map(f => `/data/rankings/${f}`), csv_all_contents: `every journal, all statuses, in parts of up to ${PART_ROWS.toLocaleString('en-US')} rows`,
          categories: categories('citation'),
        })
  }
  if (file.endsWith('.json')) {
    const cat = file.slice(`${prefix}-${year}-`.length, -'.json'.length)
    const rows = all.filter(r => catKey(r.cat) === cat)
    if (legacy) {
      return Response.json({ ...deprecated, metric: 'PCS', year, category: cat, journals: rows.map(r => ({ id: r.id, title: r.title, publisher: r.publisher, issn: r.issn, cat: r.cat, core: r.core, pcs: r.pcs, pci: r.pci, rank: null, n: null, pct: null, q: null, zone: null })) })
    }
    return Response.json({ ...meta, category: cat, journals: rows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || (b.pnci ?? -1) - (a.pnci ?? -1)).map(row) })
  }
  if (legacy) {
    const head = 'posi_id,title,publisher,issn,psc_category,status,pcs,eligible_items,pci,category_rank,category_n,category_percentile,category_quartile,category_zone,overall_rank,overall_n,overall_percentile,overall_quartile,overall_zone'
    const body = all.filter(r => r.pcs != null).map(r => [r.id, r.title, r.publisher, r.issn.join(' '), r.cat, r.core ? 'core' : 'indexed', r.pcs, r.items, r.pci, '', '', '', '', '', '', '', '', '', ''].map(cell).join(','))
    return new Response([head, ...body].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
  }
  const cols = Object.keys(row(all[0] ?? ({ issn: [] } as unknown as RankedJournal)))
  const part = file.match(/-all-(\d+)\.csv$/)
  const rows = part
    ? all.slice((Number(part[1]) - 1) * PART_ROWS, Number(part[1]) * PART_ROWS)
    : all.filter(r => r.rank != null).sort((a, b) => (a.cat ?? '').localeCompare(b.cat ?? '') || (a.rank ?? 0) - (b.rank ?? 0))
  const body = rows.map(r => { const o = row(r) as Record<string, unknown>; return cols.map(c => cell(Array.isArray(o[c]) ? (o[c] as string[]).join(' ') : o[c])).join(',') })
  return new Response([cols.join(','), ...body].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
}
