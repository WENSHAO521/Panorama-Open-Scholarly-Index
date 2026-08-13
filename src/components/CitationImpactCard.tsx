import Link from 'next/link'
import type { OpenAlexSourceStats, CrossrefCitationScore } from '@/lib/api'

export function CitationImpactCard({
  stats,
  pcs,
  subjectPercentile,
}: {
  stats: OpenAlexSourceStats
  pcs?: CrossrefCitationScore | null
  subjectPercentile?: number | null
}) {
  const rows = [
    { label: '2-Yr Citedness', value: stats.two_yr_mean_citedness != null ? stats.two_yr_mean_citedness.toFixed(2) : null },
    { label: 'Legacy Crossref Preview', value: pcs?.ratio != null ? pcs.ratio.toFixed(2) : null },
    { label: 'h-index', value: stats.h_index != null ? String(stats.h_index) : null },
    { label: 'Total Citations', value: stats.cited_by_count != null ? stats.cited_by_count.toLocaleString() : null },
    ...(subjectPercentile != null ? [{ label: 'Subject Percentile', value: `${subjectPercentile}th` }] : []),
  ].filter(r => r.value != null)

  if (rows.length === 0) return null

  return (
    <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--posi-muted)' }}>
        Citation Impact
      </h2>
      <div className="space-y-2 text-xs">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between">
            <span style={{ color: 'var(--posi-muted)' }}>{r.label}</span>
            <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>{r.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        2-Yr Citedness = OpenAlex 2yr mean citedness, a source-level preview indicator — not PCI. Legacy
        Crossref Preview = Crossref {pcs?.window ?? '4yr'} mean citations/article, capped at a 200-article
        sample — not yet PCS 1.0 (uncapped). Neither is a Web of Science or Scopus metric, and neither
        determines Citation Rank, Percentile, or Quartile — only PCI does, once a formal PJR release exists.{' '}
        <Link href="/pci" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
          Full positioning statement →
        </Link>{' '}
        <Link href="/citation-reports" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
          Compare in Citation Reports →
        </Link>
      </p>
    </div>
  )
}
