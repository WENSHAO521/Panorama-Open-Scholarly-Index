// The open access journal directory (/journals/open-access/), in every language it is published in.
import Link from 'next/link'
import type { Metadata } from 'next'
import { getDirectory, getDirectoryCategories } from '@/lib/global-journals'
import { PageHeader, fmt } from '@/components/db'
import { SubjectGrid } from '@/components/SubjectGrid'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  title: 'Open access journal directory',
  description: 'Open access journals indexed in POSI, by subject category, with DOAJ listing marked.',
  journals: 'Journals',
  crumb: 'Open access',
  lead: '{n} open access journals, {doaj} of them listed in DOAJ. Open a category to browse its open access journals; each journal page shows licensing and publication charges where recorded.',
  source: 'Open access status comes from OpenAlex and DOAJ.',
  all: 'All journals',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '开放获取期刊目录',
    description: 'POSI 收录的开放获取期刊，按学科类别浏览，并标注 DOAJ 收录情况。',
    journals: '期刊',
    crumb: '开放获取',
    lead: '共有开放获取期刊 {n} 种，其中 {doaj} 种被 DOAJ 收录。打开某一类别即可浏览其开放获取期刊；各期刊页面列出已记录的许可协议与出版费用（APC）。',
    source: '开放获取状态来自 OpenAlex 与 DOAJ。',
    all: '全部期刊',
  },
}

export function openAccessMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/journals/open-access/', locale) }
}

export function OpenAccessView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const { records } = getDirectory()
  const oa = records.filter(r => r.oa)
  const doaj = oa.filter(r => r.dj).length
  return (
    <div className="wrap pb-10">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: href('/') }, { label: w.journals, href: href('/journals/') }, { label: w.crumb }]}>
        <p className="max-w-[68ch]">{fill(w.lead, { n: fmt(oa.length), doaj: fmt(doaj) })}</p>
      </PageHeader>
      <SubjectGrid cats={getDirectoryCategories()} count={c => c.oa} query="?oa=1" locale={locale} />
      <p className="mt-8 text-[13.5px]" style={{ color: 'var(--muted)' }}>
        {w.source} <Link href={href('/journals/')} className="link">{w.all}</Link>
      </p>
    </div>
  )
}
