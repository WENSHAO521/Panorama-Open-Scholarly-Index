import Link from 'next/link'
import { Logo } from './SiteHeader'
import { FOOTER_NAV } from '@/lib/site-nav'

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20" style={{ background: 'var(--band)', color: 'var(--band-ink)' }}>
      <div className="wrap py-14 grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-5 text-[13.5px] leading-relaxed" style={{ color: 'var(--band-muted)' }}>
            The Panorama Open Scholarly Index is a citation index, journal ranking and open access journal directory,
            published by Panorama Scholarly Group Ltd.
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--band-muted)' }}>
            POSI is open source. Its data, methods and software are published under open licences.
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--band-muted)' }}>
            Panorama Scholarly Group is a{' '}
            <a href="https://www.crossref.org/" target="_blank" rel="noopener noreferrer" className="underline">Crossref</a>{' '}
            member (member ID 53186, DOI prefix 10.63802).
          </p>
        </div>
        {FOOTER_NAV.map(col => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--band-ink)' }}>{col.title}</h2>
            <ul className="space-y-2 text-[13.5px]">
              {col.links.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:underline" style={{ color: 'var(--band-muted)' }}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--band-line)' }}>
        <div className="wrap py-5 grid gap-2 md:grid-cols-[1fr_auto] md:items-center text-[12px]" style={{ color: 'var(--band-muted)' }}>
          <p>
            &copy; {year} Panorama Scholarly Group Ltd. POSI data are licensed under{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>.
            Third-party metadata remain under their original licences.
          </p>
          <p>POSI is independent of Web of Science, Scopus and DOAJ.</p>
        </div>
      </div>
    </footer>
  )
}
