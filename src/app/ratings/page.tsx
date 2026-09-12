import Link from 'next/link'
import { Callout } from '@/components/Callout'
import { getCoreCollection } from '@/lib/data'
import { DATA_SNAPSHOT_LABEL, METHODOLOGY_VERSION, DATA_CUTOFF } from '@/lib/release'
import { hasRealEarlyStageScore, EARLY_STAGE_WINDOW_LABEL, MATURE_WINDOW_LABEL } from '@/lib/early-stage'
import { getGlobalBenchmarkTotal } from '@/lib/site-metrics'

export const metadata = {
  title: `POSI Journal Lifecycle Ratings — ${DATA_SNAPSHOT_LABEL}`,
  description: 'Evidence-based, rules-driven, and reproducible journal evaluation, split by lifecycle stage: Early-Stage (AJR-E / E-Q), Mature (AJR-M / M-Q), and Citation (PCI / Citation Q). 100% automated — no manual score, percentile, or quartile adjustment.',
}

function TrackCard({
  eyebrow, title, window, methodology, quartile, desc, href, cta, accent,
}: {
  eyebrow: string; title: string; window: string; methodology: string; quartile: string
  desc: string; href: string; cta: string; accent: string
}) {
  return (
    <Link href={href} className="p-6 block transition-colors hover:bg-black/[0.015] group" style={{ border: '1px solid var(--posi-border)' }}>
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
        {eyebrow}
      </span>
      <h2 className="text-lg font-bold mt-2 mb-3 leading-tight" style={{ color: 'var(--posi-text)' }}>{title}</h2>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[window, methodology, quartile].map(t => (
          <span key={t} className="text-[9px] font-mono px-1.5 py-0.5" style={{ color: 'var(--posi-muted)', border: '1px solid var(--posi-border)' }}>{t}</span>
        ))}
      </div>
      <p className="text-xs leading-relaxed mb-4 text-justify" style={{ color: 'var(--posi-muted)' }}>{desc}</p>
      <span className="text-[11px] font-semibold transition-opacity opacity-80 group-hover:opacity-100" style={{ color: accent }}>
        {cta}
      </span>
    </Link>
  )
}

export default function RatingsPage() {
  const coreCollection = getCoreCollection()
  // "Journals currently evaluated" — a real score exists (v1.1: rating_status
  // 'official' or 'provisional'; legacy: eligibility 'early_stage', the only
  // legacy state that ever carried one). Deliberately NOT window-membership
  // (v1.1 lifecycle_stage === 'early_stage', currently 10) — a journal that's
  // in the window but rating_status 'not_rateable' has no score to describe
  // as "scored on editorial governance, research integrity, ..." below.
  const earlyStageCount = coreCollection.filter(j => hasRealEarlyStageScore(j.early_stage_rating)).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Ratings &amp; Rankings</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ color: 'var(--posi-accent)', border: '1px solid var(--posi-accent)' }}>
            {DATA_SNAPSHOT_LABEL}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--posi-muted)' }}>
            {METHODOLOGY_VERSION}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>POSI Journal Lifecycle Ratings</h1>
        <p className="text-sm leading-relaxed mt-2 max-w-2xl text-justify" style={{ color: 'var(--posi-muted)' }}>
          <strong style={{ color: 'var(--posi-text)' }}>AJR (POSI Automated Rating)</strong> is the
          umbrella name for the two lifecycle-specific scores below — AJR-E for early-stage journals,
          AJR-M for mature journals. A journal&apos;s lifecycle stage decides which track evaluates it —
          new journals are ranked against other new journals, established journals against other
          established journals, and citation impact is reported independently of both. See{' '}
          <a href="https://github.com/WENSHAO521/posi-data/blob/master/AJR-SPEC.md" target="_blank" rel="noopener noreferrer" className="underline">AJR-SPEC.md →</a>
        </p>
      </div>

      <div className="tracks-grid grid md:grid-cols-3 gap-0" style={{ border: '1px solid var(--posi-border)', borderRight: 'none' }}>
        <div style={{ borderRight: '1px solid var(--posi-border)' }}>
          <TrackCard
            eyebrow="Track 01"
            title="Early-Stage"
            window={EARLY_STAGE_WINDOW_LABEL}
            methodology="AJR-E"
            quartile="E-Q1–E-Q4"
            desc={`${earlyStageCount} journals currently evaluated. Scored on editorial governance, research integrity, infrastructure, publishing stability, output signals, reach, and transparency.`}
            href="/ratings/early-stage"
            cta="View Early-Stage Rankings →"
            accent="var(--posi-accent)"
          />
        </div>
        <div style={{ borderRight: '1px solid var(--posi-border)' }}>
          <TrackCard
            eyebrow="Track 02"
            title="Mature"
            window={MATURE_WINDOW_LABEL}
            methodology="AJR-M"
            quartile="M-Q1–M-Q4"
            desc="AJR-M 1.0 methodology is implemented but has not yet been run against real evidence/citation data — no AJR-M score or M-Q has been published. Ranked separately from Citation Q."
            href="/ratings/mature"
            cta="View Mature Rankings →"
            accent="#B45309"
          />
        </div>
        <div>
          <TrackCard
            eyebrow="Track 03"
            title="Citation"
            window="Metric Eligible"
            methodology="PCI / PCI-5"
            quartile="Citation Q1–Q4"
            desc="Independent of lifecycle stage or AJR score — ranks purely on citation performance within a PSC (POSI Subject Classification) category once a real citation window exists."
            href="/citation-reports"
            cta="View Citation Rankings →"
            accent="#1F7A4D"
          />
        </div>
      </div>

      <Callout variant="info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <p><strong>Data snapshot:</strong> {DATA_CUTOFF} (no POSI-R-* release has been produced yet — see POSI-R-1.0-SPEC.md)</p>
          <p><strong>Methodology:</strong> {METHODOLOGY_VERSION}</p>
          <p><strong>Data cutoff:</strong> {DATA_CUTOFF}</p>
          <p><strong>Coverage:</strong> {coreCollection.length} Core Collection + {getGlobalBenchmarkTotal()} Global Benchmark journals</p>
          <p><strong>Manual score adjustment:</strong> Not permitted</p>
          <p><strong>External indexing weight:</strong> 0 (DOAJ/Scopus/WoS/PubMed listing has no effect)</p>
          <p><strong>Quartiles:</strong> Assigned only once a minimum same-category PSC peer group exists</p>
        </div>
      </Callout>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/pcs" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Citation Score (PCS) →</Link>
        <Link href="/verify" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Verify a Record →</Link>
        <Link href="/coverage/global-benchmark" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Global Benchmark Collection →</Link>
        <Link href="/core-collection" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Core Collection →</Link>
        <Link href="/subjects" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PSC Subjects →</Link>
        <Link href="/open-data" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Open Data →</Link>
      </div>
    </div>
  )
}
