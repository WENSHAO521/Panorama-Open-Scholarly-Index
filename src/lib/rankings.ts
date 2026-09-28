// POSI Citation Ranking (POSI-EVAL-1.0, CITATION-RANK-1.0).
//
// This module does not compute ranks. It reads the Citation Ranking edition
// published by posi-engine (scripts/run-citation-ranking.mjs): PNCI-1.0 for
// every journal, and rank, mid-rank percentile, Citation Quartile and POSI
// Zone within each PSC category. The edition is downloaded before each build
// by scripts/sync-live-data.mjs into src/lib/generated/citation-ranking.json;
// src/lib/citation-ranking.json is the committed fallback. The edition is
// validated on load (./evaluation/check.ts); an inconsistent edition fails
// the build.
//
// PCS values come from the PCS edition (src/lib/generated/pcs-q.json, or the
// committed src/lib/pcs-q.json). PCS is descriptive here: the PCS-Q ranks,
// percentiles and quartiles in that file are retired and never read.

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { getCoreCollection, getCuratedNonCoreJournals } from './data'
import { alternateTitleText } from './titles'
import { BENCHMARK_JOURNALS } from './benchmark-journals'
import { getAllPciEntries } from './pci'
import { ajrOf, type CitationRankingRecord } from './evaluation/journal'
import { validateCitationEdition, validateAjrRatings } from './evaluation/check'
import {
  RANKING_THRESHOLDS, CITATION_RANK_VERSION, PNCI_MODEL_VERSION, ZONES_VERSION, EVALUATION_VERSION,
  type AjrRating, type CitationQuartile, type CitationRankingStatus, type LifecycleStage, type PosiZone, type ZoneStatus,
} from './evaluation/rules'
import psc from './psc-v1.0.snapshot.json'
import titles from './ranking-titles.json'
import fallbackEdition from './citation-ranking.json'
import fallbackPcs from './pcs-q.json'

export type { CitationQuartile as Quartile }

interface Edition {
  evaluation_version: string
  ranking_methodology_version: string
  pnci_model_version: string
  zones_version: string
  metric_year: number
  snapshot_date: string | null
  generated_at: string | null
  records: CitationRankingRecord[]
}

interface PcsRecord { journal_id: string; pcs: number | null; pcs_eligible_items: number | null; title?: string | null; publisher?: string | null; issn?: string[] }

function loadJson<T>(name: string, fallback: unknown): T {
  const generated = join(process.cwd(), 'src/lib/generated', name)
  try {
    if (existsSync(generated)) return JSON.parse(readFileSync(generated, 'utf-8')) as T
  } catch { /* fall through to the committed file */ }
  return fallback as T
}

const E = loadJson<Edition>('citation-ranking.json', fallbackEdition)

export const RANKING_VERSION = E.ranking_methodology_version ?? CITATION_RANK_VERSION
export const PNCI_VERSION = E.pnci_model_version ?? PNCI_MODEL_VERSION
export const ZONES_EDITION_VERSION = E.zones_version ?? ZONES_VERSION
export const EVALUATION_EDITION_VERSION = E.evaluation_version ?? EVALUATION_VERSION
/** YYYY-MM-DD the edition was computed, null before the first PNCI edition. */
export const RANKING_SNAPSHOT: string | null = E.snapshot_date ?? null
export const RANKING_YEAR: number = E.metric_year
/** True once a PNCI-1.0 edition has been published. */
export const RANKING_AVAILABLE = E.records.length > 0
/** Ranking downloads (CSV, per-category JSON), published by posi-data-delivery
 *  (scripts/build-downloads.mjs) rather than built into this site. */
export const RANKING_DOWNLOADS = 'https://data.posi.panorama-sg.com/downloads/rankings'
export { RANKING_THRESHOLDS }

export interface RankedJournal {
  id: string
  /** journal_code when POSI publishes a record page for it */
  code: string | null
  title: string
  alt?: string[]
  publisher: string | null
  issn: string[]
  cat: string | null
  core: boolean
  pnci: number | null
  pcs: number | null
  pci: number | null
  items: number | null
  coverage: number | null
  rank: number | null
  n: number | null
  pct: number | null
  q: CitationQuartile | null
  zone: PosiZone | null
  zoneStatus: ZoneStatus
  status: CitationRankingStatus
  reason: string | null
  ajr: AjrRating | null
  lifecycle: LifecycleStage | null
}

export interface Category {
  code: string
  name: string
  domain: string
  domainName: string
  /** journals with a (official or provisional) rank */
  ranked: number
  official: number
  core: number
}

interface Meta { code: string | null; title: string; publisher: string | null; issn: string[]; alt?: string[]; ajr: AjrRating | null; lifecycle: LifecycleStage | null; ajrScore: number | null; storedRating: string | null }

const PSC = psc.categories as { code: string; name: string; level: number; parent: string | null }[]
const PSC_NAME = Object.fromEntries(PSC.map(c => [c.code, c.name]))

function metaIndex(): { meta: Map<string, Meta>; coreIds: Set<string> } {
  const meta = new Map<string, Meta>()
  const coreIds = new Set(getCoreCollection().map(j => j.posi_id).filter((x): x is string => !!x))
  for (const j of [...getCoreCollection(), ...getCuratedNonCoreJournals(), ...BENCHMARK_JOURNALS]) {
    if (!j.posi_id) continue
    const a = ajrOf(j)
    meta.set(j.posi_id, {
      code: j.journal_code, title: j.title, publisher: j.publisher || null,
      issn: [j.issn_online, j.issn_print].filter((x, n, arr): x is string => !!x && arr.indexOf(x) === n),
      ...(j.alternate_titles?.length ? { alt: j.alternate_titles.map(alternateTitleText) } : {}),
      ajr: a.rating, ajrScore: a.score, lifecycle: a.lifecycle === 'unknown' ? null : a.lifecycle,
      storedRating: (j.early_stage_rating as { rating?: string | null } | null | undefined)?.rating ?? null,
    })
  }
  for (const t of (titles as { journals: { id: string; t: string; p: string | null; i: string[] }[] }).journals) {
    if (!meta.has(t.id)) meta.set(t.id, { code: null, title: t.t, publisher: t.p, issn: t.i, ajr: null, ajrScore: null, lifecycle: null, storedRating: null })
  }
  return { meta, coreIds }
}

let cache: { all: RankedJournal[]; ranked: RankedJournal[]; byId: Map<string, RankedJournal>; year: number } | null = null

/**
 * Every journal in the edition (all statuses). `ranked` holds the journals
 * with a category rank (official or provisional), ordered by PNCI descending.
 */
export function getRankings() {
  if (cache) return cache
  const problems = [
    ...validateCitationEdition(E.records),
  ]
  const { meta, coreIds } = metaIndex()
  problems.push(...validateAjrRatings([...meta.entries()].filter(([, m]) => m.ajrScore != null).map(([id, m]) => ({ id, score: m.ajrScore, storedRating: m.storedRating }))))
  if (problems.length) {
    throw new Error(`Evaluation invariants failed (${problems.length}):\n${problems.slice(0, 20).join('\n')}`)
  }
  const pci = new Map(getAllPciEntries().map(e => [e.journal_id, e.pci]))
  const pcsEdition = loadJson<{ records: PcsRecord[] }>('pcs-q.json', fallbackPcs)
  const pcs = new Map(pcsEdition.records.map(r => [r.journal_id, r]))
  const all: RankedJournal[] = []
  for (const r of E.records) {
    const p = pcs.get(r.journal_id)
    const m = meta.get(r.journal_id) ?? { code: null, title: r.title ?? p?.title ?? r.journal_id, publisher: r.publisher ?? p?.publisher ?? null, issn: r.issn ?? p?.issn ?? [], ajr: null, ajrScore: null, lifecycle: null, storedRating: null }
    all.push({
      id: r.journal_id, code: m.code, title: m.title, ...(m.alt ? { alt: m.alt } : {}), publisher: m.publisher, issn: m.issn,
      cat: r.ranking_category_id, core: coreIds.has(r.journal_id),
      pnci: r.pnci, pcs: r.pcs ?? p?.pcs ?? null, pci: r.pci ?? pci.get(r.journal_id) ?? null,
      items: r.eligible_citable_items, coverage: r.citation_coverage,
      rank: r.citation_rank, n: r.citation_rank_total, pct: r.citation_percentile, q: r.citation_quartile,
      zone: r.posi_zone, zoneStatus: r.zone_status, status: r.citation_ranking_status, reason: r.ranking_status_reason,
      ajr: m.ajr, lifecycle: m.lifecycle ?? r.lifecycle_stage ?? null,
    })
  }
  const ranked = all.filter(r => r.rank != null).sort((a, b) => (b.pnci ?? 0) - (a.pnci ?? 0) || (a.cat ?? '').localeCompare(b.cat ?? ''))
  cache = { all, ranked, byId: new Map(all.map(r => [r.id, r])), year: E.metric_year }
  return cache
}

/** Every PSC level-2 category, so every /rankings/<code>/ URL exists whether or not the category is ranked yet. */
export function getCategories(): Category[] {
  const { ranked } = getRankings()
  return PSC.filter(c => c.level === 2).map(c => {
    const rows = ranked.filter(r => r.cat === c.code)
    return {
      code: c.code, name: c.name, domain: c.parent!, domainName: PSC_NAME[c.parent!] ?? c.parent!,
      ranked: rows.length, official: rows.filter(r => r.status === 'official').length, core: rows.filter(r => r.core).length,
    }
  })
}

export function getCategoryRanking(code: string): RankedJournal[] {
  return getRankings().ranked.filter(r => r.cat === code).sort((a, b) => a.rank! - b.rank! || (b.pnci ?? 0) - (a.pnci ?? 0))
}

/** Journals of a category with PNCI but no category rank (category below 20, too few items, low coverage). */
export function getCategoryUnranked(code: string): RankedJournal[] {
  return getRankings().all.filter(r => r.cat === code && r.rank == null)
}

export function getJournalRanking(posiId: string | null | undefined): RankedJournal | null {
  if (!posiId) return null
  return getRankings().byId.get(posiId) ?? null
}

/** The edition record itself, for the journal API. */
let recordIndex: Map<string, CitationRankingRecord> | null = null
export function getCitationRecord(posiId: string | null | undefined): CitationRankingRecord | null {
  if (!posiId) return null
  recordIndex ??= new Map(E.records.map(r => [r.journal_id, r]))
  return recordIndex.get(posiId) ?? null
}

/** PCS for a journal from the PCS edition (supplementary indicator). */
export function getPcsValue(posiId: string | null | undefined): number | null {
  if (!posiId) return null
  return getJournalRanking(posiId)?.pcs ?? null
}

export function categoryName(code: string | null): string | null {
  return code ? PSC_NAME[code] ?? null : null
}

/** Count of official Citation Quartile placements (for "C-Q1 journals" style counts). */
export function countOfficialQuartile(q: CitationQuartile): number {
  return getRankings().ranked.filter(r => r.status === 'official' && r.q === q).length
}
