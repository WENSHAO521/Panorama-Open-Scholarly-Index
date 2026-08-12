import Link from 'next/link'
import type { Metadata } from 'next'
import { getLatestAnnouncements } from '@/lib/announcements'

export const metadata: Metadata = {
  title: 'Announcements | POSI',
  description: 'Official announcements and platform updates from POSI — Panorama Open Scholarly Index.',
}

const MAX_VISIBLE = 5

export default function AnnouncementsPage() {
  const announcements = getLatestAnnouncements(MAX_VISIBLE)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Announcements</span>
      </nav>

      <div className="border-l-4 pl-5" style={{ borderColor: 'var(--posi-accent)' }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--posi-text)' }}>Announcements</h1>
        <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--posi-muted)' }}>
          Official updates, releases, and notices from POSI.
        </p>
      </div>

      <div className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        {announcements.map((a, i) => (
          <Link
            key={a.slug}
            href={`/announcements/${a.slug}`}
            className="block p-5 transition-colors hover:bg-[#fafafa]"
            style={{ borderBottom: i < announcements.length - 1 ? '1px solid var(--posi-border-light)' : 'none' }}
          >
            <p className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>{a.date}</p>
            <h2 className="text-sm font-semibold mt-1" style={{ color: 'var(--posi-text)' }}>{a.title}</h2>
            <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--posi-muted)' }}>{a.summary}</p>
          </Link>
        ))}
      </div>

    </div>
  )
}
