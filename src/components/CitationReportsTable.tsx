'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { fetchPublisherCatalogJournals } from '@/lib/publisher-catalog-client'
import { fetchAllPcsEntriesClient, indexPcsEntriesByJournalId, type PcsClientEntry } from '@/lib/pcs-client'
import { Pagination } from './Pagination'

export interface CitationReportRow {
  title: string
  short_title: string
  journal_code: string
  subject: string | null
  two_yr_mean_citedness: number | null
  h_index: number | null
  cited_by_count: number | null
  subject_percentile: number | null
  // Real PCS-1.0 (PCS-1.0-SPEC.md), synced from posi-data-delivery's
  // collections/pcs.json — full cursor-paginated Crossref count, no
  // article-sample cap. Replaced the old 200-article-capped "Legacy
  // Crossref Preview" field here once the real PCS ETL ran (2026-08-14).
  pcs: number | null
  pcs_window_start_year: number | null
  pcs_window_end_year: number | null
  // Global Benchmark publisher-catalog rows have no internal /journal/
  // page — link out to the publisher's own site instead, same pattern as
  // LifecycleRatingsTable.
  is_external_benchmark?: boolean
  website_url?: string | null
}

type SortKey = 'title' | 'two_yr_mean_citedness' | 'pcs' | 'h_index' | 'cited_by_count' | 'subject_percentile'

const COLUMNS: { key: SortKey; label: string; title?: string }[] = [
  { key: 'title', label: 'Journal' },
  { key: 'two_yr_mean_citedness', label: '2-Yr Citedness', title: 'OpenAlex 2-year mean citedness — a source-level preview indicator only, not PCI. Only PCI determines Citation Rank, Percentile, or Quartile.' },
  { key: 'pcs', label: 'PCS', title: 'POSI Citation Score — mean Crossref is-referenced-by-count across every eligible work in the 4-year window (PCS-1.0-SPEC.md § 6), no article-sample cap. Independently reported; does not determine Citation Rank, Percentile, or Quartile.' },
  { key: 'h_index', label: 'h-index' },
  { key: 'cited_by_count', label: 'Total Citations' },
  { key: 'subject_percentile', label: 'Subject Percentile' },
]

const PER_PAGE = 25

/**
 * `rows` (Core Collection — small, manually-reviewed, precomputed citation
 * stats) renders immediately. `fetchBenchmark`, when true, loads the much
 * larger Global Benchmark publisher-catalog expansion (~3,300 records)
 * client-side at runtime and merges in ALL of its citation_preview figures
 * once loaded (no display cap) — NOT statically bundled, see
 * publisher-catalog-client.ts's header for why (an earlier version baked
 * all of it into the static build and broke a live Cloudflare Pages
 * deployment). Paginated (`?page=`, PER_PAGE rows/page — same
 * Pagination/pageWindow pattern used elsewhere on the site) so every row
 * is reachable no matter how large the merged set grows.
 *
 * PCS for these benchmark rows (2026-08-14): fetched client-side too, via
 * pcs-client.ts's fetchAllPcsEntriesClient() — same reasoning as the
 * publisher-catalog fetch itself (this is a client component; a static
 * `import raw from './pcs.json'` here would ship the whole collection in
 * the client JS bundle, not just server-render it). Joined by posi_id.
 * Before this, every benchmark row hardcoded `pcs: null` unconditionally —
 * not because PCS didn't exist for these journals, but because it was
 * never looked up at all. Fixed once posi-data's pcs-etl-v1-global4289
 * run gave the full 4289-journal Global Benchmark real PCS coverage.
 */
export function CitationReportsTable({ rows, fetchBenchmark }: { rows: CitationReportRow[]; fetchBenchmark?: boolean }) {
  const [benchmarkRows, setBenchmarkRows] = useState<CitationReportRow[]>([])
  const [loading, setLoading] = useState(!!fetchBenchmark)
  const [failed, setFailed] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!fetchBenchmark) return
    let cancelled = false
    Promise.all([
      fetchPublisherCatalogJournals(),
      // PCS is a nice-to-have enrichment for this set, not a hard
      // dependency — if it fails to load, the benchmark rows should still
      // render (with pcs: null, same as before this change) rather than
      // the whole table failing.
      fetchAllPcsEntriesClient().catch(() => [] as PcsClientEntry[]),
    ])
      .then(([all, pcsEntries]) => {
        if (cancelled) return
        const pcsById = indexPcsEntriesByJournalId(pcsEntries)
        const classified = all.filter(j => j.citation_preview)
        const sorted = [...classified].sort((a, b) => (b.citation_preview!.value ?? 0) - (a.citation_preview!.value ?? 0))
        // No subject_percentile for Global Benchmark rows — citation_preview
        // is diagnostic-only (rank/percentile/quartile always null, see
        // types.ts's CitationPreview), never a real ranking.
        const mapped: CitationReportRow[] = sorted.map(j => {
          const pcsEntry = j.posi_id ? pcsById.get(j.posi_id) : undefined
          return {
            title: j.title,
            short_title: j.short_title,
            journal_code: j.journal_code,
            subject: j.citation_preview!.psc_category,
            two_yr_mean_citedness: j.citation_preview!.value,
            h_index: j.citation_preview!.h_index,
            cited_by_count: null,
            pcs: pcsEntry?.pcs ?? null,
            pcs_window_start_year: pcsEntry?.pcs_window_start_year ?? null,
            pcs_window_end_year: pcsEntry?.pcs_window_end_year ?? null,
            subject_percentile: null,
            is_external_benchmark: true,
            website_url: j.website_url,
          }
        })
        setBenchmarkRows(mapped)
      })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fetchBenchmark])

  const allRows = useMemo(() => [...rows, ...benchmarkRows], [rows, benchmarkRows])

  const [subject, setSubject] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('two_yr_mean_citedness')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(
    () => (subject ? allRows.filter(r => r.subject === subject) : allRows),
    [allRows, subject]
  )

  const sorted = useMemo(() => {
    const withValue = filtered.filter(r => r[sortKey] != null)
    const withoutValue = filtered.filter(r => r[sortKey] == null)
    withValue.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' || typeof bv === 'string') {
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return [...withValue, ...withoutValue]
  }, [filtered, sortKey, sortDir])

  // Changing the subject filter or sort resets to page 1 — page 4 of an old
  // filter/sort almost never corresponds to anything meaningful once the
  // underlying row order changes.
  function resetPage() {
    if (searchParams.get('page')) router.push(pathname)
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    resetPage()
  }

  function handleSubjectChange(value: string) {
    setSubject(value)
    resetPage()
  }

  const requestedPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const page = Math.min(requestedPage, totalPages)
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const subjectsPresent = Array.from(new Set(allRows.map(r => r.subject).filter((s): s is string => !!s))).sort()

  return (
    <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
      {/* Filter + range toolbar as this card's own top strip (same gray
          background/hairline-border language the table's <thead> and every
          other section header on the site uses) rather than a separate
          floating row above a disconnected bordered box. */}
      <div
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
        style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}
      >
        <select
          value={subject}
          onChange={e => handleSubjectChange(e.target.value)}
          className="text-xs px-2 py-1.5 focus:outline-none"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', background: 'var(--posi-surface)' }}
        >
          <option value="">All subjects</option>
          {subjectsPresent.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
          {sorted.length > 0 && `${((page - 1) * PER_PAGE + 1).toLocaleString()}–${Math.min(page * PER_PAGE, sorted.length).toLocaleString()} of `}
          {sorted.length.toLocaleString()} journals
          {fetchBenchmark && loading && ' · loading Global Benchmark…'}
          {fetchBenchmark && !loading && failed && ' · Global Benchmark rows failed to load'}
        </span>
      </div>

      <div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    title={col.title}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-2.5 font-semibold uppercase tracking-[0.07em] cursor-pointer select-none whitespace-nowrap ${col.key === 'title' ? 'text-left' : 'text-center'}`}
                    style={{ color: sortKey === col.key ? 'var(--posi-primary)' : 'var(--posi-muted)' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (sortDir === 'asc' ? <CaretUp className="h-3 w-3" /> : <CaretDown className="h-3 w-3" />)}
                    </span>
                  </th>
                ))}
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Subject</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(row => (
                <tr key={row.journal_code} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                  <td className="px-4 py-3">
                    {row.is_external_benchmark ? (
                      <a href={row.website_url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                        {row.title}
                      </a>
                    ) : (
                      <Link href={`/journal/${row.journal_code}`} className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                        {row.title}
                      </Link>
                    )}
                    <span className="font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{row.short_title}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                    {row.two_yr_mean_citedness != null ? row.two_yr_mean_citedness.toFixed(2) : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td
                    className="px-4 py-3 text-center font-mono"
                    style={{ color: 'var(--posi-text)' }}
                    title={row.pcs_window_start_year != null ? `${row.pcs_window_start_year}–${row.pcs_window_end_year}` : undefined}
                  >
                    {row.pcs != null ? row.pcs.toFixed(2) : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                    {row.h_index != null ? row.h_index : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                    {row.cited_by_count != null ? row.cited_by_count.toLocaleString() : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                    {row.subject_percentile != null ? `${row.subject_percentile}th` : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: 'var(--posi-muted)' }}>{row.subject ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} makeHref={p => `${pathname}?page=${p}`} />
    </div>
  )
}
