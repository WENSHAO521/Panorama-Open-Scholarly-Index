import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'
import { Reveal, FadeIn } from '@/components/Reveal'
import { getStats, PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getCoreCollection} from '@/lib/data'
import { BENCHMARK_JOURNALS } from '@/lib/benchmark-journals'
import { getLatestAnnouncements } from '@/lib/announcements'
import { RELEASE_LABEL } from '@/lib/release'

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
  const coreCollection = getCoreCollection()
  const lifecycleRated = coreCollection.filter(j => j.early_stage_rating?.total != null).length
  const observationCount = coreCollection.filter(j => j.early_stage_rating?.eligibility === 'observation').length
  const earlyStageCount = coreCollection.filter(j => j.early_stage_rating?.eligibility === 'early_stage').length
  const matureCount = coreCollection.filter(j => j.early_stage_rating?.eligibility === 'mature').length
    + BENCHMARK_JOURNALS.filter(j => j.early_stage_rating?.eligibility === 'mature').length
  const announcements = getLatestAnnouncements(3)

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--posi-primary)' }}>
        <div className="max-w-[1400px] mx-auto">

          {/* Asymmetric split: POSI pillar (left) | content (right) */}
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

                {/* Structural rule stack — Bauhaus horizontal rhythm */}
                <div className="mt-5 space-y-2">
                  <div style={{ height: '1px', width: '100%', background: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ height: '1px', width: '62%',  background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ height: '1px', width: '30%',  background: 'rgba(255,255,255,0.03)' }} />
                </div>

                <p
                  className="mt-5 text-[9px] uppercase"
                  style={{
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.24em',
                  }}
                >
                  Open Scholarly Infrastructure
                </p>
              </div>
            </FadeIn>

            {/* Vertical divider — desktop only */}
            <div
              className="hidden md:block w-px shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            {/* Right: Platform content */}
            <FadeIn delay={0.1} y={12} className="px-6 sm:px-8 lg:px-12 pt-2 md:pt-16 pb-12 flex-1 flex flex-col justify-center">
              <h1
                className="font-bold leading-tight mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3.2vw, 2.75rem)',
                  color: 'rgba(255,255,255,0.92)',
                  letterSpacing: '0.01em',
                }}
              >
                Open Journal Evaluation by Lifecycle
              </h1>
              <p
                className="mb-8 leading-relaxed"
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  maxWidth: '56ch',
                  fontSize: '0.9375rem',
                }}
              >
                Open journal indexing, lifecycle-based automated ratings, subject rankings, and
                citation analytics — built from versioned evidence and reproducible methodology.
              </p>
              <SearchBar />
              <nav
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
                aria-label="Quick links"
              >
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

          {/* Stats strip */}
          <Reveal style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="stats-grid grid grid-cols-2 sm:grid-cols-4">
              {[
                { value: (stats.psg_journals + stats.indexed_journals).toLocaleString(), label: 'Core Collection',      note: 'Admitted through published editorial selection' },
                { value: BENCHMARK_JOURNALS.length.toLocaleString(),                     label: 'Global Benchmark',     note: 'External validation corpus, not Core Collection' },
                { value: lifecycleRated.toLocaleString(),                                label: 'Lifecycle Rated',      note: 'Core Collection, Early + Mature — see Ratings & Rankings' },
                { value: '48',                                                            label: 'PSC Subject Categories', note: 'v1.0 taxonomy — see PSC Subjects' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="py-7 px-6"
                >
                  <p
                    className="text-3xl md:text-4xl font-bold text-white leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-[9px] uppercase tracking-[0.16em] mt-2.5"
                    style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-[8px] mt-1"
                    style={{ color: 'rgba(255,255,255,0.14)', fontFamily: 'var(--font-mono)' }}
                  >
                    {s.note}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="pb-2 px-6 text-[9px] flex flex-wrap items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono)' }}
            >
              <span>Updated {stats.last_updated}</span>
              <Link
                href="/ratings"
                className="px-1.5 py-0.5 transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.55)' }}
              >
                {RELEASE_LABEL.toUpperCase()} · TRIAL OPERATION
              </Link>
              <span
                className="px-1.5 py-0.5"
                style={{ background: 'rgba(196,30,58,0.15)', border: '1px solid rgba(196,30,58,0.3)', color: 'rgba(255,255,255,0.45)' }}
              >
                Migration to POSI 2.0 identity corpus in progress — see Open Data
              </span>
            </p>
            <p
              className="pb-4 px-6 text-[9px] leading-relaxed max-w-3xl"
              style={{ color: 'rgba(255,255,255,0.12)', fontFamily: 'var(--font-mono)' }}
            >
              POSI Core Collection = journals admitted through POSI's published editorial selection
              criteria (see Methodology). Discovered Journal Records are found via DOAJ/Crossref/OpenAlex
              but not yet reviewed — POSI has a record of them, that is not the same as POSI indexing
              them. Search itself additionally reaches Crossref/OpenAlex's much larger open corpus beyond
              either count; that external search scope is not a POSI-reviewed figure and isn't reported here.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ── */}
      {announcements.length > 0 && (
        <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
          <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Announcements
              </p>
              <Link
                href="/announcements"
                className="text-xs hover:underline transition-colors"
                style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
              >
                View All →
              </Link>
            </div>
            <div style={{ border: '1px solid var(--posi-border)' }}>
              {announcements.map((a, i) => (
                <Link
                  key={a.slug}
                  href={`/announcements/${a.slug}`}
                  className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 p-4 sm:p-5 transition-colors hover:bg-[#fafafa] group"
                  style={{ borderBottom: i < announcements.length - 1 ? '1px solid var(--posi-border-light)' : 'none' }}
                >
                  <span
                    className="shrink-0 text-[10px] font-mono mt-0.5"
                    style={{ color: 'var(--posi-muted)' }}
                  >
                    {a.date}
                  </span>
                  <div>
                    <h2
                      className="text-sm font-semibold group-hover:underline leading-snug"
                      style={{ color: 'var(--posi-text)' }}
                    >
                      {a.title}
                    </h2>
                    <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--posi-muted)' }}>
                      {a.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── FOUR PRODUCT ENTRY POINTS ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto">
          <div className="indicators-grid grid md:grid-cols-4">
            {[
              {
                abbr: '01',
                label: 'Early-Stage Rankings',
                desc: 'Journals 12–59 months after first regular scholarly publication, evaluated through AJR-E and ranked within comparable PSC peer groups.',
                href: '/ratings/early-stage',
                cta: 'Explore E-Q Rankings →',
              },
              {
                abbr: '02',
                label: 'Mature Journal Rankings',
                desc: 'Journals with at least 60 months of publishing history, evaluated through AJR-M using scholarly performance, citation impact, governance, and infrastructure.',
                href: '/ratings/mature',
                cta: 'Explore M-Q Rankings →',
              },
              {
                abbr: '03',
                label: 'Citation Rankings',
                desc: 'Independent citation-impact rankings based on PCI, PCI-5, and PNCI within PSC subject categories.',
                href: '/citation-reports',
                cta: 'Explore Citation Rankings →',
              },
              {
                abbr: '04',
                label: 'Open Methodology & Data',
                desc: 'Every rating, evidence source, methodology version, and ranking release is documented and independently reproducible.',
                href: '/open-data',
                cta: 'Inspect Methodology →',
              },
            ].map((f) => (
              <Link
                key={f.abbr}
                href={f.href}
                className="tactile p-7 h-full flex flex-col transition-all duration-300 hover:bg-[#fafafa] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(17,17,17,0.3)] group"
              >
                {/* DIN-style: mono abbreviation + rule divider */}
                <div className="mb-5">
                  <span
                    className="block font-bold leading-none"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--posi-accent)',
                      fontSize: '1.5rem',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {f.abbr}
                  </span>
                  <div
                    className="mt-3"
                    style={{ height: '1px', width: '2rem', background: 'var(--posi-border)' }}
                  />
                </div>
                <h2
                  className="text-sm font-semibold mb-3 leading-tight"
                  style={{ color: 'var(--posi-text)' }}
                >
                  {f.label}
                </h2>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--posi-muted)' }}>
                  {f.desc}
                </p>
                <span
                  className="mt-auto text-[11px] font-semibold transition-opacity opacity-80 group-hover:opacity-100"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  {f.cta}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── LIFECYCLE STRIP ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em] mb-6"
            style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Why POSI Has Two Rating Tracks
          </p>
          <div className="lifecycle-strip flex flex-col md:flex-row items-stretch gap-0" style={{ border: '1px solid var(--posi-border)' }}>
            {[
              { stage: 'Observation', window: '0–11 months', note: 'No quartile — too early to evaluate', accent: '#6B7280' },
              { stage: 'Early-Stage', window: '12–59 months', note: 'AJR-E · E-Q1–E-Q4', accent: 'var(--posi-accent)' },
              { stage: 'Mature', window: '60+ months', note: 'AJR-M · M-Q1–M-Q4', accent: '#B45309' },
            ].map((s, i) => (
              <div
                key={s.stage}
                className="flex-1 p-6"
                style={{ background: 'var(--posi-surface)', borderLeft: i > 0 ? '1px solid var(--posi-border)' : 'none' }}
              >
                <p className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: s.accent }}>{s.stage}</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--posi-muted)' }}>{s.window}</p>
                <p className="text-[10px] font-mono mt-2" style={{ color: 'var(--posi-text)' }}>{s.note}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed mt-4 max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
            Citation Quartiles are reported independently through PCI once metric eligibility requirements
            are met — regardless of which lifecycle track a journal is in.
          </p>
        </Reveal>
      </section>

      {/* ── REPRODUCIBILITY CTA ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-7"
            style={{ borderLeft: '3px solid var(--posi-accent)' }}
          >
            <div className="max-w-2xl">
              <h2
                className="font-bold mb-3 leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  color: 'var(--posi-text)',
                  letterSpacing: '0.01em',
                }}
              >
                Every metric is reproducible
              </h2>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: 'var(--posi-muted)', maxWidth: '60ch' }}
              >
                POSI does not compute rankings behind closed doors. The journal data, the PCI/PNCI
                formulas, the subject taxonomy, and the ranking engine are fully open and independently
                verifiable — re-run the calculation yourself and you should get the same number POSI published.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'DATA',   label: 'Open journal & metric records' },
                  { code: 'CODE',   label: 'Open calculation engine' },
                  { code: 'AUDIT',  label: 'Published migration audits' },
                  { code: 'VERSION',label: 'Every result independently reproducible' },
                ].map(d => (
                  <div
                    key={d.code}
                    className="flex items-center gap-1.5 px-2.5 py-1.5"
                    style={{ border: '1px solid var(--posi-border)' }}
                  >
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
                    >
                      {d.code}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--posi-muted)' }}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/open-data"
              className="tactile shrink-0 px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-body)' }}
            >
              View Open Data
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── PLATFORM COVERAGE ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="coverage-grid grid sm:grid-cols-3 gap-0" style={{ border: '1px solid var(--posi-border)' }}>
            {[
              {
                title: 'Coverage',
                items: [
                  { label: 'Core Collection',               value: stats.psg_journals + stats.indexed_journals },
                  { label: 'Global Benchmark',               value: BENCHMARK_JOURNALS.length },
                  { label: 'Discovered (not yet reviewed)',  value: stats.discovered_journals },
                ],
              },
              {
                title: 'Lifecycle Evaluation',
                items: [
                  { label: 'Observation (0–11mo)',   value: observationCount },
                  { label: 'Early-Stage (12–59mo)',  value: earlyStageCount },
                  { label: 'Mature (60mo+)',         value: matureCount },
                ],
              },
              {
                title: 'Citation Analytics',
                items: [
                  { label: 'OpenAlex Matched',            value: stats.openalex_matched },
                  { label: 'Citation Visibility Signals', value: stats.open_citation_records },
                  { label: 'DOAJ-listed Records',         value: stats.doaj_listed },
                ],
              },
            ].map((group) => (
              <div
                key={group.title}
                className="p-7"
                style={{ background: 'var(--posi-surface)' }}
              >
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.18em] mb-6"
                  style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {group.title}
                </p>
                <div className="space-y-5">
                  {group.items.map(item => (
                    <div key={item.label} className="flex justify-between items-baseline gap-4">
                      <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
                        {item.label}
                      </span>
                      <span
                        className="text-xl font-bold shrink-0"
                        style={{ color: 'var(--posi-text)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── DATA SOURCES STRIP ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] shrink-0"
              style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Data Sources
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {['Crossref', 'OpenAlex', 'OpenCitations', 'DOAJ', 'ROR', 'ORCID'].map(src => (
                <span
                  key={src}
                  className="text-xs"
                  style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {src}
                </span>
              ))}
            </div>
            <Link
              href="/open-data"
              className="sm:ml-auto shrink-0 text-xs hover:underline transition-colors"
              style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
            >
              Open Data & Provenance →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── RESPONSIBLE USE NOTICE ── */}
      <section style={{ background: 'var(--posi-bg)' }}>
        <Reveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="p-5 pl-6"
            style={{
              background: 'var(--posi-surface)',
              border: '1px solid var(--posi-border)',
              borderLeftWidth: '3px',
              borderLeftColor: 'var(--posi-accent)',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <strong style={{ color: 'var(--posi-text)', fontWeight: 600 }}>
                Responsible Use Notice:{' '}
              </strong>
              POSI is an open scholarly citation index. PQF indicates a journal's transparency,
              metadata quality, and technical discoverability — it supports Core Collection admission,
              it is not a citation-impact score. PCI/PCS indicate citation volume — they are not
              quality certifications. Neither should be used as the sole or primary basis for
              individual researcher evaluation, hiring, promotion, or funding decisions. POSI is not
              affiliated with Web of Science, Scopus, or DOAJ. Some journals in POSI are published by
              Panorama Scholarly Group, which also operates this platform.{' '}
              <Link href="/coi" style={{ color: 'var(--posi-accent)' }}>
                Read our conflict of interest disclosure.
              </Link>
            </p>
          </div>
        </Reveal>
      </section>

    </div>
  )
}
