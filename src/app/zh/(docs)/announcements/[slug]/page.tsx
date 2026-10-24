import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ANNOUNCEMENTS, getAnnouncementBySlug } from '@/lib/announcements'
import { PageHeader } from '@/components/db'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { formatDate } from '@/i18n/format'

// The News items that carry a Chinese version. The news list stays English, so its links go to the English pages.
export const dynamicParams = false

export async function generateStaticParams() {
  return ANNOUNCEMENTS.filter(a => a.zh).map(a => ({ slug: a.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const zh = getAnnouncementBySlug(slug)?.zh
  return zh ? { title: zh.title, description: zh.summary, alternates: pageAlternates(`/announcements/${slug}/`, 'zh-Hans') } : { title: '未找到该新闻' }
}

export default async function AnnouncementDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const a = getAnnouncementBySlug(slug)
  if (!a?.zh) notFound()
  const date = formatDate('zh-Hans', a.date)

  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title={a.zh.title} crumbs={[{ label: 'POSI', href: localizedHref('zh-Hans', '/') }, { label: '新闻动态', href: '/announcements/' }, { label: date }]}>
        <time dateTime={a.date} className="text-[13px] tnum" style={{ color: 'var(--muted)' }}>{date}</time>
      </PageHeader>
      <div className="doc">
        {a.zh.body.map((p, i) => <p key={i}>{p}</p>)}
        <p className="pt-4"><Link href="/announcements/">全部动态（英文）</Link> · <Link href={`/announcements/${a.slug}/`} lang="en">English version</Link></p>
      </div>
    </div>
  )
}
