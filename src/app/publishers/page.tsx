import { getDirectory, getPublishers } from '@/lib/global-journals'
import { PublisherBrowser } from '@/components/PublisherBrowser'
import { PageHeader, fmt } from '@/components/db'

export const metadata = {
  title: 'Publishers',
  description: 'Every publisher with journals indexed in POSI, from Crossref and OpenAlex, with journal counts, open-access share and works.',
  alternates: { canonical: '/publishers/' },
}

export default function PublishersPage() {
  const all = getPublishers()
  const journals = all.reduce((s, r) => s + r.n, 0)
  const { source } = getDirectory()
  return (
    <div className="wrap">
      <PageHeader title="Publishers" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Publishers' }]}>
        <p className="max-w-[65ch]">
          {fmt(all.length)} publishers across {fmt(journals)} indexed journals,
          {source === 'global'
            ? ' aggregated from the publisher name registered for each journal at Crossref and OpenAlex.'
            : ' aggregated from the publisher name on each curated record (the global journal directory was not available for this build).'}
          {' '}Names are shown as registered and are not merged across spellings. Download as{' '}
          <a href="/data/meta/publishers.json" className="link">JSON</a>, or open a publisher for its own page: subjects,
          countries and every journal it has in POSI.
        </p>
      </PageHeader>
      <PublisherBrowser top={all.slice(0, 50)} />
    </div>
  )
}
