import Link from 'next/link'
import { getSortedAnnouncements } from '@/lib/announcements'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'News',
  description: 'Updates to POSI coverage, methodology and services.',
  alternates: { canonical: '/announcements/' },
}

function when(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function AnnouncementsPage() {
  const items = getSortedAnnouncements()
  return (
    <div className="pb-12">
      <PageHeader title="News" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'News' }]}>
        <p className="max-w-[68ch]">Updates to POSI coverage, methodology and services.</p>
      </PageHeader>
      <ol className="max-w-[760px] panel divide-y divide-[var(--line-soft)]">
        {items.map(a => (
          <li key={a.slug} style={{ borderColor: 'var(--line-soft)' }}>
            <Link href={`/announcements/${a.slug}/`} className="block p-5 transition-colors hover:bg-[var(--hover)]">
              <time dateTime={a.date} className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{when(a.date)}</time>
              <h2 className="mt-1 text-[16px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>{a.title}</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{a.summary}</p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
