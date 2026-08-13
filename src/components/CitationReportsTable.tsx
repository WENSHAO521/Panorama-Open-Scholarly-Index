'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { fetchPublisherCatalogJournals } from '@/lib/publisher-catalog-client'
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
  pcs_ratio: number | null
  pcs_window: string | null
  // Global Benchmark publisher-catalog rows have no internal /journal/
  // page — link out to the publisher's own site instead, same pattern as
  // LifecycleRatingsTable.
  is_external_benchmark?: boolean
  website_url?: string | null
}

type SortKey = 'title' | 'two_yr_mean_citedness' | 'pcs_ratio' | 'h_index' | 'cited_by_count' | 'subject_percentile'

const COLUMNS: { key: SortKey; label: string; title?: string }[] = [
  { key: 'title', label: 'Journal' },
  { key: 'two_yr_mean_citedness', label: '2-Yr Citedness', title: 'OpenAlex 2-year mean citedness — a source-level preview indicator only, not PCI. Only PCI determines Citation Rank, Percentile, or Quartile.' },
  { key: 'pcs_ratio', label: 'Legacy Crossref Preview', title: 'Crossref mean citations per article over a trailing 4-year window, currently capped at a 200-article sample — not yet PCS 1.0 (which is uncapped), so not labeled "PCS" until the real Crossref ETL runs. Does not determine Citation Rank, Percentile, or Quartile.' },
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
    fetchPublisherCatalogJournals()
      .then(all => {
        if (cancelled) return
        const classified = all.filter(j => j.citation_preview)
        const sorted = [...classified].sort((a, b) => (b.citation_preview!.value ?? 0) - (a.citation_preview!.value ?? 0))
        // No subject_percentile for Global Benchmark rows — citation_preview
        // is diagnostic-only (rank/percentile/quartile always null, see
        // types.ts's CitationPreview), never a real ranking.
        const mapped: CitationReportRow[] = sorted.map(j => ({
          title: j.title,
          short_title: j.short_title,
          journal_code: j.journal_code,
          subject: j.citation_preview!.psc_category,
          two_yr_mean_citedness: j.citation_preview!.value,
          h_index: j.citation_preview!.h_index,
          cited_by_count: null,
          pcs_ratio: null,
          pcs_window: null,
          subject_percentile: null,
          is_external_benchmark: true,
          website_url: j.website_url,
        }))
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <select
          value={subject}
          onChange={e => handleSubjectChange(e.target.value)}
          className="text-xs px-2 py-1.5 focus:outline-none"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', background: 'white' }}
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

      <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
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
                  <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }} title={row.pcs_window ?? undefined}>
                    {row.pcs_ratio != null ? row.pcs_ratio.toFixed(2) : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
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
