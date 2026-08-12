'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr'

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
  { key: 'two_yr_mean_citedness', label: '2-Yr Citedness', title: 'OpenAlex 2-year mean citedness — a provisional preview of PCI, not yet the official PJR-computed value' },
  { key: 'pcs_ratio', label: 'PCS', title: 'POSI Citation Score — Crossref mean citations per article over a trailing 4-year window, comparable to CiteScore' },
  { key: 'h_index', label: 'h-index' },
  { key: 'cited_by_count', label: 'Total Citations' },
  { key: 'subject_percentile', label: 'Subject Percentile' },
]

export function CitationReportsTable({ rows }: { rows: CitationReportRow[] }) {
  const [subject, setSubject] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('two_yr_mean_citedness')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(
    () => (subject ? rows.filter(r => r.subject === subject) : rows),
    [rows, subject]
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

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const subjectsPresent = Array.from(new Set(rows.map(r => r.subject).filter((s): s is string => !!s))).sort()

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="text-xs px-2 py-1.5 focus:outline-none"
          style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', background: 'white' }}
        >
          <option value="">All subjects</option>
          {subjectsPresent.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
          {sorted.length.toLocaleString()} journals
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
              {sorted.map(row => (
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
    </div>
  )
}
