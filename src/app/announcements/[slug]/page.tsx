import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ANNOUNCEMENTS, getAnnouncementBySlug } from '@/lib/announcements'

export async function generateStaticParams() {
  return ANNOUNCEMENTS.map(a => ({ slug: a.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const announcement = getAnnouncementBySlug(slug)
  if (!announcement) return { title: 'Announcement Not Found | POSI' }
  return {
    title: `${announcement.title} | POSI Announcements`,
    description: announcement.summary,
  }
}

export default async function AnnouncementDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const announcement = getAnnouncementBySlug(slug)
  if (!announcement) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/announcements" className="hover:text-gray-700">Announcements</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>{announcement.title}</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <p
          className="text-[10px] font-mono uppercase tracking-[0.14em] mb-2"
          style={{ color: 'var(--posi-muted)' }}
        >
          {announcement.date}
        </p>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>
          {announcement.title}
        </h1>
      </div>

      <div className="bg-white p-5 space-y-4" style={{ border: '1px solid var(--posi-border)' }}>
        {announcement.body.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-5 text-xs">
        <Link href="/announcements" style={{ color: 'var(--posi-accent)' }} className="hover:underline">
          ← All Announcements
        </Link>
      </div>

    </div>
  )
}
