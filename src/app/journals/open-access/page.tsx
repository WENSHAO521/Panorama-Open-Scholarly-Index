import Link from 'next/link'
import { getDirectory, getDirectoryCategories } from '@/lib/global-journals'
import { PageHeader, fmt } from '@/components/db'
import { SubjectGrid } from '@/components/SubjectGrid'

export const metadata = {
  title: 'Open access journal directory',
  description: 'Open access journals indexed in POSI, by subject category, with DOAJ listing marked.',
}

export default function OpenAccessDirectoryPage() {
  const { records } = getDirectory()
  const oa = records.filter(r => r.oa)
  const doaj = oa.filter(r => r.dj).length
  return (
    <div className="wrap pb-10">
      <PageHeader title="Open access journal directory" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Journals', href: '/journals/' }, { label: 'Open access' }]}>
        <p className="max-w-[68ch]">
          {fmt(oa.length)} open access journals, {fmt(doaj)} of them listed in DOAJ. Open a category to browse its open
          access journals; each journal page shows licensing and publication charges where recorded.
        </p>
      </PageHeader>
      <SubjectGrid cats={getDirectoryCategories()} count={c => c.oa} query="?oa=1" />
      <p className="mt-8 text-[13.5px]" style={{ color: 'var(--muted)' }}>
        Open access status comes from OpenAlex and DOAJ. <Link href="/journals/" className="link">All journals</Link>
      </p>
    </div>
  )
}
