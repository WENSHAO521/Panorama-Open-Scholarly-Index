import { Suspense } from 'react'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import publisherCatalogMeta from '@/lib/publisher-catalog-meta.json'
import { LifecycleRatingsTable } from '@/components/LifecycleRatingsTable'
import { Callout } from '@/components/Callout'
import { DATA_SNAPSHOT_LABEL } from '@/lib/release'

export const metadata = {
  title: 'POSI Mature Journal Rankings — AJR-M',
  description: 'Journals 60+ months after first regular scholarly publication. AJR-M 1.0 methodology is implemented but has not yet been run against real evidence/citation data — no M-Q has been published.',
}

export default function MatureRankingsPage() {
  const core = getCoreCollection()
    .filter(j => j.early_stage_rating?.eligibility === 'mature')
  const curatedBenchmark = BENCHMARK_JOURNALS.filter(j => j.early_stage_rating?.eligibility === 'mature')
  const journals = [...core, ...curatedBenchmark]
  const benchmarkTotal = publisherCatalogMeta.mature_evidence

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/ratings" className="hover:text-gray-700">Ratings &amp; Rankings</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Mature Journal Rankings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
            {DATA_SNAPSHOT_LABEL}
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-warning)', border: '1px solid var(--posi-warning)', background: 'var(--posi-warning-bg)' }}>
            AJR-M 1.0 — PENDING DATA
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Mature Journal Rankings</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Journals with at least 60 months of publishing history — evaluated through{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR-M</strong>, the mature-journal track of{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR (POSI Automated Rating)</strong>
          {' '}(citation-weighted: Citation
          Performance, Output &amp; Stability, Governance &amp; Integrity, Infrastructure, Reach,
          Transparency), ranked as <strong style={{ color: 'var(--posi-text)' }}>M-Q1–M-Q4</strong>.
          M-Q ranks independently of Citation Q — see AJR-M-1.0-SPEC.md.
        </p>
      </div>

      <Callout variant="warning">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <p><strong>AJR-M 1.0 methodology:</strong> Implemented</p>
          <p><strong>Current rating status:</strong> Pending required mature-stage citation/evidence inputs</p>
          <p><strong>AJR-M Score:</strong> Not Yet Available</p>
          <p><strong>M-Q:</strong> Not Yet Available</p>
        </div>
        <span className="block mt-2">
          AJR-M-1.0-SPEC.md is implemented in posi-engine (<code className="font-mono">src/ajr-mature.mjs</code>)
          but has not been run against real evidence/citation data for any journal yet — no AJR-M score or M-Q
          exists to display. <strong>A mature journal is never scored with the AJR-E rubric</strong> (the
          early-stage 100-point evidence model) — any interim AJR-E-based figure computed for a mature journal
          earlier in POSI's history is retained only in historical data, never shown here as a current mature
          score. The {benchmarkTotal} Global Benchmark rows below (no evidence crawl run at this scale) show a
          diagnostic OpenAlex citation preview only — not a score, not ranked; see the Citation Preview column
          and <Link href="/citation-reports" className="underline">Citation Rankings</Link>.
        </span>
      </Callout>

      <Callout variant="info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <p><strong>Lifecycle window:</strong> 60+ months since first publication</p>
          <p><strong>Core Collection mature journals:</strong> {core.length}</p>
          <p><strong>Global Benchmark mature journals (evidence-rated):</strong> {curatedBenchmark.length}</p>
          <p><strong>Global Benchmark mature journals (citation preview only):</strong> {benchmarkTotal}</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
        </div>
      </Callout>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Mature Track</h2>
          <a href="https://github.com/WENSHAO521/posi-data/blob/master/AJR-SPEC.md" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Methodology (AJR 1.0) →
          </a>
        </div>
        {journals.length > 0 ? (
          <Suspense fallback={<div className="px-5 py-8 text-xs text-center" style={{ color: 'var(--posi-muted)' }}>Loading…</div>}>
            <LifecycleRatingsTable
              journals={journals}
              benchmarkMode="mature"
              columns={['collection', 'm-q', 'citation-preview']}
            />
          </Suspense>
        ) : (
          <p className="px-5 py-8 text-xs text-center" style={{ color: 'var(--posi-muted)' }}>
            No mature journals have cleared the evidence bar yet.
          </p>
        )}
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Global Benchmark rows (Collection: Benchmark, no AJR Score) are the 2026-08 Elsevier/Frontiers
          publisher-catalog expansion — bulk-ingested, not individually vetted, never an admission candidate,
          loaded client-side from a separate data file (not part of this page's initial HTML). Their Citation
          Preview is diagnostic only (OpenAlex 2yr mean citedness, not PCI, not ranked) — see{' '}
          <Link href="/coverage/global-benchmark" className="underline">Global Benchmark Collection</Link>.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/ratings/early-stage" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Early-Stage Rankings →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Rankings →</Link>
        <Link href="/coverage/global-benchmark" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Global Benchmark Collection →</Link>
      </div>
    </div>
  )
}
