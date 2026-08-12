'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Journal } from '@/lib/types'
import { fetchPublisherCatalogJournals, filterMatureRanked, filterMatureUnclassified, filterNotYetMature } from '@/lib/publisher-catalog-client'

export const ELIGIBILITY_LABEL: Record<string, string> = {
  observation: 'Observation Stage',
  early_stage: 'Evaluated',
  mature: 'Evaluated (mature)',
  not_yet_rateable: 'Not Yet Rateable',
  unknown: 'Unknown',
}

export const ELIGIBILITY_COLOR: Record<string, string> = {
  observation: '#6B7280',
  early_stage: '#1F7A4D',
  mature: '#1F7A4D',
  not_yet_rateable: '#B45309',
  unknown: '#6B7280',
}

// Declarative column kinds, not function props — a Server Component page
// cannot pass a function prop to a Client Component like this one (React
// Server Components can't serialize functions across that boundary, only
// plain, serializable props like this string union), so the render logic
// for each kind lives here instead of being supplied by the caller.
export type ColumnKind = 'collection' | 'm-q' | 'e-q' | 'citation-q'

const COLUMN_HEADERS: Record<ColumnKind, string> = {
  collection: 'Collection',
  'm-q': 'M-Q',
  'e-q': 'E-Q',
  'citation-q': 'Citation Q',
}

function renderColumn(kind: ColumnKind, j: Journal): { value: string; title?: string } {
  switch (kind) {
    case 'collection':
      return { value: j.is_external_benchmark ? 'Benchmark' : 'Core' }
    case 'm-q':
      return j.early_stage_rating?.provisional_quartile
        ? { value: j.early_stage_rating.provisional_quartile, title: 'Ranked within its PSC peer cohort — RANK-1.0 midrank-percentile, see AJR-SPEC.md § 5' }
        : { value: 'Not released', title: 'Not assigned — either its PSC category/domain cohort hasn\'t reached the minimum size yet, or no AJR score exists for this record at all' }
    case 'e-q':
      return j.early_stage_rating?.eligibility === 'early_stage' && j.early_stage_rating?.provisional_quartile
        ? { value: j.early_stage_rating.provisional_quartile, title: 'Ranked within its PSC peer cohort — RANK-1.0 midrank-percentile, see AJR-SPEC.md § 5' }
        : { value: '—', title: 'Not assigned — either insufficient peer cohort, not yet evaluated, or no AJR score exists for this record at all' }
    case 'citation-q': {
      const cq = j.citation_rating?.citation_q
      if (cq?.quartile_label) return { value: cq.quartile_label, title: `Percentile ${cq.percentile}, cohort of ${cq.cohort_size} — provisional, see /citation-reports` }
      if (j.citation_rating) return { value: 'Unavailable', title: cq?.ranking_method === 'unavailable' ? `Cohort of ${cq.cohort_size ?? 0} is below the minimum of 20` : 'Not PSC-classified at high confidence' }
      return { value: 'Not released', title: 'PCI not yet wired into this cohort' }
    }
  }
}

const BENCHMARK_DISPLAY_CAP = 500

export type BenchmarkMode = 'mature' | 'not-yet-mature'

function applyBenchmarkMode(all: Journal[], mode: BenchmarkMode): Journal[] {
  if (mode === 'mature') return [...filterMatureRanked(all), ...filterMatureUnclassified(all)]
  return filterNotYetMature(all)
}

// Real AJR score first (highest first), falling back to the provisional
// Citation Q percentile for benchmark rows that have no AJR score at all.
function defaultSort(a: Journal, b: Journal): number {
  const av = a.early_stage_rating?.total ?? a.citation_rating?.citation_q?.percentile ?? -1
  const bv = b.early_stage_rating?.total ?? b.citation_rating?.citation_q?.percentile ?? -1
  return bv - av
}

/**
 * Shared table for /ratings/early-stage, /ratings/mature and
 * /coverage/global-benchmark — same journal-identity + AJR score + status
 * columns everywhere, with 0-2 track-specific columns (E-Q, M-Q, Citation Q,
 * Collection) appended per caller. See AJR-SPEC.md § 5 for why the ranking
 * shape is identical across tracks — only the input score/label differs.
 *
 * `journals` (Core Collection / curated benchmark — small, real
 * evidence-based data) renders immediately, server-side. `benchmarkMode`,
 * when given, fetches the much larger publisher-catalog expansion
 * (~3,300 records) client-side at runtime and merges in the matching rows
 * once loaded — NOT statically bundled, see publisher-catalog-client.ts's
 * header for why (an earlier version baked all of it into the static
 * build and broke a live Cloudflare Pages deployment).
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
  const [benchmarkTotal, setBenchmarkTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(!!benchmarkMode)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!benchmarkMode) return
    let cancelled = false
    fetchPublisherCatalogJournals()
      .then(all => {
        if (cancelled) return
        const matched = applyBenchmarkMode(all, benchmarkMode)
        setBenchmarkTotal(matched.length)
        setBenchmarkRows(matched.slice(0, BENCHMARK_DISPLAY_CAP))
      })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [benchmarkMode])

  const merged = benchmarkRows ? [...journals, ...benchmarkRows] : journals
  const rows = [...merged].sort(defaultSort)

  return (
    <div>
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
                      // citation_rating carries its own PSC classification for
                      // journals with no evidence-based rating (Global Benchmark
                      // publisher-catalog expansion) — fall back to it when the
                      // primary field is unset.
                      const category = j.psc_category ?? j.citation_rating?.psc_category
                      const lowConfidence = j.psc_category ? j.psc_confidence === 'low' : (j.citation_rating && j.citation_rating.psc_confidence !== 'high')
                      return category ? (
                        <>
                          {category}
                          {lowConfidence && <span className="ml-1 opacity-60" title="Not high-confidence classification">*</span>}
                        </>
                      ) : 'Not yet classified'
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>
                    {r?.total != null ? `${r.total}/100` : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="font-mono text-[10px] font-semibold"
                      style={{ color: ELIGIBILITY_COLOR[eligibility] }}
                      title={eligibility === 'not_yet_rateable' ? 'Below the minimum evidence bar — often because POSI\'s crawl was blocked (HTTP 403) by the site, not necessarily missing governance.' : undefined}
                    >
                      {ELIGIBILITY_LABEL[eligibility]}
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
          {!loading && !failed && benchmarkRows && benchmarkTotal != null && (
            benchmarkTotal > BENCHMARK_DISPLAY_CAP
              ? `Showing ${BENCHMARK_DISPLAY_CAP} of ${benchmarkTotal} Global Benchmark rows.`
              : `${benchmarkTotal} Global Benchmark row${benchmarkTotal === 1 ? '' : 's'} loaded.`
          )}
        </p>
      )}
    </div>
  )
}
