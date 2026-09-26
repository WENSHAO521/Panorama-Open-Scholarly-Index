import Link from 'next/link'
import { getPublishers } from '@/lib/records-data'
import { PublisherBrowser } from '@/components/PublisherBrowser'
import { PageHeader, fmt } from '@/components/db'

export const metadata = {
  title: 'Publishers',
  description: 'Every publisher with journals in POSI, with journal counts per collection, open-access share and registered articles.',
}

export default function PublishersPage() {
  const all = getPublishers()
  const journals = all.reduce((s, r) => s + r.n, 0)
  return (
    <div className="wrap">
      <PageHeader title="Publishers" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Publishers' }]}>
        <p className="max-w-[65ch]">
          {fmt(all.length)} publishers across {fmt(journals)} journal records, aggregated from the registered publisher
          name on each record. Names are shown as registered and are not merged across spellings. Download as{' '}
          <a href="/data/meta/publishers.json" className="link">JSON</a>, or open a publisher to see its journals in{' '}
          <Link href="/journals/" className="link">Sources</Link>.
        </p>
      </PageHeader>
      <PublisherBrowser top={all.slice(0, 50)} />
    </div>
  )
}
