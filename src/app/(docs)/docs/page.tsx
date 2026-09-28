import Link from 'next/link'
import { DOCS_NAV } from '@/lib/docs-nav'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Documentation',
  description: 'How POSI works: policies, methodology, data sources, record schema and provenance.',
  alternates: { canonical: '/docs/' },
}

export default function DocsHome() {
  return (
    <div className="pb-10">
      <PageHeader title="Documentation">
        <p className="max-w-[62ch]">
          Policies, methodology and data documentation for the Panorama Open Scholarly Index.
        </p>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {DOCS_NAV.map(section => (
          <section key={section.title} className="panel p-5">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}>{section.title}</h2>
            <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>{section.blurb}</p>
            <ul className="mt-3 grid gap-1 text-[14px]">
              {section.links.filter(l => l.href !== '/docs/').map(l => (
                <li key={l.href}><Link href={l.href} className="link">{l.label}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
