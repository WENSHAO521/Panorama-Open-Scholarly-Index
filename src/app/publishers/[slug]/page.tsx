import { notFound } from 'next/navigation'
import { findPublisher, getPublisherDetails } from '@/lib/records-data'
import { STATIC_PUBLISHER_MIN } from '@/lib/publishers'
import { PublisherView } from '@/components/PublisherView'

// Publishers with STATIC_PUBLISHER_MIN or more journals get a static page.
// The long tail is served by the in-browser viewer at /publisher/ to stay
// inside Cloudflare Pages' 20,000-file limit.
export const dynamicParams = false

export function generateStaticParams() {
  return getPublisherDetails().filter(p => p.n >= STATIC_PUBLISHER_MIN).map(p => ({ slug: p.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const p = findPublisher(slug)
  if (!p) return { title: 'Publisher not found' }
  return {
    title: p.name,
    description: `${p.name} in POSI: ${p.n} journals, ${p.core} in the Core Collection, ${Math.round((p.oa / p.n) * 100)}% open access, with subjects, countries and every journal record.`,
  }
}

export default async function PublisherPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const p = findPublisher(slug)
  if (!p || p.n < STATIC_PUBLISHER_MIN) notFound()
  return (
    <div className="wrap">
      <PublisherView p={p} />
    </div>
  )
}
