'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Journal } from '@/lib/types'
import { fetchPublisherCatalogJournals, filterMatureEvidence, filterNotYetMature } from '@/lib/publisher-catalog-client'
import { Pagination } from './Pagination'

export const ELIGIBILITY_LABEL: Record<string, string> = {
  observation: 'Observation Stage',
  early_stage: 'Evaluated',
  // AJR-M 1.0 is implemented (posi-engine/src/ajr-mature.mjs) but has not
  // been run against real Core Collection/Global Benchmark data yet — no
  // journal has an actual AJR-M score. 'mature' here means "reached the
  // 60+ month lifecycle stage," not "scored." See AJR Score/M-Q columns
  // below, which always show "Not Yet Available" for these rows —
  // AJR-M-1.0-SPEC.md is explicit that a mature journal must never be
  // scored with the AJR-E rubric, so the old interim AJR-E number that
  // may still exist in this record's early_stage_rating.total is never
  // displayed here.
  mature: 'Pending AJR-M',
  not_yet_rateable: 'Not Yet Rateable',
  unknown: 'Unknown',
}

export const ELIGIBILITY_COLOR: Record<string, string> = {
  observation: '#6B7280',
  early_stage: '#1F7A4D',
  mature: '#B45309',
  not_yet_rateable: '#B45309',
  unknown: '#6B7280',
}

// Declarative column kinds, not function props — a Server Component page
// cannot pass a function prop to a Client Component like this one (React
// Server Components can't serialize functions across that boundary, only
// plain, serializable props like this string union), so the render logic
// for each kind lives here instead of being supplied by the caller.
export type ColumnKind = 'collection' | 'm-q' | 'e-q' | 'citation-preview'

const COLUMN_HEADERS: Record<ColumnKind, string> = {
  collection: 'Collection',
  'm-q': 'M-Q',
  'e-q': 'E-Q',
  'citation-preview': 'Citation Preview',
}

function renderColumn(kind: ColumnKind, j: Journal): { value: string; title?: string } {
  switch (kind) {
    case 'collection':
      return { value: j.is_external_benchmark ? 'Benchmark' : 'Core' }
    case 'm-q':
      // Always "Not Yet Available" — AJR-M 1.0 is implemented but has not
      // been run against real data (see ELIGIBILITY_LABEL.mature above).
      // Deliberately does NOT read early_stage_rating.provisional_quartile
      // here even though it may be populated — for a mature-eligible
      // record, that value is the old interim AJR-E-based quartile, which
      // AJR-M-1.0-SPEC.md forbids displaying as a mature journal's score.
      return { value: 'Not Yet Available', title: 'AJR-M 1.0 methodology is implemented but has not been run against real evidence/citation data yet — no journal has a published M-Q.' }
    case 'e-q':
      return j.early_stage_rating?.eligibility === 'early_stage' && j.early_stage_rating?.provisional_quartile
        ? { value: j.early_stage_rating.provisional_quartile, title: 'Ranked within its PSC peer cohort — RANK-1.0 midrank-percentile, see AJR-SPEC.md § 5' }
        : { value: '—', title: 'Not assigned — either insufficient peer cohort, not yet evaluated, or no AJR score exists for this record at all' }
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
  if (j.early_stage_rating?.eligibility === 'mature') return j.citation_preview?.value ?? -1
  return j.early_stage_rating?.total ?? j.citation_preview?.value ?? -1
}
function defaultSort(a: Journal, b: Journal): number {
  const av = scoreForSort(a)
  const bv = scoreForSort(b)
  return bv - av
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
 */
export function LifecycleRatingsTable({
  journals,
  columns = [],
  benchmarkMode,
}: {
  journals: Journal[]
  columns?: ColumnKind[]
  benchmarkMode?: BenchmarkMode
}) {
  const [benchmarkRows, setBenchmarkRows] = useState<Journal[] | null>(null)
  const [loading, setLoading] = useState(!!benchmarkMode)
  const [failed, setFailed] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()

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

  const merged = benchmarkRows ? [...journals, ...benchmarkRows] : journals
  const allRows = [...merged].sort(defaultSort)

  const requestedPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const totalPages = Math.max(1, Math.ceil(allRows.length / PER_PAGE))
  const page = Math.min(requestedPage, totalPages)
  const rows = allRows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      {allRows.length > 0 && (
        <div className="flex justify-end mb-2">
          <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
            {((page - 1) * PER_PAGE + 1).toLocaleString()}–{Math.min(page * PER_PAGE, allRows.length).toLocaleString()} of {allRows.length.toLocaleString()}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
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
              const eligibility = r?.eligibility ?? 'unknown'
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
                    {/* eligibility === 'mature' never shows a score here, even if
                        r.total is populated — that value is the old interim AJR-E
                        score, and AJR-M-1.0-SPEC.md forbids scoring mature
                        journals with the AJR-E rubric. AJR-M is implemented but
                        has not been run against real data (see M-Q column). */}
                    {eligibility === 'mature'
                      ? <span style={{ color: 'var(--posi-muted)' }} title="AJR-M 1.0 is implemented but has not been run against real evidence/citation data yet">Not Yet Available</span>
                      : r?.total != null ? `${r.total}/100` : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="font-mono text-[10px] font-semibold"
                      style={{ color: pendingFpd ? '#B45309' : ELIGIBILITY_COLOR[eligibility] }}
                      title={
                        pendingFpd
                          ? 'No OpenAlex evidence of publishing activity >=5 years ago rules out "mature," but does not prove this journal is 12-59 months old — absence of proof of maturity is not proof of Early-Stage. No first-publication-date has been resolved for this record.'
                          : eligibility === 'not_yet_rateable' ? 'Below the minimum evidence bar — often because POSI\'s crawl was blocked (HTTP 403) by the site, not necessarily missing governance.' : undefined
                      }
                    >
                      {pendingFpd ? 'Pending FPD Verification' : ELIGIBILITY_LABEL[eligibility]}
                    </span>
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
      {benchmarkMode && (
        <p className="px-4 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: rows.length > 0 ? '1px solid var(--posi-border-light)' : undefined }}>
          {loading && 'Loading Global Benchmark rows…'}
          {!loading && failed && 'Global Benchmark rows failed to load — showing Core Collection only.'}
          {!loading && !failed && benchmarkRows && (
            `${benchmarkRows.length.toLocaleString()} Global Benchmark row${benchmarkRows.length === 1 ? '' : 's'} loaded — all reachable via the pages below.`
          )}
        </p>
      )}
      <Pagination page={page} totalPages={totalPages} makeHref={p => `${pathname}?page=${p}`} />
    </div>
  )
}
