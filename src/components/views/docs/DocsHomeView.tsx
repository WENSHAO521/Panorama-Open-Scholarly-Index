// /docs/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { docsNav } from '@/lib/docs-nav'
import { getMessages } from '@/i18n'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'

const EN_META = {
  title: 'Documentation',
  description: 'How POSI works: policies, methodology, data sources, record schema and provenance.',
  alternates: pageAlternates('/docs/'),
}

function En() {
  const sections = docsNav(getMessages('en').docs)
  return (
    <div className="pb-10">
      <PageHeader title="Documentation">
        <p className="max-w-[62ch]">
          Policies, methodology and data documentation for the Panorama Open Scholarly Index.
        </p>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(section => (
          <section key={section.title} className="panel p-5">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}>{section.title}</h2>
            <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>{section.blurb}</p>
            <ul className="mt-3 grid gap-1 text-[14px]">
              {section.links.filter(l => l.href !== '/docs/').map(l => (
                <li key={l.href}><Link href={l.href} className="link">{l.label}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export function docsHomeMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/docs/', locale) }
}

export function DocsHomeView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '文档',
  description: 'POSI 的运作方式：政策、评价方法、数据来源、记录结构与数据溯源。',
}

function Zh() {
  const sections = docsNav(getMessages('zh-Hans').docs)
  return (
    <div className="pb-10">
      <PageHeader locale="zh-Hans" title="文档">
        <p className="max-w-[62ch]">
          Panorama Open Scholarly Index 的政策、评价方法与数据文档。
        </p>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(section => (
          <section key={section.title} className="panel p-5">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}>{section.title}</h2>
            <p className="mt-1 text-[13.5px]" style={{ color: 'var(--muted)' }}>{section.blurb}</p>
            <ul className="mt-3 grid gap-1 text-[14px]">
              {section.links.filter(l => l.href !== '/docs/').map(l => (
                <li key={l.href}><Link href={localizedHref('zh-Hans', l.href)} className="link">{l.label}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
