'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Journal } from '@/lib/types'
import { fetchPublisherCatalogJournals, filterMatureEvidence, filterNotYetMature } from '@/lib/publisher-catalog-client'
import {
  isMatureStage, isInObservationStage, isBlockedOrNotRateable, isUnknownLifecycle,
  earlyStageDisplayTotal, earlyStageQuartile, earlyStageStatus, earlyStageBadgeVariant, earlyStageCohortInfo,
  earlyStageLifecycleLabel,
} from '@/lib/early-stage'
import { Badge } from './Badge'
import { Pagination } from './Pagination'

// Status label/color/notability per row now comes from earlyStageStatus()
// (src/lib/early-stage.ts) — it reads legacy (`eligibility`) and AJR-E-1.1
// (`lifecycle_stage` + `rating_status`) records on their own terms, since
// the two shapes split what used to be one field differently. See that
// module's comments for the full mapping (Observation Stage / Evaluated /
// Provisional / Pending AJR-M / Not Rateable / Not Yet Rateable / Unknown).
//
// Amber/bold notability is reserved for states that are genuinely
// exceptional and worth flagging (a real crawl failure, or AJR-E-1.1's
// not_rateable/provisional). 'mature' and 'unknown' are structural,
// expected states — nearly every row in a Benchmark/Mature-track page
// lands there simply because AJR-M hasn't been run against real data yet,
// not because anything is wrong with that specific row.

// Declarative column kinds, not function props — a Server Component page
// cannot pass a function prop to a Client Component like this one (React
// Server Components can't serialize functions across that boundary, only
// plain, serializable props like this string union), so the render logic
// for each kind lives here instead of being supplied by the caller.
export type ColumnKind = 'collection' | 'm-q' | 'e-q' | 'citation-preview' | 'age-stage' | 'evidence'

const COLUMN_HEADERS: Record<ColumnKind, string> = {
  collection: 'Collection',
  'm-q': 'M-Q',
  'e-q': 'E-Q',
  'citation-preview': 'Citation Preview',
  'age-stage': 'Age / Stage',
  evidence: 'Evidence',
}

// Evidence-coverage thresholds mirror the ones already used on the journal
// profile page's lifecycle panel (≥80 / ≥60) — a label on a number that
// already exists (evidence_coverage), not a new metric.
function evidenceStatus(j: Journal): { value: string; title: string } {
  const ec = j.early_stage_rating?.evidence_coverage
  if (ec == null) return { value: '—', title: 'No evidence-coverage figure on record for this journal.' }
  if (ec >= 80) return { value: 'Verified', title: `Evidence coverage ${ec.toFixed(1)}% — at or above the verified threshold.` }
  if (ec >= 60) return { value: 'Partial', title: `Evidence coverage ${ec.toFixed(1)}% — partial, below the verified threshold.` }
  return { value: 'Review required', title: `Evidence coverage ${ec.toFixed(1)}% — below the ranking-eligible threshold.` }
}

function renderColumn(kind: ColumnKind, j: Journal): { value: string; title?: string } {
  switch (kind) {
    case 'collection':
      return { value: j.is_external_benchmark ? 'Benchmark' : 'Core' }
    case 'm-q':
      // Always unscored — AJR-M 1.0 is implemented but has not been run
      // against real data (see earlyStageStatus()'s 'mature' branch in
      // src/lib/early-stage.ts). Deliberately does NOT read any quartile
      // field here even when populated — for a mature-eligible record,
      // that value is the old interim AJR-E-based quartile (legacy shape)
      // or simply not applicable (v1.1 shape), and AJR-M-1.0-SPEC.md
      // forbids displaying either as a mature journal's score.
      return { value: 'Not yet published', title: 'AJR-M 1.0 methodology is implemented but has not been run against real evidence/citation data yet — no journal has a published M-Q.' }
    case 'e-q': {
      const quartile = earlyStageQuartile(j.early_stage_rating)
      const cohort = earlyStageCohortInfo(j.early_stage_rating)
      if (quartile) {
        const cohortNote = cohort?.cohortSize != null ? ` (cohort ${cohort.cohortSize})` : ''
        return { value: `${quartile}${cohortNote}`, title: 'Ranked within its PSC peer cohort — RANK-1.0 midrank-percentile, see AJR-SPEC.md § 5' }
      }
      if (cohort) {
        const reason = cohort.cohortSize != null
          ? `Peer cohort size ${cohort.cohortSize} has not reached the minimum required for quartile assignment.`
          : 'No same-category peer cohort has formed yet for this record.'
        return { value: 'Not assigned', title: reason }
      }
      return { value: 'Not assigned', title: 'Not assigned — either insufficient peer cohort, not yet evaluated, provisional (not ranking-eligible), or no AJR score exists for this record at all.' }
    }
    case 'age-stage': {
      const label = earlyStageLifecycleLabel(j.early_stage_rating)
      const months = j.early_stage_rating?.months_since_launch
      return { value: months != null ? `${months} mo · ${label}` : label }
    }
    case 'evidence':
      return evidenceStatus(j)
    case 'citation-preview': {
      const cp = j.citation_preview
      if (cp?.value != null) return { value: cp.value.toFixed(2), title: 'OpenAlex 2-year mean citedness — diagnostic preview only, not PCI, not ranked. See /pci.' }
      if (cp) return { value: 'Unavailable', title: 'No OpenAlex citation figure for this record' }
      return { value: 'Not released', title: 'No citation preview computed for this record' }
    }
  }
}

const PER_PAGE = 20

export type BenchmarkMode = 'mature' | 'not-yet-mature'

function applyBenchmarkMode(all: Journal[], mode: BenchmarkMode): Journal[] {
  if (mode === 'mature') return filterMatureEvidence(all)
  return filterNotYetMature(all)
}

// Real AJR-E score first (highest first) for non-mature rows, falling back
// to the raw citation preview value (not a rank) — display ordering only,
// never a claim of ranking. Mature rows never sort by early_stage_rating's
// total, even when populated — see the AJR Score column's own comment for
// why (that number is the old interim AJR-E score, not a real AJR-M one).
function scoreForSort(j: Journal): number {
  return earlyStageDisplayTotal(j.early_stage_rating) ?? j.citation_preview?.value ?? -1
}
// Deterministic default: rated journals first (real AJR-E score, highest
// first), tie-broken by title so equal/absent scores don't reorder between
// renders; unrated journals sort after, also by title (§8 of the Stage 2
// brief: "do not default sort non-rated journals above rated journals...
// preserve deterministic ordering").
function defaultSort(a: Journal, b: Journal): number {
  const av = scoreForSort(a)
  const bv = scoreForSort(b)
  if (av !== bv) return bv - av
  return a.title.localeCompare(b.title)
}

type StatusBucket = 'evaluated' | 'not-rateable' | 'observation' | 'pending-ajr-m' | 'unknown'
const STATUS_FILTER_OPTIONS: { value: StatusBucket; label: string }[] = [
  { value: 'evaluated', label: 'Rated (AJR-E score on record)' },
  { value: 'not-rateable', label: 'Not rateable' },
  { value: 'observation', label: 'Observation stage' },
  { value: 'pending-ajr-m', label: 'Pending AJR-M' },
  { value: 'unknown', label: 'Unknown lifecycle' },
]
function statusBucket(j: Journal): StatusBucket {
  const r = j.early_stage_rating
  if (isMatureStage(r)) return 'pending-ajr-m'
  if (isInObservationStage(r)) return 'observation'
  if (isBlockedOrNotRateable(r)) return 'not-rateable'
  if (isUnknownLifecycle(r) || !r) return 'unknown'
  return 'evaluated'
}

type EvidenceBucket = 'verified' | 'partial' | 'review-required'
const EVIDENCE_FILTER_OPTIONS: { value: EvidenceBucket; label: string }[] = [
  { value: 'verified', label: 'Verified' },
  { value: 'partial', label: 'Partial' },
  { value: 'review-required', label: 'Review required' },
]
function evidenceBucket(j: Journal): EvidenceBucket | null {
  const ec = j.early_stage_rating?.evidence_coverage
  if (ec == null) return null
  if (ec >= 80) return 'verified'
  if (ec >= 60) return 'partial'
  return 'review-required'
}

type SortKey = 'default' | 'ajr-desc' | 'ajr-asc' | 'name-asc' | 'name-desc' | 'age-desc' | 'age-asc' | 'eq-asc'
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'Rated first, AJR-E descending' },
  { value: 'ajr-desc', label: 'AJR-E (high to low)' },
  { value: 'ajr-asc', label: 'AJR-E (low to high)' },
  { value: 'name-asc', label: 'Journal name (A–Z)' },
  { value: 'name-desc', label: 'Journal name (Z–A)' },
  { value: 'age-desc', label: 'Lifecycle age (oldest first)' },
  { value: 'age-asc', label: 'Lifecycle age (newest first)' },
  { value: 'eq-asc', label: 'E-Q (E-Q1 first)' },
]
function sortComparator(key: SortKey): (a: Journal, b: Journal) => number {
  switch (key) {
    case 'ajr-desc': return (a, b) => (scoreForSort(b) - scoreForSort(a)) || a.title.localeCompare(b.title)
    case 'ajr-asc': return (a, b) => (scoreForSort(a) - scoreForSort(b)) || a.title.localeCompare(b.title)
    case 'name-asc': return (a, b) => a.title.localeCompare(b.title)
    case 'name-desc': return (a, b) => b.title.localeCompare(a.title)
    case 'age-desc': return (a, b) => ((b.early_stage_rating?.months_since_launch ?? -1) - (a.early_stage_rating?.months_since_launch ?? -1)) || a.title.localeCompare(b.title)
    case 'age-asc': return (a, b) => ((a.early_stage_rating?.months_since_launch ?? 9999) - (b.early_stage_rating?.months_since_launch ?? 9999)) || a.title.localeCompare(b.title)
    case 'eq-asc': return (a, b) => {
      const qa = earlyStageQuartile(a.early_stage_rating) ?? 'ZZZ'
      const qb = earlyStageQuartile(b.early_stage_rating) ?? 'ZZZ'
      return qa.localeCompare(qb) || a.title.localeCompare(b.title)
    }
    case 'default':
    default: return defaultSort
  }
}

/**
 * Shared table for /ratings/early-stage, /ratings/mature and
 * /coverage/global-benchmark — same journal-identity + AJR score + status
 * columns everywhere, with 0-2 track-specific columns (E-Q, M-Q, Citation Preview,
 * Collection) appended per caller. See AJR-SPEC.md § 5 for why the ranking
 * shape is identical across tracks — only the input score/label differs.
 *
 * `journals` (Core Collection / curated benchmark — small, real
 * evidence-based data) renders immediately, server-side. `benchmarkMode`,
 * when given, fetches the much larger publisher-catalog expansion
 * (~3,300 records) client-side at runtime and merges in ALL matching rows
 * once loaded (no display cap) — NOT statically bundled, see
 * publisher-catalog-client.ts's header for why (an earlier version baked
 * all of it into the static build and broke a live Cloudflare Pages
 * deployment). Paginated (`?page=`, PER_PAGE rows/page, same
 * Pagination/pageWindow pattern as JournalTabs.tsx/the journals listing)
 * so every row is reachable no matter how large the merged set grows —
 * never truncated to a fixed top-N cap.
 *
 * `enableFilters`/`enableSort` opt a caller into PSC/status/evidence/
 * publisher filters and sortable ordering, both synced to the URL
 * (?psc=&status=&evidence=&publisher=&sort=) — off by default so
 * /ratings/mature and /coverage/global-benchmark keep their existing
 * fixed-order presentation unless explicitly upgraded.
 */
export function LifecycleRatingsTable({
  journals,
  columns = [],
  benchmarkMode,
  title,
  methodologyHref,
  methodologyLabel,
  headerStat,
  enableFilters = false,
  enableSort = false,
}: {
  journals: Journal[]
  columns?: ColumnKind[]
  benchmarkMode?: BenchmarkMode
  title: string
  methodologyHref?: string
  methodologyLabel?: string
  headerStat?: string
  enableFilters?: boolean
  enableSort?: boolean
}) {
  const [benchmarkRows, setBenchmarkRows] = useState<Journal[] | null>(null)
  const [loading, setLoading] = useState(!!benchmarkMode)
  const [failed, setFailed] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!benchmarkMode) return
    let cancelled = false
    fetchPublisherCatalogJournals()
      .then(all => {
        if (cancelled) return
        setBenchmarkRows(applyBenchmarkMode(all, benchmarkMode))
      })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [benchmarkMode])

  const merged = useMemo(() => (benchmarkRows ? [...journals, ...benchmarkRows] : journals), [journals, benchmarkRows])

  const pscFilter = enableFilters ? (searchParams.get('psc') ?? '') : ''
  const statusFilter = enableFilters ? (searchParams.get('status') ?? '') : ''
  const evidenceFilter = enableFilters ? (searchParams.get('evidence') ?? '') : ''
  const publisherFilter = enableFilters ? (searchParams.get('publisher') ?? '') : ''
  const sortKey = (enableSort ? (searchParams.get('sort') as SortKey | null) : null) ?? 'default'

  const pscOptions = useMemo(() => {
    const set = new Set<string>()
    merged.forEach(j => { const c = j.psc_category ?? j.citation_preview?.psc_category; if (c) set.add(c) })
    return Array.from(set).sort()
  }, [merged])
  const publisherOptions = useMemo(() => {
    const set = new Set<string>()
    merged.forEach(j => { if (j.publisher) set.add(j.publisher) })
    return Array.from(set).sort()
  }, [merged])

  const filtered = useMemo(() => {
    if (!enableFilters) return merged
    return merged.filter(j => {
      if (pscFilter && (j.psc_category ?? j.citation_preview?.psc_category) !== pscFilter) return false
      if (statusFilter && statusBucket(j) !== statusFilter) return false
      if (evidenceFilter && evidenceBucket(j) !== evidenceFilter) return false
      if (publisherFilter && j.publisher !== publisherFilter) return false
      return true
    })
  }, [merged, enableFilters, pscFilter, statusFilter, evidenceFilter, publisherFilter])

  const allRows = useMemo(() => [...filtered].sort(sortComparator(sortKey)), [filtered, sortKey])

  const requestedPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const totalPages = Math.max(1, Math.ceil(allRows.length / PER_PAGE))
  const page = Math.min(requestedPage, totalPages)
  const rows = allRows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div>
      {/* Title + row-range live in one row, same as CitationReportsTable's
          toolbar — a range indicator on its own row reads as an orphaned
          strip of empty space, not a caption attached to anything. */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1" style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-[0.1em] whitespace-nowrap" style={{ color: 'var(--posi-muted)' }}>{title}</h2>
          {allRows.length > 0 && (
            <span className="text-[11px] font-mono whitespace-nowrap" style={{ color: 'var(--posi-muted)' }}>
              {((page - 1) * PER_PAGE + 1).toLocaleString()}–{Math.min(page * PER_PAGE, allRows.length).toLocaleString()} of {allRows.length.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {headerStat && <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>{headerStat}</span>}
          {methodologyHref && (
            <a href={methodologyHref} target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline whitespace-nowrap" style={{ color: 'var(--posi-accent)' }}>
              {methodologyLabel} →
            </a>
          )}
        </div>
      </div>

      {enableFilters && (
        <div className="px-5 py-3 flex flex-wrap gap-3" style={{ borderBottom: '1px solid var(--posi-border)' }}>
          <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
            PSC
            <select value={pscFilter} onChange={e => updateParam('psc', e.target.value)} className="text-[11px] px-1.5 py-1" style={{ border: '1px solid var(--posi-border)' }}>
              <option value="">All</option>
              {pscOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
            Rating status
            <select value={statusFilter} onChange={e => updateParam('status', e.target.value)} className="text-[11px] px-1.5 py-1" style={{ border: '1px solid var(--posi-border)' }}>
              <option value="">All</option>
              {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
            Evidence
            <select value={evidenceFilter} onChange={e => updateParam('evidence', e.target.value)} className="text-[11px] px-1.5 py-1" style={{ border: '1px solid var(--posi-border)' }}>
              <option value="">All</option>
              {EVIDENCE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
            Publisher
            <select value={publisherFilter} onChange={e => updateParam('publisher', e.target.value)} className="text-[11px] px-1.5 py-1 max-w-[10rem]" style={{ border: '1px solid var(--posi-border)' }}>
              <option value="">All</option>
              {publisherOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          {enableSort && (
            <label className="flex items-center gap-1.5 text-[11px] ml-auto" style={{ color: 'var(--posi-muted)' }}>
              Sort
              <select value={sortKey} onChange={e => updateParam('sort', e.target.value === 'default' ? '' : e.target.value)} className="text-[11px] px-1.5 py-1" style={{ border: '1px solid var(--posi-border)' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
              <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Publisher</th>
              <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSC</th>
              <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>AJR Score</th>
              <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Status</th>
              {columns.map(kind => (
                <th key={kind} className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>{COLUMN_HEADERS[kind]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(j => {
              const r = j.early_stage_rating
              // A Global Benchmark row merged in via filterNotYetMature() has no
              // early_stage_rating at all — it was never evaluated. Its only
              // signal is the ABSENCE of >=5-year-old OpenAlex activity, which
              // rules out "mature" but does NOT prove the journal is actually
              // 12-59 months old (it could just as easily be unlisted/missing
              // history for other reasons) — so it must never be shown as if it
              // were a genuinely evaluated Early-Stage record. Distinct from the
              // generic 'unknown' case (a Core Collection record with a real,
              // unresolved FPD lookup).
              const pendingFpd = j.is_external_benchmark && !!j.citation_preview && !r
              const status = earlyStageStatus(r)
              const displayTotal = earlyStageDisplayTotal(r)
              return (
                <tr key={j.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                  <td className="px-4 py-3">
                    {j.is_external_benchmark ? (
                      <a href={j.website_url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                        {j.title}
                      </a>
                    ) : (
                      <Link href={`/journal/${j.journal_code}`} className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                        {j.title}
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>{j.publisher}</td>
                  <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>
                    {(() => {
                      // citation_preview carries its own PSC classification for
                      // journals with no evidence-based rating (Global Benchmark
                      // publisher-catalog expansion) — fall back to it when the
                      // primary field is unset.
                      const category = j.psc_category ?? j.citation_preview?.psc_category
                      const lowConfidence = j.psc_category ? j.psc_confidence === 'low' : (j.citation_preview && j.citation_preview.psc_confidence !== 'high')
                      return category ? (
                        <>
                          {category}
                          {lowConfidence && <span className="ml-1 opacity-60" title="Not high-confidence classification">*</span>}
                        </>
                      ) : 'Not yet classified'
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>
                    {/* isMatureStage(r) never shows a score here, even if
                        r.total is populated — for the legacy shape that value
                        is the old interim AJR-E score, and AJR-M-1.0-SPEC.md
                        forbids scoring mature journals with the AJR-E rubric.
                        AJR-M is implemented but has not been run against real
                        data (see M-Q column). earlyStageDisplayTotal() also
                        guards the v1.1 shape's not_rateable/not_applicable
                        rating_status against ever showing a fabricated total. */}
                    {isMatureStage(r)
                      ? <span style={{ color: 'var(--posi-muted)' }} title="AJR-M 1.0 is implemented but has not been run against real evidence/citation data yet">—</span>
                      : displayTotal != null
                        ? `${displayTotal}/100`
                        : <span style={{ color: 'var(--posi-muted)' }} title="No AJR-E score on record — see the Status column for the reason.">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {/* pendingFpd reads as quiet/muted, same tier as the other
                        structural states — it's the expected state for nearly
                        every Benchmark-track row, not an anomaly. status.notable
                        (from earlyStageStatus(), src/lib/early-stage.ts) marks
                        genuine signal: an achieved result or a real anomaly —
                        legacy 'early_stage'/'not_yet_rateable', or v1.1
                        'official'/'provisional'/'not_rateable'. Rendered via
                        the shared Badge vocabulary (earlyStageBadgeVariant)
                        rather than a raw styled span. */}
                    {pendingFpd ? (
                      <Badge
                        label="Pending FPD Verification"
                        variant="default"
                        title='No OpenAlex evidence of publishing activity >=5 years ago rules out "mature," but does not prove this journal is 12-59 months old — absence of proof of maturity is not proof of Early-Stage. No first-publication-date has been resolved for this record.'
                      />
                    ) : (
                      <Badge label={status.label} variant={earlyStageBadgeVariant(status)} title={status.title} />
                    )}
                  </td>
                  {columns.map(kind => {
                    const { value, title } = renderColumn(kind, j)
                    return (
                      <td key={kind} className="px-3 py-3 text-center text-[10px]" style={{ color: 'var(--posi-muted)' }} title={title}>
                        {value}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile compact cards — the full desktop table is unreadable at
          390px (§29 of the Stage 2 brief); every row still surfaces
          Journal / AJR Score / E-Q (or track-specific column) / Status. */}
      <div className="md:hidden divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
        {rows.map(j => {
          const r = j.early_stage_rating
          const pendingFpd = j.is_external_benchmark && !!j.citation_preview && !r
          const status = earlyStageStatus(r)
          const displayTotal = earlyStageDisplayTotal(r)
          return (
            <div key={j.id} className="px-4 py-3" style={{ borderColor: 'var(--posi-border-light)' }}>
              <div className="flex items-start justify-between gap-2">
                {j.is_external_benchmark ? (
                  <a href={j.website_url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-sm leading-tight" style={{ color: 'var(--posi-text)' }}>{j.title}</a>
                ) : (
                  <Link href={`/journal/${j.journal_code}`} className="font-medium text-sm leading-tight" style={{ color: 'var(--posi-text)' }}>{j.title}</Link>
                )}
                <span className="font-mono text-xs font-semibold shrink-0" style={{ color: 'var(--posi-text)' }}>
                  {isMatureStage(r) ? '—' : displayTotal != null ? `${displayTotal}/100` : '—'}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{j.publisher}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge label={j.is_external_benchmark ? 'Benchmark' : 'Core Collection'} variant={j.is_external_benchmark ? 'benchmark' : 'core-collection'} />
                {pendingFpd ? (
                  <Badge label="Pending FPD Verification" variant="default" />
                ) : (
                  <Badge label={status.label} variant={earlyStageBadgeVariant(status)} />
                )}
                {columns.includes('e-q') && (() => {
                  const { value } = renderColumn('e-q', j)
                  return <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>{value}</span>
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {benchmarkMode && (
        <p className="px-4 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: rows.length > 0 ? '1px solid var(--posi-border-light)' : undefined }}>
          {loading && 'Loading Global Benchmark rows…'}
          {!loading && failed && 'Global Benchmark rows failed to load — showing Core Collection only.'}
          {!loading && !failed && benchmarkRows && (
            `${benchmarkRows.length.toLocaleString()} Global Benchmark row${benchmarkRows.length === 1 ? '' : 's'} loaded — all reachable via the pages below.`
          )}
        </p>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={p => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(p))
        return `${pathname}?${params.toString()}`
      }} />
    </div>
  )
}
