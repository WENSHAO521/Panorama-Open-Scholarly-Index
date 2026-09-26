// POSI Open Journal Rankings.
//
// One ranking universe for every indexed journal that has a POSI Citation
// Score (PCS), Core and non-Core alike. The ranking algorithm is RANK-1.0
// exactly as specified in posi-data/PJR-SPEC.md section 8 and implemented in
// posi-engine/src/ranking.mjs, with PCS as the input score:
//
//   rank        descending by PCS; competition rank (1, 2, 2, 4)
//   rank_mid    tied journals share the mid-rank of the positions they occupy
//   percentile  100 * (N - rank_mid + 0.5) / N
//   quartile    Q1 >= 75, Q2 >= 50, Q3 >= 25, else Q4, labelled PCS-Q1..4
//   size        categories with fewer than 20 eligible journals get no
//               quartile ("unavailable"), never a small-sample Q1
//   subject     only high/verified PSC confidence enters a category ranking
//               (posi-engine isRankEligiblePscConfidence)
//   items       at least MIN_ITEMS eligible items in the PCS window
//
// Everything is computed at build time from committed data, so a published
// rank can be reproduced from the repository at that commit.

import { getCoreCollection, getCandidateJournals } from './data'
import { BENCHMARK_JOURNALS } from './benchmark-journals'
import { getAllPcsEntries } from './pcs'
import { getAllPciEntries } from './pci'
import psc from './psc-v1.0.snapshot.json'
import titles from './ranking-titles.json'

export const MIN_ITEMS = 5
export const MIN_CATEGORY_SIZE = 20
export const RANKING_VERSION = 'RANK-1.0 on PCS'
export const RANK_ELIGIBLE_CONFIDENCE = new Set(['high', 'verified'])

export type Quartile = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface RankedJournal {
  id: string
  /** journal_code when POSI publishes a record page for it */
  code: string | null
  title: string
  publisher: string | null
  issn: string[]
  /** PSC level-2 category, null when unclassified */
  cat: string | null
  lowConfidence: boolean
  core: boolean
  pcs: number
  items: number
  pci: number | null
  /** within category */
  rank: number | null
  n: number | null
  pct: number | null
  q: Quartile | null
  /** across all categories */
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

interface Base { id: string; code: string | null; title: string; publisher: string | null; issn: string[]; cat: string | null; lowConfidence: boolean; core: boolean }

const eligibleConfidence = (c: string | null | undefined) => RANK_ELIGIBLE_CONFIDENCE.has(c ?? '')

const PSC = psc.categories as { code: string; name: string; level: number; parent: string | null }[]
const PSC_NAME = Object.fromEntries(PSC.map(c => [c.code, c.name]))

function universe(): Base[] {
  const out = new Map<string, Base>()
  const coreIds = new Set(getCoreCollection().map(j => j.posi_id))
  for (const j of [...getCoreCollection(), ...getCandidateJournals(), ...BENCHMARK_JOURNALS]) {
    if (!j.posi_id) continue
    out.set(j.posi_id, {
      id: j.posi_id, code: j.journal_code, title: j.title, publisher: j.publisher || null,
      issn: [j.issn_online, j.issn_print].filter((x, n, a): x is string => !!x && a.indexOf(x) === n),
      cat: j.psc_category ?? null, lowConfidence: !eligibleConfidence(j.psc_confidence), core: coreIds.has(j.posi_id),
    })
  }
  for (const t of (titles as { journals: { id: string; t: string; p: string | null; i: string[]; s: string | null; sc: string | null }[] }).journals) {
    if (out.has(t.id)) continue
    out.set(t.id, { id: t.id, code: null, title: t.t, publisher: t.p, issn: t.i, cat: t.s, lowConfidence: !eligibleConfidence(t.sc), core: false })
  }
  return [...out.values()]
}

/** RANK-1.0 (PJR-SPEC section 8): mid-rank ties, percentile from mid-rank, quartile from percentile. */
function rankBlock<T extends { pcs: number }>(rows: T[], minSize = MIN_CATEGORY_SIZE): (T & { rank: number; n: number; pct: number | null; q: Quartile | null })[] {
  const sorted = [...rows].sort((a, b) => b.pcs - a.pcs)
  const n = sorted.length
  const out: (T & { rank: number; n: number; pct: number | null; q: Quartile | null })[] = []
  let position = 1
  for (let i = 0; i < sorted.length;) {
    let j = i
    while (j < sorted.length && sorted[j].pcs === sorted[i].pcs) j++
    const mid = position + (j - i - 1) / 2
    const pct = 100 * (n - mid + 0.5) / n
    const q: Quartile = pct >= 75 ? 'Q1' : pct >= 50 ? 'Q2' : pct >= 25 ? 'Q3' : 'Q4'
    for (const r of sorted.slice(i, j)) {
      out.push({ ...r, rank: position, n, pct: n >= minSize ? Math.round(pct * 100) / 100 : null, q: n >= minSize ? q : null })
    }
    position += j - i
    i = j
  }
  return out
}

let cache: { ranked: RankedJournal[]; notRanked: NotRanked[]; year: number } | null = null

export function getRankings() {
  if (cache) return cache
  const pcsById = new Map(getAllPcsEntries().map(e => [e.journal_id, e]))
  const pciById = new Map(getAllPciEntries().map(e => [e.journal_id, e]))
  const year = getAllPcsEntries()[0]?.metric_year ?? new Date().getFullYear()

  const eligible: (Base & { pcs: number; items: number; pci: number | null })[] = []
  const notRanked: NotRanked[] = []
  for (const b of universe()) {
    const e = pcsById.get(b.id)
    if (!e || e.pcs === null) {
      notRanked.push({ id: b.id, code: b.code, title: b.title, cat: b.cat, core: b.core, pcs: null, items: e?.pcs_eligible_items ?? null, reason: 'No PCS for this window' })
      continue
    }
    const items = e.pcs_eligible_items ?? 0
    if (items < MIN_ITEMS) {
      notRanked.push({ id: b.id, code: b.code, title: b.title, cat: b.cat, core: b.core, pcs: e.pcs, items, reason: `Fewer than ${MIN_ITEMS} eligible items` })
      continue
    }
    eligible.push({ ...b, pcs: e.pcs, items, pci: pciById.get(b.id)?.pci ?? null })
  }

  const overall = new Map(rankBlock(eligible).map(r => [r.id, r]))
  const byCat = new Map<string, typeof eligible>()
  for (const r of eligible) if (r.cat && !r.lowConfidence) byCat.set(r.cat, [...(byCat.get(r.cat) ?? []), r])
  const inCat = new Map<string, ReturnType<typeof rankBlock<(typeof eligible)[number]>>[number]>()
  for (const rows of byCat.values()) for (const r of rankBlock(rows)) inCat.set(r.id, r)

  const ranked: RankedJournal[] = eligible.map(r => {
    const o = overall.get(r.id)!
    const c = inCat.get(r.id)
    return {
      id: r.id, code: r.code, title: r.title, publisher: r.publisher, issn: r.issn, cat: r.cat,
      lowConfidence: r.lowConfidence, core: r.core, pcs: r.pcs, items: r.items, pci: r.pci,
      rank: c?.rank ?? null, n: c?.n ?? null, pct: c?.pct ?? null, q: c?.q ?? null,
      oRank: o.rank, oN: o.n, oPct: o.pct, oQ: o.q,
    }
  }).sort((a, b) => a.oRank - b.oRank)

  cache = { ranked, notRanked, year }
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

/** Journals in a category that are not ranked in it because their subject assignment is not high-confidence. */
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
