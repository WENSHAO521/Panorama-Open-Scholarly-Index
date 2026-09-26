import { Suspense } from 'react'
import { PublicationSearch } from '@/components/PublicationSearch'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Publications',
  description: 'Search scholarly publications with filters for date, access and type. Queries OpenAlex directly from your browser; journals indexed in POSI are linked to their records.',
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
