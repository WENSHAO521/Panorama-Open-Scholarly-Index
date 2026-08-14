import { Suspense } from 'react'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { LifecycleRatingsTable } from '@/components/LifecycleRatingsTable'
import { Callout } from '@/components/Callout'
import publisherCatalogMeta from '@/lib/publisher-catalog-meta.json'
import { DATA_SNAPSHOT_LABEL } from '@/lib/release'
import { isInEarlyStageWindow, hasRealEarlyStageScore, isOfficiallyRated, earlyStageQuartile, isBlockedOrNotRateable } from '@/lib/early-stage'

export const metadata = {
  title: 'POSI Early-Stage Journal Rankings — AJR-E',
  description: 'Journals 12–59 months after first regular scholarly publication, evaluated through AJR-E. E-Q1–E-Q4 quartiles are assigned once a same-cohort PSC peer group exists.',
}

export default function EarlyStageRankingsPage() {
  const core = getCoreCollection()
  // "Evaluated" = a real AJR-E score exists (v1.1: rating_status 'official'
  // or 'provisional'; legacy: eligibility 'early_stage'). Distinct from
  // window-membership (isInEarlyStageWindow) now that AJR-E-1.1 splits the
  // two — a journal can be in the 12-59mo window with no score at all
  // (rating_status 'not_rateable'). inWindow / notRateable surfaced
  // separately below so that real gap is visible, not folded into one count.
  const evaluated = core.filter(j => hasRealEarlyStageScore(j.early_stage_rating))
  const inWindow = core.filter(j => isInEarlyStageWindow(j.early_stage_rating))
  const notRateable = inWindow.filter(j => isBlockedOrNotRateable(j.early_stage_rating))
  // Ranking-eligible pool only (v1.1: rating_status 'official' — a
  // 'provisional' score is real and shown but AJR-SPEC.md § 6 excludes it
  // from E-Q ranking), matching earlyStageQuartile()'s own gate.
  const officiallyRated = core.filter(j => isOfficiallyRated(j.early_stage_rating))
  const eQAssignedCount = officiallyRated.filter(j => earlyStageQuartile(j.early_stage_rating)).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/ratings" className="hover:text-gray-700">Ratings &amp; Rankings</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Early-Stage Rankings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
          {DATA_SNAPSHOT_LABEL}
        </span>
        <h1 className="text-2xl font-bold leading-tight mt-2" style={{ color: 'var(--posi-text)' }}>Early-Stage Journal Rankings</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          Journals 12–59 months after their first regular scholarly publication, evaluated through{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR-E</strong>, the early-stage track of{' '}
          <strong style={{ color: 'var(--posi-text)' }}>AJR (POSI Automated Rating)</strong>. E-Q1–E-Q4
          quartiles are assigned once a minimum same-category, same-cohort PSC (POSI Subject
          Classification) peer group exists — see AJR-SPEC.md § 1, § 5.
        </p>
      </div>

      <Callout variant="info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <p><strong>Lifecycle window:</strong> 12–59 months since first publication</p>
          <p><strong>Methodology:</strong> AJR-E (AJR 1.0 Lifecycle Framework)</p>
          <p><strong>Scoring:</strong> 100% rules-driven, from crawled site evidence and sampled Crossref articles</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
          <p><strong>E-Q assigned:</strong> {eQAssignedCount} of {officiallyRated.length} officially rated</p>
          <p><strong>Journals evaluated (real score):</strong> {evaluated.length} of {core.length}</p>
          <p><strong>Currently in Early-Stage window:</strong> {inWindow.length} of {core.length}</p>
          {notRateable.length > 0 && (
            <p><strong>In window, not rateable:</strong> {notRateable.length} — below the minimum evidence bar, see each journal's page for its specific reason</p>
          )}
          <p><strong>Global Benchmark, pending FPD verification:</strong> {publisherCatalogMeta.not_yet_mature}</p>
        </div>
      </Callout>

      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <Suspense fallback={<div className="px-5 py-8 text-xs text-center" style={{ color: 'var(--posi-muted)' }}>Loading…</div>}>
          <LifecycleRatingsTable
            journals={core}
            benchmarkMode="not-yet-mature"
            columns={['collection', 'e-q']}
            title="Early-Stage Track"
            methodologyHref="https://github.com/WENSHAO521/posi-data/blob/master/AJR-SPEC.md"
            methodologyLabel="Methodology (AJR-E)"
          />
        </Suspense>
        <p className="px-5 py-3 text-[10px]" style={{ color: 'var(--posi-muted)', borderTop: '1px solid var(--posi-border-light)' }}>
          Every Core Collection journal is listed here regardless of lifecycle stage or eligibility, so the
          full status distribution stays visible — journals in Observation Stage (0–11 months) or below the
          minimum evidence bar have no score yet, and that is expected. Global Benchmark rows (Collection:
          Benchmark, status "Pending FPD Verification") are the 2026-08 publisher-catalog expansion journals
          with no OpenAlex-visible evidence of publishing activity 5+ years ago — that rules out "mature," but
          is not proof the journal is actually 12–59 months old, so these rows are <strong>not</strong> displayed
          as genuinely evaluated Early-Stage journals: no first-publication-date has been resolved, no AJR-E
          score, no E-Q. Loaded client-side from a separate data file; full corpus — see{' '}
          <Link href="/coverage/global-benchmark" className="underline">Global Benchmark Collection</Link>.
        </p>
      </section>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/ratings/mature" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Mature Journal Rankings →</Link>
        <Link href="/citation-reports" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Citation Rankings →</Link>
        <Link href="/coverage/global-benchmark" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Global Benchmark Collection →</Link>
      </div>
    </div>
  )
}
