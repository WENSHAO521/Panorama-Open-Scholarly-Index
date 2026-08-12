import Link from 'next/link'
import { Info, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { BENCHMARK_JOURNALS, MATURE_RANKED_BENCHMARK_JOURNALS, MATURE_UNCLASSIFIED_BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import { LifecycleRatingsTable } from '@/components/LifecycleRatingsTable'
import { RELEASE_LABEL } from '@/lib/release'

export const metadata = {
  title: 'POSI Mature Journal Rankings — AJR-M',
  description: 'Journals 60+ months after first regular scholarly publication, ranked M-Q1–M-Q4 within PSC peer cohorts. Scores are the interim AJR-E rubric pending the citation-weighted AJR-M model.',
}

export default function MatureRankingsPage() {
  const core = getCoreCollection()
    .filter(j => j.early_stage_rating?.eligibility === 'mature')
  const curatedBenchmark = BENCHMARK_JOURNALS.filter(j => j.early_stage_rating?.eligibility === 'mature')
  // Global Benchmark publisher-catalog expansion journals (no evidence-based
  // AJR score — early_stage_rating is null) that are mature, both ranked
  // (a real Citation Q) and unranked (unclassified / cohort too small) —
  // shown in the SAME table as everything else, not a separate section. See
  // posi-data's audits/migrations/benchmark-citation-q-2026/.
  //
  // Capped: this table is fully static-rendered (no server pagination), and
  // an earlier uncapped version (all 2,695 benchmark rows -> 2,794 total)
  // produced a 9.5 MB single HTML page and broke a live Cloudflare Pages
  // deployment ("Failed to publish assets"). Same "Top N" convention
  // already used on /coverage/global-benchmark.
  const BENCHMARK_DISPLAY_CAP = 200
  const benchmarkTotal = MATURE_RANKED_BENCHMARK_JOURNALS.length + MATURE_UNCLASSIFIED_BENCHMARK_JOURNALS.length
  const benchmarkShown = [...MATURE_RANKED_BENCHMARK_JOURNALS, ...MATURE_UNCLASSIFIED_BENCHMARK_JOURNALS].slice(0, BENCHMARK_DISPLAY_CAP)
  const journals = [...core, ...curatedBenchmark, ...benchmarkShown]
    .sort((a, b) => {
      const av = a.early_stage_rating?.total ?? a.citation_rating?.citation_q?.percentile ?? -1
      const bv = b.early_stage_rating?.total ?? b.citation_rating?.citation_q?.percentile ?? -1
      return bv - av
    })
  const mQAssignedCount = journals.filter(j => j.early_stage_rating?.provisional_quartile).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            RELEASE {RELEASE_LABEL}
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: '#92400e', border: '1px solid #92400e', background: '#fffbeb' }}>
            MATURE TRACK — PREVIEW
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Mature Journal Rankings</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Journals with at least 60 months of publishing history — evaluated eventually through{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR-M</strong>, the mature-journal track of{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR (POSI Automated Rating)</strong>
          {' '}(citation-weighted: Citation
          Performance, Output &amp; Stability, Governance &amp; Integrity, Infrastructure, Reach,
          Transparency), ranked as <strong style={{ color: 'var(--posi-text)' }}>M-Q1–M-Q4</strong>.
          M-Q ranks independently of Citation Q — see AJR-SPEC.md § 1, § 4.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <WarningCircle className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#92400e' }} />
        <span style={{ color: '#92400e' }}>
          <strong>Methodology status:</strong> AJR-M is not yet implemented (see AJR-SPEC.md § 13, open
          question). Core Collection / curated-benchmark scores below are the interim AJR-E rubric applied
          to mature journals — the same 100-point evidence-based scoring used for early-stage journals — so
          they are directionally useful but not the citation-weighted AJR-M score this page is ultimately
          meant to show. M-Q is assigned to journals in a PSC category (or domain, as fallback) that has
          reached the minimum peer-cohort size — {mQAssignedCount} of {core.length + curatedBenchmark.length}{' '}
          evidence-rated journals currently qualify. The {MATURE_RANKED_BENCHMARK_JOURNALS.length +
          MATURE_UNCLASSIFIED_BENCHMARK_JOURNALS.length} Global Benchmark publisher-catalog rows below have
          no AJR score at all (no evidence crawl was run at this scale) — only a provisional Citation Q
          where a same-category peer cohort exists; see the Citation Q column and{' '}
          <Link href="/citation-reports" className="underline">Citation Rankings</Link>.
        </span>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1" style={{ color: '#1d4ed8' }}>
          <p><strong>Lifecycle window:</strong> 60+ months since first publication</p>
          <p><strong>Core Collection mature journals:</strong> {core.length}</p>
          <p><strong>Global Benchmark mature journals (evidence-rated):</strong> {curatedBenchmark.length}</p>
          <p><strong>Global Benchmark mature journals (Citation Q only):</strong> {MATURE_RANKED_BENCHMARK_JOURNALS.length + MATURE_UNCLASSIFIED_BENCHMARK_JOURNALS.length}</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
        </div>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Mature Track — {journals.length} Journals</h2>
          <a href="https://github.com/WENSHAO521/posi-data/blob/master/AJR-SPEC.md" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Methodology (AJR 1.0) →
          </a>
        </div>
        {journals.length > 0 ? (
          <LifecycleRatingsTable
            journals={journals}
            extraColumns={[
              { header: 'Collection', render: j => ({ value: j.is_external_benchmark ? 'Benchmark' : 'Core' }) },
              {
                header: 'M-Q',
                render: j => j.early_stage_rating?.provisional_quartile
                  ? { value: j.early_stage_rating.provisional_quartile, title: 'Ranked within its PSC peer cohort — RANK-1.0 midrank-percentile, see AJR-SPEC.md § 5' }
                  : { value: 'Not released', title: 'Not assigned — either its PSC category/domain cohort hasn\'t reached the minimum size yet, or no AJR score exists for this record at all' },
              },
              {
                header: 'Citation Q',
                render: j => {
                  const cq = j.citation_rating?.citation_q
                  if (cq?.quartile_label) return { value: cq.quartile_label, title: `Percentile ${cq.percentile}, cohort of ${cq.cohort_size} — provisional, see /citation-reports` }
                  if (j.citation_rating) return { value: 'Unavailable', title: cq?.ranking_method === 'unavailable' ? `Cohort of ${cq.cohort_size ?? 0} is below the minimum of 20` : 'Not PSC-classified at high confidence' }
                  return { value: 'Not released', title: 'PCI not yet wired into this cohort' }
                },
              },
            ]}
          />
        ) : (
          <p className="px-5 py-8 text-xs text-center" style={{ color: 'var(--posi-muted)' }}>
            No mature journals have cleared the evidence bar yet.
          </p>
        )}
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Showing {benchmarkShown.length} of {benchmarkTotal} Global Benchmark rows (best Citation Q first) —
          capped to keep this page a reasonable size. Global Benchmark rows (Collection: Benchmark, no AJR
          Score) are the 2026-08 Elsevier/Frontiers publisher-catalog expansion — bulk-ingested, not
          individually vetted, never an admission candidate. Their Citation Q is provisional (OpenAlex 2yr
          mean citedness, not yet official PCI). Full corpus — see{' '}
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
