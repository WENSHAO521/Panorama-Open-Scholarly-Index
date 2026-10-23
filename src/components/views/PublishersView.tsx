// The publisher list (/publishers/), in every language it is published in.
import type { Metadata } from 'next'
import { getDirectory, getPublishers } from '@/lib/global-journals'
import { PublisherBrowser } from '@/components/PublisherBrowser'
import { PageHeader, fmt } from '@/components/db'
import { dataUrl } from '@/lib/data-base'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill } from '@/i18n/format'

const en = {
  title: 'Publishers',
  description: 'Every publisher with journals indexed in POSI, from Crossref and OpenAlex, with journal counts, open-access share and works.',
  lead: '{n} publishers across {journals} indexed journals,',
  global: ' aggregated from the publisher name registered for each journal at Crossref and OpenAlex.',
  curated: ' aggregated from the publisher name on each curated record (the global journal directory was not available for this build).',
  names: ' Names are shown as registered and are not merged across spellings. Download as ',
  tail: ', or open a publisher for its own page: subjects, countries and every journal it has in POSI.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '出版商',
    description: '在 POSI 中有收录期刊的全部出版商，数据来自 Crossref 与 OpenAlex，列出期刊数、开放获取比例与文献数。',
    lead: '共 {n} 家出版商，涉及 {journals} 种收录期刊，',
    global: '依据各期刊在 Crossref 与 OpenAlex 注册的出版商名称汇总。',
    curated: '依据各编辑审核记录中的出版商名称汇总（本次构建未能获取全球期刊目录）。',
    names: '名称按注册原样显示，不合并不同拼写。可下载 ',
    tail: ' 格式数据，或打开出版商页面查看其学科、国家和地区以及在 POSI 中的全部期刊。',
  },
}

export function publishersMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/publishers/', locale) }
}

export function PublishersView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const all = getPublishers()
  const journals = all.reduce((s, r) => s + r.n, 0)
  const { source } = getDirectory()
  return (
    <div className="wrap">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: localizedHref(locale, '/') }, { label: w.title }]}>
        <p className="max-w-[65ch]">
          {fill(w.lead, { n: fmt(all.length), journals: fmt(journals) })}
          {source === 'global' ? w.global : w.curated}
          {w.names}<a href={dataUrl('meta/publishers.json')} className="link">JSON</a>{w.tail}
        </p>
      </PageHeader>
      <PublisherBrowser top={all.slice(0, 50)} />
    </div>
  )
}
