import Link from 'next/link'
import type { OpenAlexSourceStats, CrossrefCitationScore } from '@/lib/api'
import type { PcsEntry } from '@/lib/pcs'

export function CitationImpactCard({
  stats,
  pcs,
  pcsEntry,
  subjectPercentile,
}: {
  /** Absent when the journal has no resolvable OpenAlex source record — PCS (Crossref-sourced) can still be real and shown below. */
  stats?: OpenAlexSourceStats | null
  pcs?: CrossrefCitationScore | null
  /** Real PCS-1.0 value (PCS-1.0-SPEC.md), synced from posi-data-delivery — distinct from the legacy `pcs` prop above. */
  pcsEntry?: PcsEntry | null
  subjectPercentile?: number | null
}) {
  const rows = !stats ? [] : [
    { label: '2-Yr Citedness', value: stats.two_yr_mean_citedness != null ? stats.two_yr_mean_citedness.toFixed(2) : null },
    { label: 'Legacy Crossref Preview', value: pcs?.ratio != null ? pcs.ratio.toFixed(2) : null },
    { label: 'h-index', value: stats.h_index != null ? String(stats.h_index) : null },
    { label: 'Total Citations', value: stats.cited_by_count != null ? stats.cited_by_count.toLocaleString() : null },
    ...(subjectPercentile != null ? [{ label: 'Subject Percentile', value: `${subjectPercentile}th` }] : []),
  ].filter(r => r.value != null)

  if (rows.length === 0 && !pcsEntry) return null

  return (
    <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--posi-muted)' }}>
        Citation Impact
      </h2>
      {rows.length > 0 && (
        <div className="space-y-2 text-xs">
          {rows.map(r => (
            <div key={r.label} className="flex justify-between">
              <span style={{ color: 'var(--posi-muted)' }}>{r.label}</span>
              <span className="font-mono font-medium" style={{ color: 'var(--posi-text)' }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
      {rows.length > 0 && (
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
      )}

      {pcsEntry && (
        <div className={rows.length > 0 ? 'mt-4 pt-4' : ''} style={rows.length > 0 ? { borderTop: '1px solid var(--posi-border-light)' } : undefined}>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
              PCS <span className="font-normal normal-case">(POSI Citation Score)</span>
            </span>
            <span className="font-mono font-semibold text-sm" style={{ color: 'var(--posi-text)' }}>
              {pcsEntry.pcs != null ? pcsEntry.pcs.toFixed(2) : 'No PCS available'}
            </span>
          </div>
          {pcsEntry.pcs != null && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--posi-muted)' }}>
              {pcsEntry.pcs_eligible_items?.toLocaleString() ?? '—'} eligible items,{' '}
              {pcsEntry.pcs_window_start_year}–{pcsEntry.pcs_window_end_year}, Crossref-sourced.
            </p>
          )}
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            <strong>PCS is independently reported and does not determine POSI Citation Rank, Citation
            Percentile, or Citation Quartile.</strong> PCS reflects citations known to Crossref through its
            Cited-by and metadata infrastructure. Crossref citation coverage is not exhaustive and may vary
            across publishers, journals, publication years, and disciplines. PCS therefore represents a
            Crossref-observed citation indicator, not a complete census of all citations to a work.{' '}
            <Link href="/pcs" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
              Full PCS table →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
