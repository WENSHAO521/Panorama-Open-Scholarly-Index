'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { Pagination } from './Pagination'

export interface PcsRow {
  journal_id: string
  title: string
  short_title: string
  journal_code: string
  collection: 'core' | 'benchmark'
  is_external_benchmark: boolean
  website_url: string | null
  pcs: number | null
  pcs_eligible_items: number | null
  pcs_coverage: number | null
  pcs_window_start_year: number | null
  pcs_window_end_year: number | null
}

type SortKey = 'title' | 'pcs' | 'pcs_eligible_items' | 'pcs_coverage'

const COLUMNS: { key: SortKey; label: string; title?: string }[] = [
  { key: 'title', label: 'Journal' },
  { key: 'pcs', label: 'PCS', title: 'Mean Crossref is-referenced-by-count over eligible items published in the 4-year window — PCS-1.0-SPEC.md § 6. Sorted by value, not an official rank.' },
  { key: 'pcs_eligible_items', label: 'Eligible Items', title: 'Count of citable Crossref works in the 4-year window (PCS denominator) — no sampling cap.' },
  { key: 'pcs_coverage', label: 'Coverage', title: 'Fraction of enumerated in-window DOIs successfully fetched from Crossref for this snapshot.' },
]

const PER_PAGE = 25

/**
 * Sorted-by-value table, deliberately not a ranking display: no "#"
 * position column, no medal/tier badges — PCS-1.0-SPEC.md § 1 is explicit
 * that PCS never determines POSI Citation Rank/Percentile/Quartile.
 * Clicking a column header changes sort order, same interaction language
 * as CitationReportsTable/LifecycleRatingsTable, so nothing here reads as
 * an achievement ranking beyond "currently sorted by this column."
 *
 * Rows with pcs: null (60 of 1024 in the pcs-etl-v1-global1024-2026 run —
 * every one individually traced to a real, disclosed cause: 404/no-ISSN/
 * too-new/stale-ISSN/true-zero-output; see that audit's README) sort to
 * the bottom under any numeric column and show "No PCS available" rather
 * than 0 or a fabricated reason not present in the synced collection.
 */
export function PcsTable({ rows }: { rows: PcsRow[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [collection, setCollection] = useState<'' | 'core' | 'benchmark'>('')
  const [sortKey, setSortKey] = useState<SortKey>('pcs')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(
    () => (collection ? rows.filter(r => r.collection === collection) : rows),
    [rows, collection]
  )

  const sorted = useMemo(() => {
    const withValue = filtered.filter(r => r[sortKey] != null)
    const withoutValue = filtered.filter(r => r[sortKey] == null)
    withValue.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' || typeof bv === 'string') {
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    // pcs:null rows always trail, regardless of sort direction — a
    // "computed, no PCS" journal should never appear to outrank a real,
    // low value just because ascending sort was chosen.
    return [...withValue, ...withoutValue]
  }, [filtered, sortKey, sortDir])

  function resetPage() {
    if (searchParams.get('page')) router.push(pathname)
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'title' ? 'asc' : 'desc')
    }
    resetPage()
  }

  function handleCollectionChange(value: '' | 'core' | 'benchmark') {
    setCollection(value)
    resetPage()
  }

  const requestedPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const page = Math.min(requestedPage, totalPages)
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const withPcs = filtered.filter(r => r.pcs != null).length

  return (
    <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
      <div
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
        style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}
      >
        <select
          value={collection}
          onChange={e => handleCollectionChange(e.target.value as '' | 'core' | 'benchmark')}
          className="text-xs px-2 py-1.5 focus:outline-none"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', background: 'var(--posi-surface)' }}
        >
          <option value="">All journals</option>
          <option value="core">Core Collection only</option>
          <option value="benchmark">Global Benchmark only</option>
        </select>
        <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
          {sorted.length > 0 && `${((page - 1) * PER_PAGE + 1).toLocaleString()}–${Math.min(page * PER_PAGE, sorted.length).toLocaleString()} of `}
          {sorted.length.toLocaleString()} journals · {withPcs.toLocaleString()} with a computed PCS value
        </span>
      </div>

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
              <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Collection</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(row => (
              <tr key={row.journal_id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
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
                <td className="px-4 py-3 text-center font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>
                  {row.pcs != null ? row.pcs.toFixed(2) : <span className="font-normal" style={{ color: 'var(--posi-muted)' }}>No PCS available</span>}
                </td>
                <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                  {row.pcs_eligible_items != null ? row.pcs_eligible_items.toLocaleString() : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                </td>
                <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                  {row.pcs_coverage != null ? `${Math.round(row.pcs_coverage * 100)}%` : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                </td>
                <td className="px-3 py-3 text-xs" style={{ color: 'var(--posi-muted)' }}>
                  {row.collection === 'core' ? 'Core Collection' : 'Global Benchmark'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} makeHref={p => `${pathname}?page=${p}`} />
    </div>
  )
}
