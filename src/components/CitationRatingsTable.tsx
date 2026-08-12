import type { Journal } from '@/lib/types'

/**
 * Table for the Global Benchmark publisher-catalog expansion's Citation Q
 * results (see posi-data's audits/migrations/benchmark-citation-q-2026/).
 * Deliberately NOT LifecycleRatingsTable — these journals never get an
 * "AJR Score" or eligibility Status (no evidence-based rating was
 * computed), so reusing that table would show a misleading "—"/"Unknown"
 * in columns that don't apply. Every figure shown here is explicitly
 * provisional; see the disclosure text on the pages that render this.
 */
export function CitationRatingsTable({ journals }: { journals: Journal[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
            <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
            <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Publisher</th>
            <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSC</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>2yr Mean Citedness</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Citation Q</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Percentile</th>
          </tr>
        </thead>
        <tbody>
          {journals.map(j => {
            const cr = j.citation_rating
            return (
              <tr key={j.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                <td className="px-4 py-3">
                  <a href={j.website_url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium block leading-tight transition-colors hover:text-[#c41e3a]" style={{ color: 'var(--posi-text)' }}>
                    {j.title}
                  </a>
                </td>
                <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>{j.publisher}</td>
                <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>
                  {cr?.psc_category ?? 'Not classified'}
                </td>
                <td className="px-3 py-3 text-center font-mono" style={{ color: 'var(--posi-text)' }}>
                  {cr?.two_yr_mean_citedness != null ? cr.two_yr_mean_citedness.toFixed(2) : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  {cr?.citation_q?.quartile_label ? (
                    <span className="font-mono text-[10px] font-semibold" style={{ color: '#1F7A4D' }}>{cr.citation_q.quartile_label}</span>
                  ) : (
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: 'var(--posi-muted)' }}
                      title={cr?.citation_q?.ranking_method === 'unavailable' ? `Ranking unavailable — category cohort of ${cr.citation_q.cohort_size ?? 0} is below the minimum of 20` : 'Not PSC-classified at high confidence'}
                    >
                      Unavailable
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center font-mono" style={{ color: 'var(--posi-muted)' }}>
                  {cr?.citation_q?.percentile != null ? `${cr.citation_q.percentile.toFixed(1)}%` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
