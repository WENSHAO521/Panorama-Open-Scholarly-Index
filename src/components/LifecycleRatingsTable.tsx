import Link from 'next/link'
import type { Journal } from '@/lib/types'

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

export type ExtraColumn = {
  header: string
  render: (j: Journal) => { value: string; title?: string }
}

/**
 * Shared table for /ratings/early-stage, /ratings/mature and
 * /coverage/global-benchmark — same journal-identity + AJR score + status
 * columns everywhere, with 0-2 track-specific columns (E-Q, M-Q, Citation Q,
 * Collection) appended per caller. See AJR-SPEC.md § 5 for why the ranking
 * shape is identical across tracks — only the input score/label differs.
 */
export function LifecycleRatingsTable({ journals, extraColumns = [] }: { journals: Journal[]; extraColumns?: ExtraColumn[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
            <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
            <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Publisher</th>
            <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSC</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>AJR Score</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Status</th>
            {extraColumns.map(col => (
              <th key={col.header} className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {journals.map(j => {
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
                  {j.psc_category ? (
                    <>
                      {j.psc_category}
                      {j.psc_confidence === 'low' && <span className="ml-1 opacity-60" title="Low-confidence classification">*</span>}
                    </>
                  ) : 'Not yet classified'}
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
                {extraColumns.map(col => {
                  const { value, title } = col.render(j)
                  return (
                    <td key={col.header} className="px-3 py-3 text-center text-[10px]" style={{ color: 'var(--posi-muted)' }} title={title}>
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
  )
}
