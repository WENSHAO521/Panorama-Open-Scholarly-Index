import { Suspense } from 'react'
import Link from 'next/link'
import { getCoreCollection } from '@/lib/data'
import { CURATED_BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import { getAllPcsEntries, getPcsEntry } from '@/lib/pcs'
import { DATA_SNAPSHOT_LABEL } from '@/lib/release'
import { Callout } from '@/components/Callout'
import { PcsTable, type PcsRow } from '@/components/PcsTable'

export const metadata = {
  title: 'POSI Citation Score (PCS) | POSI',
  description: 'PCS is a real, Crossref-based 4-year citation-performance indicator, computed for the POSI Core Collection and curated Global Benchmark. Sorted by value — not an official POSI ranking.',
}

export default function PcsPage() {
  const core = getCoreCollection()
  const benchmark = CURATED_BENCHMARK_JOURNALS

  const rows: PcsRow[] = [...core, ...benchmark]
    .filter(j => !!j.posi_id)
    .map(j => {
      const entry = getPcsEntry(j.posi_id)
      return {
        journal_id: j.posi_id!,
        title: j.title,
        short_title: j.short_title,
        journal_code: j.journal_code,
        collection: j.is_external_benchmark ? 'benchmark' : 'core',
        is_external_benchmark: !!j.is_external_benchmark,
        website_url: j.website_url ?? null,
        pcs: entry?.pcs ?? null,
        pcs_eligible_items: entry?.pcs_eligible_items ?? null,
        pcs_coverage: entry?.pcs_coverage ?? null,
        pcs_window_start_year: entry?.pcs_window_start_year ?? null,
        pcs_window_end_year: entry?.pcs_window_end_year ?? null,
      }
    })

  const allEntries = getAllPcsEntries()
  const computedCount = allEntries.filter(r => r.pcs != null).length
  const window = allEntries.find(r => r.pcs_window_start_year != null)
  const windowLabel = window ? `${window.pcs_window_start_year}–${window.pcs_window_end_year}` : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/ratings" className="hover:text-gray-700">Ratings &amp; Rankings</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>POSI Citation Score</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
            {DATA_SNAPSHOT_LABEL}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            PCS-1.0 · Crossref-sourced
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Citation Score (PCS)</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Mean Crossref <code className="font-mono text-xs">is-referenced-by-count</code> across every eligible
          work{windowLabel ? ` published in ${windowLabel}` : ''} — a full cursor-paginated fetch, no article-sample
          cap (<a href="https://github.com/WENSHAO521/posi-data/blob/master/PCS-1.0-SPEC.md" target="_blank" rel="noopener noreferrer" className="underline">PCS-1.0-SPEC.md</a>).
          The table below is <strong style={{ color: 'var(--posi-text)' }}>sorted by PCS value, not ranked</strong> —
          see the notice below.
        </p>
      </div>

      {/* Mandatory disclosures — PCS-1.0-SPEC.md § 1 and § 11, verbatim */}
      <Callout variant="warning">
        <strong>PCS is independently reported and does not determine POSI Citation Rank, Citation Percentile, or
        Citation Quartile.</strong>
      </Callout>

      <Callout variant="info">
        <strong>PCS reflects citations known to Crossref through its Cited-by and metadata infrastructure.</strong>
        {' '}Crossref citation coverage is not exhaustive and may vary across publishers, journals, publication
        years, and disciplines. PCS therefore represents a Crossref-observed citation indicator, not a complete
        census of all citations to a work.
      </Callout>

      <section className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--posi-muted)' }}>Coverage of This Run</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
          <p><strong style={{ color: 'var(--posi-text)' }}>{computedCount}</strong> of {allEntries.length} journals have a computed PCS value.</p>
          <p><strong style={{ color: 'var(--posi-text)' }}>{allEntries.length - computedCount}</strong> journals show <em>No PCS available</em> — a real, checked outcome (a Crossref-unregistered or stale ISSN, no ISSN on record, or a journal too new for a complete 4-year window), not a zero score. See{' '}
            <a href="https://github.com/WENSHAO521/posi-data/blob/master/audits/pcs-etl/pcs-etl-v1-global1024-2026/README.md" target="_blank" rel="noopener noreferrer" className="underline">the full audit</a> for every journal's individual cause.
          </p>
          <p>Source: Crossref REST API, <code className="font-mono">is-referenced-by-count</code>.</p>
          <p>Window: {windowLabel ?? '—'} (4 complete publication years).</p>
        </div>
      </section>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <Suspense fallback={<div className="px-5 py-8 text-xs text-center" style={{ color: 'var(--posi-muted)' }}>Loading…</div>}>
          <PcsTable rows={rows} />
        </Suspense>
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Covers the POSI Core Collection and the curated Global Benchmark seed (the same {rows.length}-journal
          scope as <Link href="/citation-reports" className="underline">Citation Rankings</Link>'s Core Collection
          plus the curated benchmark). Retracted-but-citable works remain in the denominator with their Crossref
          count unmodified — PCS-1.0-SPEC.md § 10 explains why this differs from PCI's retraction handling.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pci" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PCI &amp; PCS Positioning →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Rankings (PCI preview) →</Link>
        <Link href="/ratings" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Ratings Overview →</Link>
      </div>
    </div>
  )
}
