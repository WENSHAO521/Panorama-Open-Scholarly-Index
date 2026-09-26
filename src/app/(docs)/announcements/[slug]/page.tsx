import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ANNOUNCEMENTS, getAnnouncementBySlug } from '@/lib/announcements'
import { PageHeader } from '@/components/db'

export const dynamicParams = false

export async function generateStaticParams() {
  return ANNOUNCEMENTS.map(a => ({ slug: a.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const a = getAnnouncementBySlug(slug)
  return a ? { title: a.title, description: a.summary } : { title: 'News item not found' }
}

export default async function AnnouncementDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const a = getAnnouncementBySlug(slug)
  if (!a) notFound()
  const date = new Date(`${a.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

  return (
    <div className="pb-12">
      <PageHeader title={a.title} crumbs={[{ label: 'POSI', href: '/' }, { label: 'News', href: '/announcements/' }, { label: date }]}>
        <time dateTime={a.date} className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>{date}</time>
      </PageHeader>
      <div className="doc">
        {a.body.map((p, i) => <p key={i}>{p}</p>)}
        <p className="pt-4"><Link href="/announcements/">All news</Link></p>
      </div>
    </div>
  )
}
