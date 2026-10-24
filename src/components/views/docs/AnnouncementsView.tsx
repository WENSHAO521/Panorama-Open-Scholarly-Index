// The News list (/announcements/), in every language it is published in. An item with a version in the page's
// language is listed and linked in that language; the others are listed in English and link to the English page.
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSortedAnnouncements } from '@/lib/announcements'
import { PageHeader } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { formatDate } from '@/i18n/format'

const en = {
  title: 'News', about: 'About',
  description: 'Updates to POSI coverage, methodology and services.',
  english: null as string | null,
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '新闻动态', about: '关于',
    description: 'POSI 收录范围、评价方法与服务的更新。',
    english: '英文',
  },
}

export function announcementsMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/announcements/', locale) }
}

function when(locale: Locale, d: string) {
  return locale === 'en'
    ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : formatDate(locale, d)
}

export function AnnouncementsView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const items = getSortedAnnouncements()
  return (
    <div className="pb-12">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.about, href: href('/about/') }, { label: w.title }]}>
        <p className="max-w-[68ch]">{w.description}</p>
      </PageHeader>
      <ol className="max-w-[760px] panel divide-y divide-[var(--line-soft)]">
        {items.map(a => {
          const text = locale === 'zh-Hans' && a.zh ? a.zh : null
          const lang = locale !== 'en' && !text ? 'en' : undefined
          return (
            <li key={a.slug} style={{ borderColor: 'var(--line-soft)' }}>
              <Link href={href(`/announcements/${a.slug}/`)} className="block p-5 transition-colors hover:bg-[var(--hover)]">
                <span className="flex items-center gap-2">
                  <time dateTime={a.date} className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{when(locale, a.date)}</time>
                  {lang && w.english && <span className="chip text-[11px]">{w.english}</span>}
                </span>
                <h2 lang={lang} className="mt-1 text-[16px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>{text?.title ?? a.title}</h2>
                <p lang={lang} className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{text?.summary ?? a.summary}</p>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
