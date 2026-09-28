import Link from 'next/link'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { getDirectoryCategories } from '@/lib/global-journals'
import { getCategories } from '@/lib/rankings'
import { PageHeader, fmt } from '@/components/db'

export const metadata = {
  title: 'Subject categories',
  description: 'The POSI Subject Classification (PSC): six domains and 42 categories, with the number of indexed and ranked journals in each.',
  alternates: { canonical: '/subjects/' },
}

const CATS = psc.categories as { code: string; name: string; level: number; parent: string | null }[]

export default function SubjectsPage() {
  const dir = new Map(getDirectoryCategories().map(c => [c.code, c]))
  const ranked = new Map(getCategories().map(c => [c.code, c.ranked]))
  const domains = CATS.filter(c => c.level === 1)
  const multi = dir.get('multidisciplinary')
  const unclassified = dir.get('unclassified')

  return (
    <div className="wrap pb-12">
      <PageHeader title="Subject categories" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Journals', href: '/journals/' }, { label: 'Subject categories' }]}>
        <p className="max-w-[68ch]">
          The POSI Subject Classification (PSC) {psc.version} groups journals into {domains.length} domains and{' '}
          {CATS.filter(c => c.level === 2).length} categories, following the OECD Fields of Research and Development.
          Journals are ranked within these categories. How journals are assigned is described in the{' '}
          <Link href="/methodology/#subjects" className="link">methodology</Link>.
        </p>
      </PageHeader>

      <div className="space-y-8">
        {domains.map(d => (
          <section key={d.code} aria-labelledby={`d-${d.code}`}>
            <h2 id={`d-${d.code}`} className="text-[17px] font-semibold tracking-tight mb-3">
              <span className="font-mono text-[13px] mr-2" style={{ color: 'var(--muted)' }}>{d.code}</span>{d.name}
            </h2>
            <div className="panel overflow-x-auto">
              <table className="dtable">
                <thead>
                  <tr><th className="w-[72px]">Code</th><th>Category</th><th className="text-right">Indexed journals</th><th className="text-right">Ranked</th><th className="text-right">Core</th><th /></tr>
                </thead>
                <tbody>
                  {CATS.filter(c => c.parent === d.code).map(c => {
                    const n = dir.get(c.code)
                    const r = ranked.get(c.code) ?? 0
                    return (
                      <tr key={c.code}>
                        <td className="font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}>{c.code}</td>
                        <td>
                          {n?.count
                            ? <Link href={`/journals/subject/${c.code}/`} className="hover:underline" style={{ color: 'var(--teal)' }}>{c.name}</Link>
                            : c.name}
                        </td>
                        <td className="text-right font-mono tnum text-[13px]">{fmt(n?.count ?? 0)}</td>
                        <td className="text-right font-mono tnum text-[13px]">{fmt(r)}</td>
                        <td className="text-right font-mono tnum text-[13px]">{fmt(n?.core ?? 0)}</td>
                        <td className="text-right whitespace-nowrap">
                          {r > 0 && <Link href={`/rankings/${c.code}/`} className="link text-[13px]">Rankings</Link>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section aria-labelledby="other">
          <h2 id="other" className="text-[17px] font-semibold tracking-tight mb-3">Other groups</h2>
          <ul className="panel divide-y divide-[var(--line-soft)] text-[14px]">
            {multi && (
              <li className="p-4" style={{ borderColor: 'var(--line-soft)' }}>
                <Link href="/journals/subject/multidisciplinary/" className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>Multidisciplinary</Link>
                <span className="ml-2 font-mono tnum text-[13px]" style={{ color: 'var(--muted)' }}>{fmt(multi.count)}</span>
                <p className="mt-1 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>General journals whose output spans several domains. Ranked across all journals, not by category.</p>
              </li>
            )}
            {unclassified && (
              <li className="p-4" style={{ borderColor: 'var(--line-soft)' }}>
                <Link href="/journals/subject/unclassified/" className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>Not yet classified</Link>
                <span className="ml-2 font-mono tnum text-[13px]" style={{ color: 'var(--muted)' }}>{fmt(unclassified.count)}</span>
                <p className="mt-1 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>Journals without subject data, usually registered with Crossref only.</p>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
