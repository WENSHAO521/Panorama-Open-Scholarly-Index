import Link from 'next/link'
import { Info, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS } from '@/lib/data'
import { BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import type { Journal } from '@/lib/types'

export const metadata = {
  title: 'POSI Automated Journal Ratings — Pilot 2026',
  description: 'Evidence-based, rules-driven, and reproducible journal evaluation for the POSI Core Collection, validated against a Global Benchmark Collection of established journals. 100% automated — no manual score, percentile, or quartile adjustment.',
}

const ELIGIBILITY_LABEL: Record<string, string> = {
  rated: 'Evaluated',
  rated_mature: 'Evaluated (mature)',
  not_yet_rateable: 'Not Yet Rateable',
  unknown: 'Unknown',
}

const ELIGIBILITY_COLOR: Record<string, string> = {
  rated: '#1F7A4D',
  rated_mature: '#1F7A4D',
  not_yet_rateable: '#B45309',
  unknown: '#6B7280',
}

function RatingsTable({ journals, showPQ }: { journals: Journal[]; showPQ: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
            <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
            <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Publisher</th>
            <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PSC</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Score</th>
            <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Status</th>
            {showPQ && <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>P-Q</th>}
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
                <td className="px-3 py-3" style={{ color: 'var(--posi-muted)' }}>Not yet classified</td>
                <td className="px-3 py-3 text-center font-mono font-semibold" style={{ color: 'var(--posi-text)' }}>
                  {r?.total != null ? `${r.total}/100` : <span style={{ color: 'var(--posi-muted)' }}>—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-mono text-[10px] font-semibold" style={{ color: ELIGIBILITY_COLOR[eligibility] }}>
                    {ELIGIBILITY_LABEL[eligibility]}
                  </span>
                </td>
                {showPQ && (
                  <td
                    className="px-3 py-3 text-center text-[10px]"
                    style={{ color: 'var(--posi-muted)' }}
                    title={eligibility === 'rated_mature' ? 'Not applicable — mature journals are ranked by Citation Q (PCI-based), not P-Q' : 'Not assigned — insufficient peer cohort'}
                  >
                    {eligibility === 'rated_mature' ? 'N/A' : '—'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function RatingsPage() {
  const coreCollection = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
    .sort((a, b) => (b.early_stage_rating?.total ?? -1) - (a.early_stage_rating?.total ?? -1))
  const evaluatedCount = coreCollection.filter(j => j.early_stage_rating?.total != null).length

  const benchmarkSorted = [...BENCHMARK_JOURNALS]
    .sort((a, b) => (b.early_stage_rating?.total ?? -1) - (a.early_stage_rating?.total ?? -1))
  const benchmarkEvaluated = benchmarkSorted.filter(j => j.early_stage_rating?.total != null)
  const benchmarkTop = benchmarkEvaluated.slice(0, 25)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Automated Ratings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
            PILOT 2026
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {coreCollection.length} Core Collection · {BENCHMARK_JOURNALS.length} Global Benchmark
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Automated Journal Ratings (AJR)</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Evidence-based, rules-driven, and reproducible journal evaluation. Published as a <strong style={{ color: 'var(--posi-text)' }}>pilot</strong>,
          not a final release. The same AJR-1.0 score applies to any journal regardless of age — age only
          decides whether a journal's quartile track is the early-stage P-Q system (below) or Citation Q
          (PCI-based, for journals with a real citation window).
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#1d4ed8' }} />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1" style={{ color: '#1d4ed8' }}>
          <p><strong>Coverage:</strong> {coreCollection.length} Core Collection + {BENCHMARK_JOURNALS.length} Global Benchmark journals</p>
          <p><strong>Methodology:</strong> AJR-1.0 Pilot</p>
          <p><strong>Scoring:</strong> 100% rules-driven, from crawled site evidence and sampled Crossref articles</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
          <p><strong>External indexing weight:</strong> 0 (DOAJ/Scopus/WoS/PubMed listing has no effect)</p>
          <p><strong>Quartiles:</strong> Assigned only once a minimum same-category PSC peer group exists</p>
        </div>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Core Collection Ratings</h2>
          <Link href="https://github.com/WENSHAO521/posi-data/blob/master/EARLY-STAGE-RATING-SPEC.md" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
            Methodology (AJR-1.0) →
          </Link>
        </div>
        <RatingsTable journals={coreCollection} showPQ />
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          {evaluatedCount} of {coreCollection.length} scored to date. P-Q (Provisional Quartile) is not assigned
          to any journal yet — insufficient peer cohort. It requires PSC subject classification (not yet run on
          any journal) and a minimum same-category, same-cohort peer group per EARLY-STAGE-RATING-SPEC.md § 7.
          This is expected at this stage, not an error.
        </p>
      </section>

      {/* Global Benchmark Collection */}
      <div className="border-l-4 pl-5 pt-2" style={{ borderColor: '#6B7280' }}>
        <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Global Benchmark Collection</h2>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          {BENCHMARK_JOURNALS.length} internationally established journals, rated by the identical AJR-1.0
          pipeline — used to validate the methodology against journals already broadly agreed to be excellent,
          not to expand POSI's Core Collection. <strong style={{ color: 'var(--posi-text)' }}>Not part of the Core
          Collection, not a candidate for admission, not counted in Indexed/Metric Eligible stats.</strong> Selected
          using only OpenAlex's own open signals (is_core, citation activity, topic-domain balance) — no Web of
          Science or Scopus data anywhere in selection or scoring.
        </p>
      </div>

      <div className="p-4 text-xs leading-relaxed flex items-start gap-2.5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <WarningCircle className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: '#92400e' }} />
        <span style={{ color: '#92400e' }}>
          <strong>Validation finding:</strong> the first benchmark run scored only 5 of 200 journals — AJR's
          evidence crawl initially checked only a journal's homepage, which systematically failed traditional
          publisher platforms (Elsevier, Wiley, ACS, APS, IOP) whose policy content lives on separate subpages,
          even though those journals plainly have rigorous governance. Extending the crawl to check a few
          common policy subpages when the homepage alone leaves a gap raised this to 22 of 200 (e.g. Nature
          now scores 71/100) — a real improvement, not a full fix: many large publisher platforms (Science/AAAS
          among them) still fail, likely due to site structures the current guessed subpaths don't match. This
          is exactly the kind of methodology gap the benchmark exists to surface — published here rather than
          quietly patched, per POSI's own no-hidden-adjustment principle.
        </span>
      </div>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>
            Top {benchmarkTop.length} of {benchmarkEvaluated.length} Evaluated
          </h2>
          <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>
            {benchmarkEvaluated.length} of {BENCHMARK_JOURNALS.length} scored
          </span>
        </div>
        <RatingsTable journals={benchmarkTop} showPQ={false} />
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Showing the top {benchmarkTop.length} by score. Benchmark journals never receive a P-Q — as
          established journals, their eventual quartile track is Citation Q (PCI-based), not the early-stage
          system. Full corpus and per-journal evidence: see{' '}
          <a href="https://github.com/WENSHAO521/Panorama-Open-Scholarly-Index/blob/master/src/lib/benchmark-journals.ts" target="_blank" rel="noopener noreferrer" className="underline">benchmark-journals.ts →</a>
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Analytics (Preview) →</Link>
        <Link href="/open-data" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Open Data →</Link>
      </div>
    </div>
  )
}
