// The journal directory (/journals/), in every language it is published in.
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getDirectory, getDirectoryCategories } from '@/lib/global-journals'
import { JournalSearch } from '@/components/JournalSearch'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { SubjectGrid } from '@/components/SubjectGrid'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  title: 'Journals',
  description: 'Every journal indexed in the Panorama Open Scholarly Index, organised by subject category, with open access and DOAJ status and the Core Collection marked.',
  lead: '{n} indexed journals, organised by subject category. Search by title, publisher or ISSN, or open a category to browse, filter and download its journals.',
  stats: { indexed: 'Indexed journals', core: 'Core Collection', oa: 'Open access', subjects: 'Subject categories' },
  bySubject: 'Browse by subject',
  unclassifiedTitle: '{n} journals are not yet classified.',
  unclassifiedBody: 'They are indexed and searchable like every other journal, but have no subject profile yet, usually because they are registered with Crossref and not yet described by OpenAlex. Search above, or browse them alphabetically.',
  az: 'Browse A–Z',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '期刊',
    description: 'Panorama Open Scholarly Index 收录的全部期刊，按学科类别组织，标注开放获取与 DOAJ 收录状态及核心合集期刊。',
    lead: '共收录 {n} 种期刊，按学科类别组织。可按题名、出版商或 ISSN 检索，也可打开某一类别浏览、筛选和下载其期刊。',
    stats: { indexed: '收录期刊', core: '核心合集', oa: '开放获取', subjects: '学科类别' },
    bySubject: '按学科浏览',
    unclassifiedTitle: '{n} 种期刊尚未分类。',
    unclassifiedBody: '这些期刊与其他期刊一样已被收录且可检索，但暂无学科信息，通常是因为它们仅在 Crossref 注册、尚未被 OpenAlex 描述。可在上方检索，或按字母顺序浏览。',
    az: '按字母浏览',
  },
}

export function journalsMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/journals/', locale) }
}

export function JournalsView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const { records } = getDirectory()
  const cats = getDirectoryCategories()
  const classified = cats.filter(c => c.code !== 'unclassified' && c.code !== 'multidisciplinary' && c.count > 0)
  const unclassified = cats.find(c => c.code === 'unclassified')
  const core = records.filter(r => r.core).length
  const oa = records.filter(r => r.oa).length

  return (
    <div className="wrap pb-10">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.title }]}>
        <p className="max-w-[68ch]">{fill(w.lead, { n: fmt(records.length) })}</p>
      </PageHeader>

      <Suspense fallback={null}>
        <JournalSearch />
      </Suspense>

      <dl className="mt-10 stat-strip grid-cols-2 lg:grid-cols-4">
        {[
          [w.stats.indexed, fmt(records.length), null],
          [w.stats.core, fmt(core), '/core-collection/'],
          [w.stats.oa, fmt(oa), '/journals/open-access/'],
          [w.stats.subjects, fmt(classified.length), '/subjects/'],
        ].map(([label, value, to]) => {
          const body = <><dt>{label}</dt><dd className="mt-1 figure text-[24px]">{value}</dd></>
          return to
            ? <Link key={label} href={href(to)} className="block">{body}</Link>
            : <div key={label}>{body}</div>
        })}
      </dl>

      <section aria-labelledby="by-subject" className="mt-14">
        <SectionTitle id="by-subject">{w.bySubject}</SectionTitle>
        <SubjectGrid cats={cats} locale={locale} />
        {unclassified && unclassified.count > 0 && (
          <div className="panel mt-6 p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <p className="flex-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>{fill(w.unclassifiedTitle, { n: fmt(unclassified.count) })}</span>{locale === 'en' ? ' ' : ''}
              {w.unclassifiedBody}
            </p>
            <Link href={href('/journals/subject/unclassified/')} className="btn shrink-0">{w.az}</Link>
          </div>
        )}
      </section>
    </div>
  )
}
