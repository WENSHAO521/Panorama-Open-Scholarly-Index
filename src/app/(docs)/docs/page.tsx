import { DOCS_NAV } from '@/lib/docs-nav'
import { PageHeader } from '@/components/db'
import { LocaleLink, T } from '@/components/I18n'

export const metadata = {
  title: 'Documentation',
  description: 'How POSI works: policies, methodology, data sources, record schema and provenance.',
  alternates: { canonical: '/docs/' },
}

export default function DocsHome() {
  return (
    <div className="pb-10">
      <PageHeader title={<T>Documentation</T>}>
        <p className="max-w-[62ch]">
          <T>Policies, methodology and data documentation for the Panorama Open Scholarly Index.</T>
        </p>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {DOCS_NAV.map(section => (
          <section key={section.title} className="panel p-5">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}><T>{section.title}</T></h2>
            <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}><T>{section.blurb}</T></p>
            <ul className="mt-3 grid gap-1 text-[14px]">
              {section.links.filter(l => l.href !== '/docs/').map(l => (
                <li key={l.href}><LocaleLink href={l.href} className="link"><T>{l.label}</T></LocaleLink></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
