import Link from 'next/link'
import { WarningCircle, Info } from '@phosphor-icons/react/dist/ssr'
import { BENCHMARK_JOURNALS, CURATED_BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import publisherCatalogMeta from '@/lib/publisher-catalog-meta.json'
import { LifecycleRatingsTable } from '@/components/LifecycleRatingsTable'

export const metadata = {
  title: 'POSI Global Benchmark Collection',
  description: 'A curated set of internationally established journals, plus a larger publisher-catalog expansion, used as an external validation corpus for AJR — not part of the POSI Core Collection, not an admission candidate.',
}

export default function GlobalBenchmarkPage() {
  const sorted = [...BENCHMARK_JOURNALS].sort((a, b) => (b.early_stage_rating?.total ?? -1) - (a.early_stage_rating?.total ?? -1))
  const rated = sorted.filter(j => j.early_stage_rating?.total != null)
  const blocked = sorted.filter(j => j.early_stage_rating?.eligibility === 'not_yet_rateable')
  const unknown = sorted.filter(j => j.early_stage_rating?.eligibility === 'unknown')
  const top = rated.slice(0, 50)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Global Benchmark Collection</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: '#6B7280' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Global Benchmark Collection</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          {CURATED_BENCHMARK_JOURNALS.length} internationally established journals, rated by the identical{' '}
          <Link href="/ratings" className="underline">AJR (POSI Automated Rating)</Link> pipeline used on
          the Core Collection — an external validation corpus, used to check the
          methodology against journals already broadly agreed to be excellent. Selected using only
          OpenAlex&apos;s own open signals (is_core, citation activity, topic-domain balance) — no Web of
          Science or Scopus data anywhere in selection or scoring.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {['Not the POSI Core Collection', 'Not an admission candidate', 'Not counted in Indexed/Metric Eligible stats'].map(t => (
            <span key={t} className="text-[10px] font-mono px-2 py-1" style={{ color: '#6B7280', border: '1px solid var(--posi-border)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <span style={{ color: '#1d4ed8' }}>
          <strong>2026-08 publisher-catalog expansion:</strong> {publisherCatalogMeta.count} additional
          records were added from full active-journal exports (Elsevier&apos;s <code>jnlactive.csv</code>, Frontiers&apos;
          title list) to validate the ingestion/identity pipeline against real, messy publisher data at scale —
          not because every title in a publisher&apos;s complete catalog is individually &quot;internationally
          established.&quot; These records are unrated (no AJR score is computed for them) and their presence here
          never makes a journal ranking-eligible on its own — see the identity/registry documentation in{' '}
          <a href="https://github.com/WENSHAO521/posi-data" target="_blank" rel="noopener noreferrer" className="underline">posi-data</a>.
        </span>
      </div>

      <div className="coverage-grid grid sm:grid-cols-5 gap-0" style={{ border: '1px solid var(--posi-border)' }}>
        {[
          { label: 'Total Journals', value: BENCHMARK_JOURNALS.length + publisherCatalogMeta.count },
          { label: 'Curated Seed', value: CURATED_BENCHMARK_JOURNALS.length },
          { label: 'Rated', value: rated.length },
          { label: 'Blocked / Insufficient Evidence', value: blocked.length },
          { label: 'Unknown', value: unknown.length },
        ].map(s => (
          <div key={s.label} className="p-5" style={{ background: 'var(--posi-surface)', borderLeft: '1px solid var(--posi-border)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--posi-text)', fontFamily: 'var(--font-mono)' }}>{s.value}</p>
            <p className="text-[10px] uppercase mt-1" style={{ color: 'var(--posi-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] -mt-3" style={{ color: 'var(--posi-muted)' }}>
        Curated Seed + Publisher Catalog Expansion ({publisherCatalogMeta.count}, unrated by design) = Total. Rated + Blocked + Unknown = Curated Seed.
      </p>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <WarningCircle className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#92400e' }} />
        <span style={{ color: '#92400e' }}>
          <strong>Evidence acquisition finding:</strong> the first benchmark run scored only 5 of 200 journals. Extending
          the evidence crawl to check policy subpages (not just the homepage) and widening the ethics-keyword
          set raised this to 22 of 200 (Nature now scores 71/100) — a real improvement. Expanding the corpus to
          600 journals held at the same ~9% rate, ruling out sample size as the cause. A direct investigation
          found the real bottleneck: <strong>73% of a sampled batch of still-failing journals return HTTP 403 on
          the first request</strong> — Elsevier, Wiley, ACS, APS, AIP, Oxford, and IOP platforms among them.
          No amount of subpage-guessing or keyword-widening can fix that; it&apos;s a structural ceiling of a
          plain-HTTP-only crawl, not evidence those journals lack real governance. <strong>&quot;Not Yet Rateable&quot; on a
          bot-protected platform means POSI&apos;s crawl was blocked — not that no evidence of governance exists.</strong>{' '}
          Published here rather than quietly smoothed over, per POSI&apos;s own no-hidden-adjustment principle.
        </span>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
            Top {top.length} of {rated.length} Rated
          </h2>
          <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>
            {rated.length} of {CURATED_BENCHMARK_JOURNALS.length} curated-seed journals scored
          </span>
        </div>
        <LifecycleRatingsTable journals={top} />
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Benchmark journals never receive an E-Q or M-Q — the Core Collection quartile systems don't apply
          here. The publisher-catalog expansion's OpenAlex citation figure is a diagnostic preview only, not
          PCI, not ranked (see <Link href="/citation-reports" className="underline">Citation Rankings</Link>).
          Full corpus and per-journal evidence: see{' '}
          <a href="https://github.com/WENSHAO521/Panorama-Open-Scholarly-Index/blob/master/src/lib/benchmark-journals.ts" target="_blank" rel="noopener noreferrer" className="underline">benchmark-journals.ts →</a>
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/ratings" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Ratings Overview →</Link>
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
      </div>
    </div>
  )
}
