import Link from 'next/link'
import { Logo } from './SiteHeader'
import { DATA_CUTOFF } from '@/lib/release'

const COLUMNS = [
  {
    title: 'Database',
    links: [
      { label: 'Publications', href: '/publications/' },
      { label: 'Sources', href: '/journals/' },
      { label: 'Publishers', href: '/publishers/' },
      { label: 'PSC subjects', href: '/subjects/' },
      { label: 'Verify a record', href: '/verify/' },
      { label: 'Citation generator', href: '/cite/' },
    ],
  },
  {
    title: 'Open data',
    links: [
      { label: 'Datasets & downloads', href: '/datasets/' },
      { label: 'Record schema', href: '/docs/schema/' },
      { label: 'Provenance model', href: '/docs/provenance/' },
      { label: 'Data sources', href: '/data-sources/' },
      { label: 'Changelog', href: '/announcements/' },
    ],
  },
  {
    title: 'Methodology',
    links: [
      { label: 'Editorial selection (PQF)', href: '/pqf/' },
      { label: 'Lifecycle ratings (AJR)', href: '/ratings/' },
      { label: 'Citation indicators', href: '/pci/' },
      { label: 'Coverage policy', href: '/coverage/policy/' },
      { label: 'Responsible use', href: '/responsible-use/' },
    ],
  },
  {
    title: 'Repositories',
    links: [
      { label: 'posi-data', href: 'https://github.com/WENSHAO521/posi-data', external: true },
      { label: 'posi-engine', href: 'https://github.com/WENSHAO521/posi-engine', external: true },
      { label: 'posi-data-delivery', href: 'https://github.com/WENSHAO521/posi-data-delivery', external: true },
      { label: 'This site', href: 'https://github.com/WENSHAO521/Panorama-Open-Scholarly-Index', external: true },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-20" style={{ background: 'var(--band)', color: 'var(--band-ink)' }}>
      <div className="wrap py-12 grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="space-y-4 max-w-sm">
          <Logo inverted />
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--band-muted)' }}>
            An open, file-backed index of scholarly journals. Records, scores and classifications are
            computed offline from open registries and published as static files. No server, no account.
          </p>
          <p className="text-[12px] font-mono" style={{ color: 'var(--band-muted)' }}>
            Data cutoff {DATA_CUTOFF}
          </p>
        </div>
        {COLUMNS.map(col => (
          <div key={col.title}>
            <h2 className="text-[12px] font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--band-muted)' }}>{col.title}</h2>
            <ul className="space-y-2 text-[13.5px]" style={{ color: 'var(--band-ink)' }}>
              {col.links.map(l => (
                <li key={l.label}>
                  {'external' in l && l.external
                    ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:underline">{l.label}</a>
                    : <Link href={l.href} className="hover:underline">{l.label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--band-line)' }}>
        <div className="wrap py-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-[12px]" style={{ color: 'var(--band-muted)' }}>
          <p>
            POSI-curated data{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:underline">CC BY 4.0</a>
            {', '}source code MIT. Third-party metadata keeps its original license.
          </p>
          <p>
            Not affiliated with Web of Science, Scopus or DOAJ. POSI indicators are not Journal Impact Factors.{' '}
            <Link href="/coi/" className="underline hover:underline">Conflict-of-interest disclosure</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
