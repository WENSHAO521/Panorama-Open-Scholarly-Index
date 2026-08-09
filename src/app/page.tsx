import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'
import { getStats } from '@/lib/data'

export const revalidate = 3600

export const metadata = {
  title: 'POSI — Open Scholarly Citation Index',
  description:
    'POSI is an open scholarly citation index: journal coverage, citation analytics (PCI/PCS), and subject rankings, reproducible from public data and open-source methodology.',
}

export default async function HomePage() {
  const stats = {
    ...getStats(),
    last_updated: new Date().toISOString().slice(0, 10),
  }

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--posi-primary)' }}>
        <div className="max-w-[1400px] mx-auto">

          {/* Asymmetric split: POSI pillar (left) | content (right) */}
          <div className="flex flex-col md:flex-row">

            {/* Left: POSI brand pillar */}
            <div
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
            </div>

            {/* Vertical divider — desktop only */}
            <div
              className="hidden md:block w-px shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            {/* Right: Platform content */}
            <div className="px-6 sm:px-8 lg:px-12 pt-2 md:pt-16 pb-12 flex-1 flex flex-col justify-center">
              <h1
                className="font-bold leading-tight mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3.2vw, 2.75rem)',
                  color: 'rgba(255,255,255,0.92)',
                  letterSpacing: '0.01em',
                }}
              >
                Open Scholarly Citation Index
              </h1>
              <p
                className="mb-8 leading-relaxed"
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  maxWidth: '56ch',
                  fontSize: '0.9375rem',
                }}
              >
                Journal coverage, citation analytics, and subject rankings — reproducible from
                open data and open-source methodology, not a proprietary black box.
              </p>
              <SearchBar />
              <nav
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
                aria-label="Quick links"
              >
                {[
                  { href: '/citation-reports', label: 'Journal Rankings' },
                  { href: '/core-collection',  label: 'Core Collection' },
                  { href: '/open-data',        label: 'Open Data' },
                  { href: '/doi-lookup',       label: 'DOI Lookup' },
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
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="stats-grid grid grid-cols-2 sm:grid-cols-4">
              {[
                { value: (stats.psg_journals + stats.indexed_journals).toLocaleString(), label: 'POSI Core Collection',        note: 'Current verified records — migration in progress' },
                { value: (stats.psg_journals + stats.indexed_journals).toLocaleString(), label: 'Metric Eligible Journals',    note: 'Current verified records — migration in progress' },
                { value: '48',                                                            label: 'PSC Subject Categories',      note: 'v1.0 taxonomy — journal classification not yet run' },
                { value: stats.discovered_journals.toLocaleString(),                      label: 'Discovered Journal Records',  note: 'Not yet Core Collection — see Coverage' },
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
          </div>
        </div>
      </section>

      {/* ── FOUR PRODUCT ENTRY POINTS ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="indicators-grid grid md:grid-cols-4">
            {[
              {
                abbr: '01',
                label: 'Journal Rankings',
                desc: 'PCI (2-year), PCI-5, and PNCI citation-impact metrics for the Core Collection, ranked within subject. An open, reproducible alternative to proprietary impact factors.',
                href: '/citation-reports',
                cta: 'View Rankings →',
              },
              {
                abbr: '02',
                label: 'POSI Core Collection',
                desc: 'Discovered, Indexed, and Metric Eligible are three different things. See exactly which journals have passed editorial selection — and which have not.',
                href: '/core-collection',
                cta: 'Browse Coverage →',
              },
              {
                abbr: '03',
                label: 'PSC Subject Classification',
                desc: 'A versioned, PR-reviewed subject taxonomy — based on the OECD Frascati Manual at the top level — that every ranking is computed within.',
                href: '/subjects',
                cta: 'Browse Subjects →',
              },
              {
                abbr: '04',
                label: 'Open Data',
                desc: 'Every journal record, formula, and dataset behind POSI is public on GitHub — versioned, PR-reviewed, and reproducible from a pinned commit.',
                href: '/open-data',
                cta: 'View Open Data →',
              },
            ].map((f) => (
              <Link
                key={f.abbr}
                href={f.href}
                className="p-7 block transition-colors hover:bg-black/[0.015] group"
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
                  className="text-[11px] font-semibold transition-opacity opacity-80 group-hover:opacity-100"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  {f.cta}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPRODUCIBILITY CTA ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
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
                formulas, the subject taxonomy, and the ranking engine are all public on GitHub —
                pin a commit, re-run the calculation, and you should get the same number POSI published.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'DATA',   label: 'Open journal & metric records' },
                  { code: 'CODE',   label: 'Open calculation engine' },
                  { code: 'AUDIT',  label: 'Published migration audits' },
                  { code: 'VERSION',label: 'Every result pinned to a commit' },
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
              className="shrink-0 px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-body)' }}
            >
              View Open Data
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM COVERAGE ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="coverage-grid grid sm:grid-cols-3 gap-0" style={{ border: '1px solid var(--posi-border)' }}>
            {[
              {
                title: 'Coverage',
                items: [
                  { label: 'PSG (Core Collection)',        value: stats.psg_journals },
                  { label: 'Other Core Collection',        value: stats.indexed_journals },
                  { label: 'Discovered (not yet reviewed)', value: stats.discovered_journals },
                ],
              },
              {
                title: 'External Metadata',
                items: [
                  { label: 'DOI Metadata Records', value: stats.total_doi_records },
                  { label: 'Crossref Verified',     value: stats.crossref_verified },
                  { label: 'OpenAlex Matched',      value: stats.openalex_matched },
                ],
              },
              {
                title: 'Open Access & Citations',
                items: [
                  { label: 'DOAJ-listed Records',         value: stats.doaj_listed },
                  { label: 'Citation Visibility Signals', value: stats.open_citation_records },
                  { label: 'Avg. MQS',                    value: `${stats.avg_metadata_quality}/100` },
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
        </div>
      </section>

      {/* ── DATA SOURCES STRIP ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
        </div>
      </section>

      {/* ── RESPONSIBLE USE NOTICE ── */}
      <section style={{ background: 'var(--posi-bg)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      </section>

    </div>
  )
}
