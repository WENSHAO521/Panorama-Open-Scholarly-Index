import { Suspense } from 'react'
import Link from 'next/link'
import { getDirectory, getDirectoryCategories } from '@/lib/global-journals'
import { JournalSearch } from '@/components/JournalSearch'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { SubjectGrid } from '@/components/SubjectGrid'

export const metadata = {
  title: 'Journals',
  description: 'Every journal indexed in the Panorama Open Scholarly Index, organised by subject category, with open access and DOAJ status and the Core Collection marked.',
}

export default function JournalsPage() {
  const { records } = getDirectory()
  const cats = getDirectoryCategories()
  const classified = cats.filter(c => c.code !== 'unclassified' && c.code !== 'multidisciplinary' && c.count > 0)
  const unclassified = cats.find(c => c.code === 'unclassified')
  const core = records.filter(r => r.core).length
  const oa = records.filter(r => r.oa).length

  return (
    <div className="wrap pb-10">
      <PageHeader title="Journals" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Journals' }]}>
        <p className="max-w-[68ch]">
          {fmt(records.length)} indexed journals, organised by subject category. Search by title, publisher or ISSN,
          or open a category to browse, filter and download its journals.
        </p>
      </PageHeader>

      <Suspense fallback={null}>
        <JournalSearch />
      </Suspense>

      <dl className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-[2px] overflow-hidden" style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
        {[
          ['Indexed journals', fmt(records.length), null],
          ['Core Collection', fmt(core), '/core-collection/'],
          ['Open access', fmt(oa), '/journals/open-access/'],
          ['Subject categories', fmt(classified.length), '/subjects/'],
        ].map(([label, value, href]) => {
          const body = <><dt className="text-[13px]" style={{ color: 'var(--muted)' }}>{label}</dt><dd className="mt-1 font-mono text-[22px] tnum">{value}</dd></>
          return href
            ? <Link key={label} href={href} className="block p-4 hover:bg-[var(--hover)]" style={{ background: 'var(--surface)' }}>{body}</Link>
            : <div key={label} className="p-4" style={{ background: 'var(--surface)' }}>{body}</div>
        })}
      </dl>

      <section aria-labelledby="by-subject" className="mt-14">
        <SectionTitle id="by-subject">Browse by subject</SectionTitle>
        <SubjectGrid cats={cats} />
        {unclassified && unclassified.count > 0 && (
          <p className="mt-6 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            <Link href="/journals/subject/unclassified/" className="link">{fmt(unclassified.count)} journals not yet classified</Link>{' '}
            <span style={{ color: 'var(--muted)' }}>are listed alphabetically.</span>
          </p>
        )}
      </section>
    </div>
  )
}
