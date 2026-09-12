import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'
import { Reveal, FadeIn } from '@/components/Reveal'
import { MetricCard } from '@/components/MetricCard'
import { FeatureCard } from '@/components/FeatureCard'
import { LifecycleStage } from '@/components/LifecycleStage'
import { DisclosurePanel } from '@/components/DisclosurePanel'
import { getStats, getCoreCollection } from '@/lib/data'
import { getLatestAnnouncements } from '@/lib/announcements'
import { DATA_CUTOFF, METHODOLOGY_VERSION, RELEASE_LABEL, IS_OFFICIAL_RELEASE } from '@/lib/release'
import {
  getGlobalBenchmarkTotal,
  getPscCategoryCount,
  getCoreCollectionLifecycleCounts,
  getLifecycleRatedCount,
} from '@/lib/site-metrics'

export const revalidate = 3600

export const metadata = {
  title: 'POSI — Open Journal Evaluation by Lifecycle',
  description:
    'POSI is an open journal indexing, lifecycle-based automated rating, subject ranking, and citation analytics infrastructure, reproducible from public data and open-source methodology.',
}

export default async function HomePage() {
  const stats = {
    ...getStats(),
    last_updated: new Date().toISOString().slice(0, 10),
  }
  // The single definition of "Core Collection" (data.ts) — excludes any
  // journal currently flagged 'candidate' pending re-review. Using this,
  // not a raw psg+indexed sum, is what keeps this number matching every
  // other page (About, Ratings, Core Collection) that already reads
  // getCoreCollection() directly.
  const coreCollectionCount = getCoreCollection().length
  const globalBenchmarkTotal = getGlobalBenchmarkTotal()
  const pscCategoryCount = await getPscCategoryCount()
  const lifecycle = getCoreCollectionLifecycleCounts()
  const lifecycleRatedCount = getLifecycleRatedCount()
  const announcements = getLatestAnnouncements(3)

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--posi-primary)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row">

            {/* Left: POSI brand pillar */}
            <FadeIn
              y={12}
              className="px-6 sm:px-8 pt-8 pb-5 md:pt-16 md:pb-16 shrink-0 md:w-[280px] lg:w-[320px] xl:w-[360px]"
            >
              <div aria-hidden="true" className="select-none">
                <div
                  className="font-bold leading-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(4.5rem, 12vw, 7.5rem)',
                    color: 'var(--posi-accent)',
                    letterSpacing: '-0.02em',
                    fontWeight: 800,
                  }}
                >
                  POSI
                </div>
                <div className="mt-5 space-y-2">
                  <div style={{ height: '1px', width: '100%', background: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ height: '1px', width: '62%',  background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ height: '1px', width: '30%',  background: 'rgba(255,255,255,0.03)' }} />
                </div>
                <p
                  className="mt-5 text-[9px] uppercase"
                  style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.24em' }}
                >
                  Open Scholarly Infrastructure
                </p>
              </div>
            </FadeIn>

            <div className="hidden md:block w-px shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* Right: Platform content */}
            <FadeIn delay={0.1} y={12} className="px-6 sm:px-8 lg:px-12 pt-2 md:pt-16 pb-12 flex-1 min-w-0 flex flex-col justify-center">
              <p
                className="text-[10px] uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
              >
                Panorama Open Scholarly Index
              </p>
              <h1
                className="font-bold leading-tight mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.75rem, 3.6vw, 3rem)',
                  color: 'rgba(255,255,255,0.94)',
                  letterSpacing: '0.01em',
                }}
              >
                Open scholarly indexing and reproducible journal evaluation
              </h1>
              <p
                className="mb-7 leading-relaxed text-justify"
                style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '58ch', fontSize: '0.9375rem' }}
              >
                Explore journal coverage, lifecycle ratings, citation indicators, subject
                rankings, and the public evidence behind every result.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-7">
                <Link
                  href="/core-collection"
                  className="tactile px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-body)' }}
                >
                  Explore Journals
                </Link>
                <Link
                  href="/ratings"
                  className="tactile px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}
                >
                  View Rankings
                </Link>
              </div>

              <SearchBar />
              <nav className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Quick links">
                {[
                  { href: '/ratings/early-stage', label: 'Early-Stage Rankings' },
                  { href: '/ratings/mature',      label: 'Mature Rankings' },
                  { href: '/citation-reports',    label: 'Citation Rankings' },
                  { href: '/core-collection',     label: 'Core Collection' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs uppercase tracking-[0.1em] transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}
                  >
                    {link.label} /
                  </Link>
                ))}
              </nav>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CURRENT POSI COVERAGE ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em] mb-6"
            style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Current POSI Coverage
          </p>
          <div className="metric-grid grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'var(--posi-border)' }}>
            <MetricCard
              value={coreCollectionCount.toLocaleString()}
              label="Core Collection"
              scope="Editorially admitted and reviewed journals"
              href="/core-collection"
            />
            <MetricCard
              value={globalBenchmarkTotal.toLocaleString()}
              label="Global Benchmark"
              scope="External comparison corpus"
              href="/coverage/global-benchmark"
            />
            <MetricCard
              value={stats.discovered_journals.toLocaleString()}
              label="Discovered Records"
              scope="Metadata records awaiting POSI review"
              href="/journals?tab=discovered"
            />
            <MetricCard
              value={pscCategoryCount.toLocaleString()}
              label="PSC Categories"
              scope="Subject classification categories"
              href="/subjects"
            />
          </div>
          <p className="text-xs leading-relaxed mt-6 max-w-3xl text-justify" style={{ color: 'var(--posi-muted)' }}>
            <strong style={{ color: 'var(--posi-text)' }}>Discovered ≠ indexed.</strong> Discovered
            records are metadata records identified through external scholarly infrastructure. They
            are not part of the POSI Core Collection unless they pass POSI editorial selection.{' '}
            <Link href="/coverage/policy" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>
              Learn how POSI coverage works →
            </Link>
          </p>
        </Reveal>
      </section>

      {/* ── DATA STATUS ── */}
      <section style={{ background: 'var(--posi-primary)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-8 gap-y-3">
            {[
              { label: 'Data Snapshot', value: DATA_CUTOFF },
              { label: 'Methodology', value: METHODOLOGY_VERSION },
              { label: 'Latest Release', value: IS_OFFICIAL_RELEASE ? RELEASE_LABEL : 'No formal POSI-R release yet' },
              { label: 'Data Coverage', value: 'Expanding' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[9px] uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}>
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                  {item.value}
                </p>
              </div>
            ))}
            <p className="sm:ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)' }}>
              Site updated {stats.last_updated}
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── HOW POSI WORKS ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2
            className="font-bold mb-2 leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--posi-text)' }}
          >
            How POSI works
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-2xl text-justify" style={{ color: 'var(--posi-muted)' }}>
            Selection, lifecycle evaluation, and citation analytics are three independent steps —
            not one combined score.
          </p>
          <div className="feature-grid grid md:grid-cols-3 gap-px" style={{ background: 'var(--posi-border)' }}>
            <FeatureCard
              badge="01 · PQF"
              title="Editorial Selection"
              desc="Determines whether a journal has sufficient public evidence, metadata quality, governance transparency, and technical discoverability for Core Collection admission."
              href="/pqf"
              cta="Eligibility — not citation impact →"
            />
            <FeatureCard
              badge="02 · AJR"
              title="Lifecycle Rating"
              desc="Evaluates journals using lifecycle-specific frameworks so that new journals are not directly compared with long-established journals."
              href="/ratings"
              cta="AJR-E · AJR-M →"
            />
            <FeatureCard
              badge="03 · PCI / PCS"
              title="Citation Analytics"
              desc="Reports citation performance independently from editorial selection and lifecycle evaluation."
              href="/pci"
              cta="Citation indicators — not accreditation →"
            />
          </div>
        </Reveal>
      </section>

      {/* ── LIFECYCLE EVALUATION ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
              Lifecycle Evaluation — Core Collection
            </p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>
              {lifecycleRatedCount} AJR-E Rated
            </p>
          </div>
          <div className="lifecycle-strip flex flex-col md:flex-row items-stretch" style={{ border: '1px solid var(--posi-border)' }}>
            <LifecycleStage
              stage="Observation"
              window={`0–11 months · ${lifecycle.observation} journals`}
              status="No quartile"
              accent="#6B7280"
              showConnector
            />
            <LifecycleStage
              stage="Early Stage"
              window={`12–59 months · ${lifecycle.earlyStage} journals`}
              methodology="AJR-E"
              status="E-Q1–E-Q4 when eligible"
              accent="var(--posi-accent)"
              showConnector
            />
            <LifecycleStage
              stage="Mature"
              window={`60+ months · ${lifecycle.mature} journals`}
              methodology="AJR-M"
              status="Current status: Pending production data"
              accent="#B45309"
              showConnector={false}
            />
          </div>
          <p className="text-xs leading-relaxed mt-4 max-w-2xl text-justify" style={{ color: 'var(--posi-muted)' }}>
            {lifecycleRatedCount} Core Collection journals carry a published AJR-E lifecycle rating
            today. AJR-M methodology is implemented but has not yet been run against production
            evidence and citation data — no journal currently holds a published M-Q. Citation
            Quartiles are reported independently through PCI once metric eligibility requirements
            are met, regardless of lifecycle track.
          </p>
        </Reveal>
      </section>

      {/* ── EXPLORE POSI ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-6" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
            Explore POSI
          </p>
          <div className="feature-grid grid md:grid-cols-4 gap-px" style={{ background: 'var(--posi-border)' }}>
            <FeatureCard
              title="Lifecycle Ratings"
              desc="AJR-E and AJR-M lifecycle evaluation."
              href="/ratings/early-stage"
              cta="View Lifecycle Ratings →"
            />
            <FeatureCard
              title="Citation Rankings"
              desc="Citation performance within PSC subject categories."
              href="/citation-reports"
              cta="View Citation Rankings →"
            />
            <FeatureCard
              title="Core Collection"
              desc="Journals admitted through POSI editorial selection."
              href="/core-collection"
              cta="Browse Core Collection →"
            />
            <FeatureCard
              title="PSC Subjects"
              desc="Explore journals by POSI Subject Classification."
              href="/subjects"
              cta="Browse Subjects →"
            />
          </div>
        </Reveal>
      </section>

      {/* ── OPEN INFRASTRUCTURE ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2
            className="font-bold mb-3 leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--posi-text)' }}
          >
            Every metric is reproducible
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-2xl text-justify" style={{ color: 'var(--posi-muted)' }}>
            POSI does not compute rankings behind closed doors. The journal data, the PCI/PNCI
            formulas, the subject taxonomy, and the ranking engine are fully open and independently
            verifiable — re-run the calculation yourself and you should get the same number POSI
            published.
          </p>
          <div className="feature-grid grid md:grid-cols-3 gap-px mb-8" style={{ background: 'var(--posi-border)' }}>
            <FeatureCard
              title="Open Data"
              desc="Versioned journal records, subject classifications, metric snapshots, and rankings."
              href="/open-data"
              cta="Explore Open Data →"
            />
            <FeatureCard
              title="Open Methodology"
              desc="Published formulas, eligibility rules, evidence requirements, tie handling, and ranking procedures."
              href="https://github.com/WENSHAO521/posi-data/blob/master/AJR-SPEC.md"
              cta="View Methodology →"
            />
            <FeatureCard
              title="Open Engine"
              desc="Open-source calculation code designed to reproduce published POSI results."
              href="https://github.com/WENSHAO521/posi-engine"
              cta="View Source Code →"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6" style={{ borderTop: '1px solid var(--posi-border)' }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] shrink-0" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
              Data Sources
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {['Crossref', 'OpenAlex', 'OpenCitations', 'DOAJ', 'ROR', 'ORCID'].map(src => (
                <span key={src} className="text-xs" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
                  {src}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── GOVERNANCE & CONFLICT DISCLOSURE ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <DisclosurePanel title="Governance & Conflict Disclosure" href="/coi" cta="Read full disclosure →">
            <p>
              POSI is operated by Panorama Scholarly Group, which also publishes journals
              represented in the POSI Core Collection.
            </p>
            <p className="mt-2">
              Evaluation outputs are generated through versioned methodology and calculation code.
              No published numerical result may be manually overridden.
            </p>
          </DisclosurePanel>
        </Reveal>
      </section>

      {/* ── RESPONSIBLE USE ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <DisclosurePanel title="Responsible Use" href="/responsible-use" cta="Responsible Use →">
            <p>
              POSI indicators describe journal-level metadata, transparency, infrastructure,
              lifecycle, and citation signals.
            </p>
            <p className="mt-2">
              They are not accreditation decisions and should not be used as the sole basis for
              researcher hiring, promotion, funding, or institutional evaluation.
            </p>
          </DisclosurePanel>
        </Reveal>
      </section>

      {/* ── LATEST UPDATES ── */}
      {announcements.length > 0 && (
        <section style={{ background: 'var(--posi-surface)' }}>
          <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
                Latest Updates
              </p>
              <Link href="/announcements" className="text-xs hover:underline transition-colors" style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}>
                View All →
              </Link>
            </div>
            <div style={{ border: '1px solid var(--posi-border)' }}>
              {announcements.slice(0, 3).map((a, i) => (
                <Link
                  key={a.slug}
                  href={`/announcements/${a.slug}`}
                  className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 p-4 sm:p-5 transition-colors hover:bg-[#fafafa] group"
                  style={{ borderBottom: i < Math.min(announcements.length, 3) - 1 ? '1px solid var(--posi-border-light)' : 'none' }}
                >
                  <span className="shrink-0 text-[10px] font-mono mt-0.5" style={{ color: 'var(--posi-muted)' }}>
                    {a.date}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold group-hover:underline leading-snug" style={{ color: 'var(--posi-text)' }}>
                      {a.title}
                    </h3>
                    <p className="text-xs leading-relaxed mt-1 text-justify" style={{ color: 'var(--posi-muted)' }}>
                      {a.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

    </div>
  )
}
