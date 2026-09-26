import Link from 'next/link'
import { DOCS_NAV } from '@/lib/docs-nav'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Documentation',
  description: 'How POSI works: the record schema, provenance model, collections, ratings, indicators and governance.',
}

const BLURB: Record<string, string> = {
  'Start here': 'What POSI is, what it is not, and what changed recently.',
  'Data model': 'Fields, provenance, sources and how to read the files.',
  Collections: 'How journals enter each collection and how coverage changes.',
  'Ratings & indicators': 'Lifecycle ratings, citation indicators and their methods.',
  'Editorial selection': 'The PQF admission gate and the evidence behind it.',
  Governance: 'Responsible use, conflicts of interest and legal terms.',
}

export default function DocsHome() {
  return (
    <div className="pb-10">
      <PageHeader title="Documentation">
        <p className="max-w-[62ch]">
          Every number on POSI is produced by a published method from open data. These pages describe the methods,
          the data model and the rules for using the results.
        </p>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {DOCS_NAV.map(section => (
          <section key={section.title} className="panel p-5">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}>{section.title}</h2>
            <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>{BLURB[section.title]}</p>
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
