// The journals of one subject category (/journals/subject/<code>/), in every language it is published in.
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDirectoryCategories, categoryFiles, categoryLabel } from '@/lib/global-journals'
import { CategoryJournals } from '@/components/CategoryJournals'
import { PageHeader, fmt } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill, subjectName } from '@/i18n/format'

const en = {
  metaTitle: '{name} journals',
  metaDescription: 'Every journal indexed in POSI in {name}.',
  journals: 'Journals',
  multi: 'Multidisciplinary',
  unclassified: 'Not yet classified',
  rankings: 'Rankings in this category',
  count: '{n} indexed journals',
  core: ', {n} in the Core Collection',
  end: '.',
  unclassifiedNote: ' These journals have no subject profile yet, usually because they are registered with Crossref but not described by OpenAlex.',
  multiNote: ' General journals whose output spans several fields, such as Science, Nature and The Lancet. They are not ranked within a single subject category.',
  domain: ' {domain}.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    metaTitle: '{name}期刊',
    metaDescription: 'POSI 收录的全部{name}期刊。',
    journals: '期刊',
    multi: '多学科',
    unclassified: '尚未分类',
    rankings: '本类别排名',
    count: '收录期刊 {n} 种',
    core: '，其中 {n} 种入选核心合集',
    end: '。',
    unclassifiedNote: '这些期刊尚无学科信息，通常是因为它们已在 Crossref 注册，但尚未被 OpenAlex 描述。',
    multiNote: '刊载内容横跨多个领域的综合性期刊，例如 Science、Nature 和 The Lancet。此类期刊不在单一学科类别内排名。',
    domain: '所属学科大类：{domain}。',
  },
}

/** The categories with journals, one page each. */
export function subjectJournalsParams() {
  return getDirectoryCategories().filter(c => c.count > 0).map(c => ({ code: c.code }))
}

function nameOf(locale: Locale, code: string): string {
  return subjectName(locale, code, categoryLabel(code))
}

export function subjectJournalsMetadata(code: string, locale: Locale): Metadata {
  const w = WORDS[locale]
  const name = nameOf(locale, code)
  return {
    title: fill(w.metaTitle, { name }),
    description: fill(w.metaDescription, { name }),
    alternates: pageAlternates(`/journals/subject/${code}/`, locale),
  }
}

export function SubjectJournalsView({ code, locale }: { code: string; locale: Locale }) {
  const cat = getDirectoryCategories().find(c => c.code === code)
  if (!cat || !cat.count) notFound()
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const special = code === 'unclassified' || code === 'multidisciplinary'

  return (
    <div className="wrap pb-10">
      <PageHeader
        locale={locale}
        title={nameOf(locale, code)}
        crumbs={[{ label: 'POSI', href: href('/') }, { label: w.journals, href: href('/journals/') }, { label: code === 'unclassified' ? w.unclassified : code === 'multidisciplinary' ? w.multi : code }]}
        actions={!special ? <Link href={href(`/rankings/${code}/`)} className="btn">{w.rankings}</Link> : undefined}
      >
        <p className="max-w-[68ch]">
          {fill(w.count, { n: fmt(cat.count) })}{cat.core ? fill(w.core, { n: fmt(cat.core) }) : ''}{w.end}
          {code === 'unclassified'
            ? w.unclassifiedNote
            : code === 'multidisciplinary'
              ? w.multiNote
              : fill(w.domain, { domain: subjectName(locale, cat.domain, cat.domainName) })}
        </p>
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <CategoryJournals code={code} files={categoryFiles(code)} total={cat.count} />
      </Suspense>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-16 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-3)' }} />
      {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-11 rounded-[var(--radius)] animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
    </div>
  )
}
