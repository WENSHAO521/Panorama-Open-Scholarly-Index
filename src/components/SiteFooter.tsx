import Link from 'next/link'
import { Logo } from './SiteHeader'
import { FOOTER_NAV } from '@/lib/site-nav'
import { T } from './I18n'

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16" style={{ background: 'var(--band)', color: 'var(--band-ink)' }}>
      <div className="wrap py-10 grid gap-8 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--band-muted)' }}>
            <T>The Panorama Open Scholarly Index is a citation index, journal ranking and open access journal directory, published by Panorama Scholarly Group Ltd.</T>
          </p>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--band-muted)' }}>
            <T>POSI is open source. Its data, methods and software are published under open licences.</T>
          </p>
        </div>
        {FOOTER_NAV.map(col => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-[12.5px] font-semibold mb-3" style={{ color: 'var(--band-ink)' }}><T>{col.title}</T></h2>
            <ul className="space-y-1.5 text-[13px]">
              {col.links.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:underline" style={{ color: 'var(--band-muted)' }}><T>{l.label}</T></Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--band-line)' }}>
        <div className="wrap py-5 grid gap-2 md:grid-cols-[1fr_auto] md:items-center text-[12px]" style={{ color: 'var(--band-muted)' }}>
          <p>
            &copy; {year} Panorama Scholarly Group Ltd. <T>POSI data are licensed under</T>{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>
            <T>. Third-party metadata remain under their original licences.</T>
          </p>
          <p><T>POSI is independent of Web of Science, Scopus and DOAJ.</T></p>
        </div>
      </div>
    </footer>
  )
}
