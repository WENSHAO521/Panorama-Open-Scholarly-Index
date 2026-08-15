import Link from 'next/link'
import type { OpenAlexSourceStats } from '@/lib/api'
import type { PcsEntry } from '@/lib/pcs'
import type { PciEntry } from '@/lib/pci'
import type { CitationRankingEntry } from '@/lib/citation-rankings'

export function CitationImpactCard({
  stats,
  pcsEntry,
  pciEntry,
  citationQ,
  subjectPercentile,
}: {
  /** Absent when the journal has no resolvable OpenAlex source record — PCS/PCI (Crossref/OpenAlex-sourced) can still be real and shown below. */
  stats?: OpenAlexSourceStats | null
  /** Real PCS-1.0 value (PCS-1.0-SPEC.md), synced from posi-data-delivery. */
  pcsEntry?: PcsEntry | null
  /** Real PCI value (PJR-SPEC.md § 5-6), synced from posi-data-delivery — real for only 2 of 30 resolvable Core Collection journals so far (too young otherwise). */
  pciEntry?: PciEntry | null
  /** Real Citation Q (PJR-SPEC.md § 8) — only set for the 2 journals whose real-PCI peer pool (Core Collection + Global Benchmark) reached MIN_CATEGORY_SIZE=20. */
  citationQ?: CitationRankingEntry | null
  subjectPercentile?: number | null
}) {
  const rows = !stats ? [] : [
    { label: '2-Yr Citedness', value: stats.two_yr_mean_citedness != null ? stats.two_yr_mean_citedness.toFixed(2) : null },
    { label: 'h-index', value: stats.h_index != null ? String(stats.h_index) : null },
    { label: 'Total Citations', value: stats.cited_by_count != null ? stats.cited_by_count.toLocaleString() : null },
    ...(subjectPercentile != null ? [{ label: 'Subject Percentile', value: `${subjectPercentile}th` }] : []),
  ].filter(r => r.value != null)

  if (rows.length === 0 && !pcsEntry && !pciEntry) return null

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
          2-Yr Citedness = OpenAlex 2yr mean citedness, a source-level preview indicator — not a Web of
          Science or Scopus metric, and it does not determine Citation Rank, Percentile, or Quartile — only
          PCI does, once a formal PJR release exists.{' '}
          <Link href="/pci" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Full positioning statement →
          </Link>{' '}
          <Link href="/citation-reports" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Compare in Citation Reports →
          </Link>
        </p>
      )}

      {pciEntry && (
        <div className={rows.length > 0 ? 'mt-4 pt-4' : ''} style={rows.length > 0 ? { borderTop: '1px solid var(--posi-border-light)' } : undefined}>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
              PCI <span className="font-normal normal-case">(POSI Citation Impact)</span>
            </span>
            <span className="font-mono font-semibold text-sm" style={{ color: 'var(--posi-text)' }}>
              {pciEntry.pci != null ? pciEntry.pci.toFixed(2) : 'No PCI available'}
            </span>
          </div>
          {pciEntry.pci != null && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--posi-muted)' }}>
              {pciEntry.pci_citable_items?.toLocaleString() ?? '—'} citable items,{' '}
              {pciEntry.pci_window_start_year}–{pciEntry.pci_window_end_year}, OpenAlex-sourced, exact
              (uncapped) numerator.
            </p>
          )}
          {citationQ && citationQ.quartile && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5"
                style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}
              >
                Citation {citationQ.quartile}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--posi-muted)' }}>
                {citationQ.percentile != null ? `${citationQ.percentile.toFixed(1)}th percentile, ` : ''}
                real, category-pooled peer group of {citationQ.category_size}
              </span>
            </div>
          )}
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            {citationQ && citationQ.quartile ? (
              <>This journal&apos;s Citation {citationQ.quartile} is real, computed against a peer pool combining POSI Core Collection and Global Benchmark journals with real PCI (PJR-SPEC.md § 8) — not yet from a formal POSI-R release.</>
            ) : (
              <>PCI does not yet determine an official POSI Citation Rank, Citation Percentile, or Citation Quartile for this journal — no POSI-R-* release has been produced, and/or its PSC category&apos;s real-PCI peer pool hasn&apos;t reached the minimum size yet.</>
            )}{' '}
            <Link href="/pci" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
              Full PCI table →
            </Link>
          </p>
        </div>
      )}

      {pcsEntry && (
        <div className={(rows.length > 0 || pciEntry) ? 'mt-4 pt-4' : ''} style={(rows.length > 0 || pciEntry) ? { borderTop: '1px solid var(--posi-border-light)' } : undefined}>
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
