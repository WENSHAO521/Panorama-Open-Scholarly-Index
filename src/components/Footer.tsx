import Link from 'next/link'

const NAV_COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { href: '/search',           label: 'Search' },
      { href: '/journals',         label: 'Journal Records' },
      { href: '/doi-lookup',       label: 'DOI Lookup' },
      { href: '/cite',             label: 'Citation Generator' },
      { href: '/journals?tab=psg', label: 'POSI Verified Journals' },
    ],
  },
  {
    heading: 'Assessment',
    links: [
      { href: '/pqf',      label: 'PQF Methodology' },
      { href: '/mqs',      label: 'Metadata Quality Score' },
      { href: '/cvi',      label: 'Citation Visibility Index' },
      { href: '/irs',      label: 'Indexing Readiness Score' },
      { href: '/evidence', label: 'Evidence Registry' },
    ],
  },
  {
    heading: 'Data & Resources',
    links: [
      { href: '/data-sources',        label: 'Data Sources' },
      { href: '/api',                 label: 'API Roadmap' },
      { href: '/api#export-formats',  label: 'Export Formats' },
      { href: '/policies',            label: 'Policy Evidence Directory' },
      { href: '/responsible-use',     label: 'Responsible Use Notice' },
    ],
  },
  {
    heading: 'Organization',
    links: [
      { href: '/about',          label: 'About POSI' },
      { href: '/coi',            label: 'Conflict of Interest' },
      { href: '/contact',        label: 'Contact' },
      { href: '/submit-journal', label: 'Submit Journal' },
    ],
  },
]

const OPEN_INFRA = [
  { label: 'Crossref',      href: 'https://crossref.org' },
  { label: 'OpenAlex',      href: 'https://openalex.org' },
  { label: 'DOAJ',          href: 'https://doaj.org' },
  { label: 'ROR',           href: 'https://ror.org' },
  { label: 'ORCID',         href: 'https://orcid.org' },
  { label: 'OpenCitations', href: 'https://opencitations.net' },
]

export function Footer() {
  return (
    <footer style={{ background: 'var(--posi-primary)' }}>

      {/* Gradient top rule */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(196,30,58,0.5) 25%, rgba(196,30,58,0.5) 75%, transparent 100%)',
      }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Masthead ── */}
        <div
          className="py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-5">
            <img
              src="/posi-logo-white.svg"
              alt="POSI - Panorama Open Scholarly Index"
              style={{ height: '40px', width: 'auto', flexShrink: 0 }}
            />
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
            <p
              className="text-[11px] leading-relaxed hidden md:block max-w-[260px]"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Open scholarly metadata platform for journal transparency and citation visibility.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] px-2 py-1 transition-colors hover:border-white/20"
              style={{
                color: 'rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
              }}
            >
              CC BY 4.0
            </a>
            <span
              className="text-[9px] px-2 py-1"
              style={{
                color: 'rgba(255,255,255,0.55)',
                background: 'rgba(196,30,58,0.15)',
                border: '1px solid rgba(196,30,58,0.3)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
              }}
            >
              OPEN ACCESS
            </span>
          </div>
        </div>

        {/* ── Navigation columns ── */}
        <div
          className="py-10 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {NAV_COLUMNS.map(col => (
            <div key={col.heading}>
              <p
                className="text-[9px] font-bold uppercase mb-4"
                style={{
                  color: 'var(--posi-accent)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.2em',
                  opacity: 0.85,
                }}
              >
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[11px] transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-mono)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Open Infrastructure strip ── */}
        <div
          className="py-4 flex flex-wrap items-center gap-x-2 gap-y-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span
            className="text-[9px] uppercase shrink-0 mr-3"
            style={{
              color: 'rgba(255,255,255,0.18)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.18em',
            }}
          >
            Open Infrastructure
          </span>
          {OPEN_INFRA.map(src => (
            <a
              key={src.label}
              href={src.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] px-2 py-0.5 transition-all hover:text-white"
              style={{
                color: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {src.label}
            </a>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p
            className="text-[10px]"
            style={{ color: 'rgba(255,255,255,0.16)', fontFamily: 'var(--font-mono)' }}
          >
            &copy; {new Date().getFullYear()} Panorama Scholarly Group Ltd. Curated metadata freely available for reuse.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/coi"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}
            >
              Conflict of Interest Disclosure
            </Link>
            <a
              href="https://panorama-sg.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.16)', fontFamily: 'var(--font-mono)' }}
            >
              panorama-sg.com
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
