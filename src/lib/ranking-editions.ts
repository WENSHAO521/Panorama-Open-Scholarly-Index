// POSI Citation Ranking editions, one per year. Each year's edition is
// frozen once published (an archive on the data layer; a later change to a
// year becomes a numbered revision, never an overwrite). The current edition
// is the one in ./rankings.ts; earlier editions are downloaded before each
// build by scripts/sync-live-data.mjs into src/lib/generated/editions/:
// index.json lists every edition, and <year>.json holds an earlier year's
// journals with a ranking category. Server-only (reads files at build time).

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  getRankings, categoriesFrom, journalMeta, coreJournalIds, categoryName,
  RANKING_SNAPSHOT, RANKING_VERSION, PNCI_VERSION, EVALUATION_EDITION_VERSION, RANKING_THRESHOLDS,
  type Category, type RankedJournal,
} from './rankings'
import type { CitationQuartile, CitationRankingStatus, PosiZone, ZoneStatus } from './evaluation/rules'

export interface EditionInfo {
  year: number
  /** archive name (ranking-<year>, or ranking-<year>-r<n> for a revision); null before it is archived */
  edition: string | null
  revision: number | null
  /** every archive of the year, oldest first */
  archives: string[]
  current: boolean
  ranking_snapshot_date: string | null
  evaluation_version: string
  ranking_methodology_version: string
  pnci_model_version: string
  journals: number
  ranked: number
}

type Thresholds = { -readonly [K in keyof typeof RANKING_THRESHOLDS]: number }

export interface Edition {
  info: EditionInfo
  year: number
  current: boolean
  snapshot: string | null
  version: string
  pnciVersion: string
  thresholds: Thresholds
  all: RankedJournal[]
  /** journals with a category rank, by PNCI descending */
  ranked: RankedJournal[]
  byId: Map<string, RankedJournal>
}

const DIR = join(process.cwd(), 'src/lib/generated/editions')

function readJson<T>(file: string): T | null {
  try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) as T : null } catch { return null }
}

let list: EditionInfo[] | null = null

/** Every edition, newest first. Always includes the current one. */
export function getEditionList(): EditionInfo[] {
  if (list) return list
  const { year, all, ranked } = getRankings()
  const current: EditionInfo = {
    year, edition: null, revision: null, archives: [], current: true, ranking_snapshot_date: RANKING_SNAPSHOT,
    evaluation_version: EVALUATION_EDITION_VERSION, ranking_methodology_version: RANKING_VERSION, pnci_model_version: PNCI_VERSION,
    journals: all.length, ranked: ranked.length,
  }
  const found = readJson<EditionInfo[]>(join(DIR, 'index.json')) ?? []
  // An earlier year is listed only when its edition file is there to build its pages from.
  const earlier = found.filter(e => e.year !== year && existsSync(join(DIR, `${e.year}.json`))).map(e => ({ ...e, current: false }))
  const cur = found.find(e => e.year === year)
  list = [cur ? { ...cur, current: true } : current, ...earlier].sort((a, b) => b.year - a.year)
  return list
}

interface ArchivedRecord {
  journal_id: string; title: string | null; publisher: string | null; issn: string[]; ranking_category_id: string | null
  pnci: number | null; eligible_citable_items: number | null; citation_coverage: number | null
  citation_rank: number | null; citation_rank_total: number | null; citation_percentile: number | null
  citation_quartile: CitationQuartile | null; posi_zone: PosiZone | null; zone_status: ZoneStatus
  citation_ranking_status: CitationRankingStatus; ranking_status_reason: string | null
  pci: number | null; pcs: number | null
}
interface ArchivedEdition {
  metric_year: number; snapshot_date: string | null; ranking_methodology_version: string; pnci_model_version: string
  parameters?: Partial<Thresholds>; records: ArchivedRecord[]
}

const editions = new Map<number, Edition | null>()

/**
 * One edition by year. Earlier editions show what was published: their
 * ranks, quartiles and zones as archived. Core Collection membership and AJR
 * Ratings are current-state facts and are not shown for them.
 */
export function getEdition(year: number): Edition | null {
  if (editions.has(year)) return editions.get(year)!
  const info = getEditionList().find(e => e.year === year)
  let e: Edition | null = null
  if (info?.current) {
    const { all, ranked, byId } = getRankings()
    e = { info, year, current: true, snapshot: RANKING_SNAPSHOT, version: RANKING_VERSION, pnciVersion: PNCI_VERSION, thresholds: { ...RANKING_THRESHOLDS }, all, ranked, byId }
  } else if (info) {
    const ed = readJson<ArchivedEdition>(join(DIR, `${year}.json`))
    if (ed) {
      const meta = journalMeta()
      const coreIds = coreJournalIds()
      const all: RankedJournal[] = ed.records.map(r => {
        const m = meta.get(r.journal_id)
        return {
          id: r.journal_id, code: m?.code ?? null, title: m?.title ?? r.title ?? r.journal_id, publisher: m?.publisher ?? r.publisher,
          issn: m?.issn.length ? m.issn : r.issn, cat: r.ranking_category_id, core: false,
          pnci: r.pnci, pcs: r.pcs, pci: coreIds.has(r.journal_id) ? r.pci : null, items: r.eligible_citable_items, coverage: r.citation_coverage,
          rank: r.citation_rank, n: r.citation_rank_total, pct: r.citation_percentile, q: r.citation_quartile,
          zone: r.posi_zone, zoneStatus: r.zone_status, status: r.citation_ranking_status, reason: r.ranking_status_reason,
          ajr: null, lifecycle: null,
        }
      })
      const ranked = all.filter(r => r.rank != null).sort((a, b) => (b.pnci ?? 0) - (a.pnci ?? 0) || (a.cat ?? '').localeCompare(b.cat ?? ''))
      e = {
        info, year, current: false, snapshot: ed.snapshot_date, version: ed.ranking_methodology_version, pnciVersion: ed.pnci_model_version,
        thresholds: { ...RANKING_THRESHOLDS, ...ed.parameters }, all, ranked, byId: new Map(all.map(r => [r.id, r])),
      }
    }
  }
  editions.set(year, e)
  return e
}

export function editionCategories(e: Edition): Category[] {
  return categoriesFrom(e.ranked)
}

export function editionCategoryRanking(e: Edition, code: string): RankedJournal[] {
  return e.ranked.filter(r => r.cat === code).sort((a, b) => a.rank! - b.rank! || (b.pnci ?? 0) - (a.pnci ?? 0))
}

/** Journals of a category with citation data but no category rank. */
export function editionCategoryUnranked(e: Edition, code: string): RankedJournal[] {
  return e.all.filter(r => r.cat === code && r.rank == null)
}

export interface HistoryRow {
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

/** A journal's ranking in every edition that ranked it, newest first. */
export function getRankingHistory(posiId: string | null | undefined): HistoryRow[] {
  if (!posiId) return []
  const rows: HistoryRow[] = []
  for (const info of getEditionList()) {
    const r = getEdition(info.year)?.byId.get(posiId)
    if (!r || r.rank == null) continue
    rows.push({ year: info.year, current: info.current, cat: r.cat, catName: categoryName(r.cat), rank: r.rank, total: r.n, q: r.q, zone: r.zone, zoneStatus: r.zoneStatus, status: r.status })
  }
  return rows
}
