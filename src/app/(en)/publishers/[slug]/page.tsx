import { notFound } from 'next/navigation'
import { findPublisher, getPublishers } from '@/lib/global-journals'
import { PublisherView } from '@/components/PublisherView'

// The largest publishers (STATIC_PUBLISHER_PAGES) get a static page. The
// long tail is served by the in-browser viewer at /publisher/ to stay
// inside Cloudflare Pages' 20,000-file limit.
export const dynamicParams = false

const EMBEDDED_JOURNALS = 100

export function generateStaticParams() {
  return getPublishers().filter(p => p.page).map(p => ({ slug: p.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const p = findPublisher(slug)
  if (!p) return { title: 'Publisher not found' }
  return {
    title: p.name,
    description: `${p.name} in POSI: ${p.n} indexed journals, ${Math.round((p.oa / p.n) * 100)}% open access, with subjects, countries and every journal.`,
    alternates: { canonical: `/publishers/${slug}/` },
  }
}

export default async function PublisherPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const p = findPublisher(slug)
  if (!p || !p.page) notFound()
  return (
    <div className="wrap">
      {/* The first journals are rendered at build time; PublisherView loads the rest from the shard. */}
      <PublisherView p={{ ...p, journals: p.journals.slice(0, EMBEDDED_JOURNALS) }} />
    </div>
  )
}
