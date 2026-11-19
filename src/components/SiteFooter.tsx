import { Logo } from './SiteHeader'
import { LocalizedLink } from './LocalizedLink'
import { footerNav } from '@/lib/site-nav'
import { getMessages } from '@/i18n'
import type { Locale } from '@/i18n/config'

export function SiteFooter({ locale }: { locale: Locale }) {
  const m = getMessages(locale)
  const columns = footerNav(m.nav)
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16" style={{ background: 'var(--surface-2)', color: 'var(--ink)', borderTop: '1px solid var(--line)' }}>
      <div className="wrap py-12 grid gap-8 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {m.footer.blurb}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {m.footer.openSource}
          </p>
        </div>
        {columns.map(col => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-[13px] font-medium mb-3" style={{ color: 'var(--ink)' }}>{col.title}</h2>
            <ul className="space-y-2 text-[13px]">
              {col.links.map(l => (
                <li key={l.href}>
                  <LocalizedLink href={l.href} className="transition-colors hover:text-[var(--ink)]" style={{ color: 'var(--muted)' }}>{l.label}</LocalizedLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap py-5 grid gap-2 md:grid-cols-[1fr_auto] md:items-center text-[12px]" style={{ color: 'var(--muted)' }}>
          <p>
            &copy; {year} {m.footer.copyrightLead}{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">{m.footer.licenceName}</a>{m.footer.copyrightTail}
          </p>
          <p>{m.footer.independence}</p>
        </div>
      </div>
    </footer>
  )
}
