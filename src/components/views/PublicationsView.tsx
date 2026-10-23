// Publication search (/publications/), in every language it is published in.
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PublicationSearch } from '@/components/PublicationSearch'
import { PageHeader } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const WORDS: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Publications',
    description: 'Search scholarly publications by date, access and type, with links to journal records, rankings and certificates of indexing.',
  },
  'zh-Hans': {
    title: '文献',
    description: '按出版时间、获取方式和文献类型检索学术文献，并链接至期刊记录、排名与收录证书。',
  },
}

export function publicationsMetadata(locale: Locale): Metadata {
  return { ...WORDS[locale], alternates: pageAlternates('/publications/', locale) }
}

export function PublicationsView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  return (
    <div className="wrap">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: localizedHref(locale, '/') }, { label: w.title }]} />
      <Suspense fallback={null}>
        <PublicationSearch />
      </Suspense>
    </div>
  )
}
