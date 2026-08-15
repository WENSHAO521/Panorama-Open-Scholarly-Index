'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { Pagination } from './Pagination'

export interface PciRow {
  journal_id: string
  title: string
  short_title: string
  journal_code: string
  collection: 'core' | 'benchmark'
  is_external_benchmark: boolean
  website_url: string | null
  pci: number | null
  pci_citable_items: number | null
  pci_5yr: number | null
}

type SortKey = 'title' | 'pci' | 'pci_citable_items' | 'pci_5yr'

const COLUMNS: { key: SortKey; label: string; title?: string }[] = [
  { key: 'title', label: 'Journal' },
  { key: 'pci', label: 'PCI (2yr)', title: 'Citations received in the metric year to citable items published in the prior 2 years, divided by that citable-item count — PJR-SPEC.md § 5-6. Sorted by value, not an official rank.' },
  { key: 'pci_citable_items', label: 'Citable Items', title: 'Count of citable OpenAlex works (article/review) in the 2-year window — PCI denominator, always an exact, uncapped count.' },
  { key: 'pci_5yr', label: 'PCI-5', title: '5-year window variant of PCI. The older 3 years of this window can be capped for very high-volume journals — see the audit README.' },
]

const PER_PAGE = 25

/**
 * Sorted-by-value table, deliberately not a ranking display — same
 * PJR-SPEC.md non-overclaiming posture as PcsTable: no "#" position
 * column, no medal/tier badges. This real PCI data still does not
 * determine POSI Citation Rank/Percentile/Quartile, because no
 * POSI-R-* release has been produced and PNCI (which needs every
 * metric-eligible journal in a PSC category computed together) hasn't
 * been computed for this run — see /pci for the full positioning
 * statement.
 *
 * Rows with pci: null (3 of 993 in the pjr-seed-corpus-global993-2026
 * run — a real, checked zero-eligible-items outcome, not a fabricated
 * reason) sort to the bottom under any numeric column and show "No PCI
 * available" rather than 0.
 */
export function PciTable({ rows }: { rows: PciRow[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [collection, setCollection] = useState<'' | 'core' | 'benchmark'>('')
  const [sortKey, setSortKey] = useState<SortKey>('pci')
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

  const withPci = filtered.filter(r => r.pci != null).length

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
          {sorted.length.toLocaleString()} journals · {withPci.toLocaleString()} with a computed PCI value
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
                  {row.pci != null ? row.pci.toFixed(2) : <span className="font-normal" style={{ color: 'var(--posi-muted)' }}>No PCI available</span>}
                </td>
                <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                  {row.pci_citable_items != null ? row.pci_citable_items.toLocaleString() : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                </td>
                <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                  {row.pci_5yr != null ? row.pci_5yr.toFixed(2) : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
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
