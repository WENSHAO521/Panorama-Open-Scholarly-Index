// POSI Open Journal Rankings.
//
// One ranking universe for every indexed journal that has a POSI Citation
// Score (PCS), Core and non-Core alike, ranked within its PSC subject
// category and overall. Conventions follow the established citation
// databases so the numbers read the way researchers expect:
//
//   metric      PCS: citations in the current year to items published in the
//               previous four years, per eligible item (Crossref). Same
//               window shape as Scopus CiteScore; see /pcs/ for the spec.
//   rank        descending by PCS; equal values share a rank (1, 2, 2, 4).
//   percentile  (N - rank + 0.5) / N * 100, as in the JCR category percentile.
//   quartile    Q1..Q4 by rank position: Q = ceil(4 * rank / N).
//   eligibility at least MIN_ITEMS eligible items in the window. Smaller
//               journals are listed as not ranked rather than given a rank
//               that a handful of papers would decide.
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
export const RANKING_VERSION = 'POSI-OJR-1.0'

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
  oPct: number
  oQ: Quartile
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
      cat: j.psc_category ?? null, lowConfidence: j.psc_confidence === 'low', core: coreIds.has(j.posi_id),
    })
  }
  for (const t of (titles as { journals: { id: string; t: string; p: string | null; i: string[]; s: string | null; sc: string | null }[] }).journals) {
    if (out.has(t.id)) continue
    out.set(t.id, { id: t.id, code: null, title: t.t, publisher: t.p, issn: t.i, cat: t.s, lowConfidence: t.sc === 'low', core: false })
  }
  return [...out.values()]
}

function rankBlock<T extends { pcs: number }>(rows: T[]): (T & { rank: number; n: number; pct: number; q: Quartile })[] {
  const sorted = [...rows].sort((a, b) => b.pcs - a.pcs)
  const n = sorted.length
  let prev: number | null = null
  let prevRank = 0
  return sorted.map((r, i) => {
    const rank = prev !== null && r.pcs === prev ? prevRank : i + 1
    prev = r.pcs; prevRank = rank
    const q = `Q${Math.min(4, Math.max(1, Math.ceil((4 * rank) / n)))}` as Quartile
    return { ...r, rank, n, pct: Math.round(((n - rank + 0.5) / n) * 1000) / 10, q }
  })
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
  for (const r of eligible) if (r.cat) byCat.set(r.cat, [...(byCat.get(r.cat) ?? []), r])
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
    const rows = ranked.filter(r => r.cat === c.code)
    return {
      code: c.code, name: c.name, domain: c.parent!, domainName: PSC_NAME[c.parent!] ?? c.parent!,
      ranked: rows.length, core: rows.filter(r => r.core).length,
    }
  })
}

export function getCategoryRanking(code: string): RankedJournal[] {
  return getRankings().ranked.filter(r => r.cat === code).sort((a, b) => a.rank! - b.rank! || a.title.localeCompare(b.title))
}

export function getJournalRanking(posiId: string | null | undefined): RankedJournal | null {
  if (!posiId) return null
  return getRankings().ranked.find(r => r.id === posiId) ?? null
}

export function categoryName(code: string | null): string | null {
  return code ? PSC_NAME[code] ?? null : null
}
