import { Suspense } from 'react'
import { PublicationSearch } from '@/components/PublicationSearch'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Publications',
  description: 'Search scholarly publications by date, access and type, with links to journal records, rankings and certificates of indexing.',
}

export default function PublicationsPage() {
  return (
    <div className="wrap">
      <PageHeader title="Publications" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Publications' }]} />
      <Suspense fallback={null}>
        <PublicationSearch />
      </Suspense>
    </div>
  )
}
