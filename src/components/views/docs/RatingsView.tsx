// /ratings/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { AjrCommon } from '@/components/AjrPage'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'AJR: Journal Development Ratings',
  description: 'AJR rates a Core Collection journal’s lifecycle and publishing development: AJR-E for journals 12–59 months old, AJR-M from 60 months. Output is an AJR Score (0–100) and an AJR Rating from A+ to D, not a quartile. Published for Core Collection journals only.',
  alternates: { canonical: '/ratings/' },
}

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="AJR: Journal Development Ratings" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'AJR' }]}>
        <p className="max-w-[68ch]">
          How strong is a journal&rsquo;s lifecycle and publishing-development profile? AJR answers with an AJR Score and
          an AJR Rating. Models: <Link href="/ratings/early-stage/" className="link">AJR-E</Link> and{' '}
          <Link href="/ratings/mature/" className="link">AJR-M</Link>. AJR is published for Core Collection journals only.
        </p>
      </PageHeader>
      <div className="doc"><AjrCommon /></div>
    </div>
  )
}

export function ratingsMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/ratings/', locale) }
}

export function RatingsView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: 'AJR：期刊发展评级',
  description: 'AJR 对核心合集期刊的生命周期与出版发展进行评级：创刊 12–59 个月的期刊适用 AJR-E，60 个月起适用 AJR-M。结果为 AJR 得分（0–100）与 A+ 至 D 的 AJR 评级，并非分区。仅对核心合集期刊发布。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="AJR：期刊发展评级" crumbs={[{ label: 'POSI', href: L('/') }, { label: '评价方法', href: L('/methodology/') }, { label: 'AJR' }]}>
        <p className="max-w-[68ch]">
          期刊的生命周期与出版发展状况如何？AJR 以 AJR 得分与 AJR 评级作答。模型：<Link href={L('/ratings/early-stage/')} className="link">AJR-E</Link> 与{' '}
          <Link href={L('/ratings/mature/')} className="link">AJR-M</Link>。AJR 仅对核心合集期刊发布。
        </p>
      </PageHeader>
      <div className="doc"><AjrCommon locale="zh-Hans" /></div>
    </div>
  )
}
