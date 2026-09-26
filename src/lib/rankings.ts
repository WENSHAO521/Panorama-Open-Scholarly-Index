// POSI Open Journal Rankings: the PCS-Q track.
//
// This module does not compute ranks. It reads the PCS-Q edition published
// by posi-engine (scripts/run-pcs-q.mjs, posi-data/PCS-Q-1.0-SPEC.md). The
// edition is downloaded before each build by scripts/sync-live-data.mjs into
// src/lib/generated/pcs-q.json; src/lib/pcs-q.json is the committed fallback. The
// algorithm (RANK-1.0: mid-rank ties, percentile from mid-rank, quartile
// thresholds, MIN_CATEGORY_SIZE, rank-eligible PSC confidence) lives only
// in the engine, so the site can never drift from the published edition.

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { getCoreCollection, getCandidateJournals } from './data'
import { BENCHMARK_JOURNALS } from './benchmark-journals'
import { getAllPciEntries } from './pci'
import psc from './psc-v1.0.snapshot.json'
import titles from './ranking-titles.json'
import fallbackEdition from './pcs-q.json'

export type Quartile = 'Q1' | 'Q2' | 'Q3' | 'Q4'

interface EditionRecord {
  journal_id: string
  title?: string | null
  publisher?: string | null
  issn?: string[]
  pcs: number | null
  pcs_eligible_items: number | null
  category_code: string | null
  rank: number | null
  rank_mid: number | null
  category_size: number | null
  percentile: number | null
  quartile: Quartile | null
  overall_rank: number | null
  overall_size: number | null
  overall_percentile: number | null
  overall_quartile: Quartile | null
  ranking_method: string
  exclusion_reason: string | null
}

function loadEdition(): unknown {
  const generated = join(process.cwd(), 'src/lib/generated/pcs-q.json')
  try {
    if (existsSync(generated)) return JSON.parse(readFileSync(generated, 'utf-8'))
  } catch { /* fall through to the committed edition */ }
  return fallbackEdition
}

const E = loadEdition() as {
  methodology_version: string
  metric_year: number
  parameters: { min_items: number; min_coverage: number; min_category_size: number }
  records: EditionRecord[]
}

export const RANKING_VERSION = E.methodology_version
export const MIN_ITEMS = E.parameters.min_items
export const MIN_CATEGORY_SIZE = E.parameters.min_category_size

export const EXCLUSION_TEXT: Record<string, string> = {
  no_pcs: 'No PCS for this window',
  too_few_items: `Fewer than ${E.parameters.min_items} eligible items`,
  incomplete_fetch: 'Citation data fetch incomplete',
  no_psc_category: 'No subject category assigned',
  psc_confidence_not_rank_eligible: 'Subject assignment not high-confidence',
  category_below_min_size: `Category has fewer than ${E.parameters.min_category_size} ranked journals`,
}

export interface RankedJournal {
  id: string
  /** journal_code when POSI publishes a record page for it */
  code: string | null
  title: string
  publisher: string | null
  issn: string[]
  cat: string | null
  /** true when the journal has an overall rank but no category rank */
  lowConfidence: boolean
  exclusion: string | null
  core: boolean
  pcs: number
  items: number
  pci: number | null
  rank: number | null
  n: number | null
  pct: number | null
  q: Quartile | null
  oRank: number
  oN: number
  oPct: number | null
  oQ: Quartile | null
}

export interface NotRanked {
  id: string
  code: string | null
  title: string
  cat: string | null
  core: boolean
  pcs: number | null
  items: number | null
  reason: string
}

export interface Category {
  code: string
  name: string
  domain: string
  domainName: string
  ranked: number
  core: number
}

interface Meta { code: string | null; title: string; publisher: string | null; issn: string[] }

const PSC = psc.categories as { code: string; name: string; level: number; parent: string | null }[]
const PSC_NAME = Object.fromEntries(PSC.map(c => [c.code, c.name]))

function metaIndex(): { meta: Map<string, Meta>; coreIds: Set<string> } {
  const meta = new Map<string, Meta>()
  const coreIds = new Set(getCoreCollection().map(j => j.posi_id).filter((x): x is string => !!x))
  for (const j of [...getCoreCollection(), ...getCandidateJournals(), ...BENCHMARK_JOURNALS]) {
    if (!j.posi_id) continue
    meta.set(j.posi_id, {
      code: j.journal_code, title: j.title, publisher: j.publisher || null,
      issn: [j.issn_online, j.issn_print].filter((x, n, a): x is string => !!x && a.indexOf(x) === n),
    })
  }
  for (const t of (titles as { journals: { id: string; t: string; p: string | null; i: string[] }[] }).journals) {
    if (!meta.has(t.id)) meta.set(t.id, { code: null, title: t.t, publisher: t.p, issn: t.i })
  }
  return { meta, coreIds }
}

let cache: { ranked: RankedJournal[]; notRanked: NotRanked[]; year: number } | null = null

export function getRankings() {
  if (cache) return cache
  const { meta, coreIds } = metaIndex()
  const pci = new Map(getAllPciEntries().map(e => [e.journal_id, e.pci]))
  const ranked: RankedJournal[] = []
  const notRanked: NotRanked[] = []
  for (const r of E.records) {
    const m = meta.get(r.journal_id) ?? { code: null, title: r.title ?? r.journal_id, publisher: r.publisher ?? null, issn: r.issn ?? [] }
    const core = coreIds.has(r.journal_id)
    if (r.overall_rank == null) {
      notRanked.push({ id: r.journal_id, code: m.code, title: m.title, cat: r.category_code, core, pcs: r.pcs, items: r.pcs_eligible_items, reason: EXCLUSION_TEXT[r.exclusion_reason ?? ''] ?? 'Not ranked' })
      continue
    }
    ranked.push({
      id: r.journal_id, code: m.code, title: m.title, publisher: m.publisher, issn: m.issn,
      cat: r.category_code, lowConfidence: r.rank == null, exclusion: r.exclusion_reason ? EXCLUSION_TEXT[r.exclusion_reason] ?? r.exclusion_reason : null,
      core, pcs: r.pcs!, items: r.pcs_eligible_items ?? 0, pci: pci.get(r.journal_id) ?? null,
      rank: r.rank, n: r.category_size != null && r.rank != null ? r.category_size : null, pct: r.percentile, q: r.quartile,
      oRank: r.overall_rank, oN: r.overall_size!, oPct: r.overall_percentile, oQ: r.overall_quartile,
    })
  }
  ranked.sort((a, b) => a.oRank - b.oRank || a.title.localeCompare(b.title))
  cache = { ranked, notRanked, year: E.metric_year }
  return cache
}

export function getCategories(): Category[] {
  const { ranked } = getRankings()
  return PSC.filter(c => c.level === 2).map(c => {
    const rows = ranked.filter(r => r.cat === c.code && r.rank !== null)
    return {
      code: c.code, name: c.name, domain: c.parent!, domainName: PSC_NAME[c.parent!] ?? c.parent!,
      ranked: rows.length, core: rows.filter(r => r.core).length,
    }
  })
}

export function getCategoryRanking(code: string): RankedJournal[] {
  return getRankings().ranked.filter(r => r.cat === code && r.rank !== null).sort((a, b) => a.rank! - b.rank! || a.title.localeCompare(b.title))
}

/** Journals assigned to a category but without a category rank (low confidence or undersized category). */
export function getCategoryUnranked(code: string): RankedJournal[] {
  return getRankings().ranked.filter(r => r.cat === code && r.rank === null)
}

export function getJournalRanking(posiId: string | null | undefined): RankedJournal | null {
  if (!posiId) return null
  return getRankings().ranked.find(r => r.id === posiId) ?? null
}

export function categoryName(code: string | null): string | null {
  return code ? PSC_NAME[code] ?? null : null
}
