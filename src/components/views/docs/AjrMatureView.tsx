// /ratings/mature/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { AjrCommon } from '@/components/AjrPage'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'AJR-M: Mature Journal Rating',
  description: 'AJR-M rates journals 60 months or more after first publication, as an AJR Score (0–100) and an AJR Rating (A+ to D). It is never computed with the early-stage rubric.',
  alternates: { canonical: '/ratings/mature/' },
}

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="AJR-M: Mature Journal Rating" crumbs={[{ label: 'POSI', href: '/' }, { label: 'AJR', href: '/ratings/' }, { label: 'AJR-M' }]}>
        <p className="max-w-[68ch]">For journals 60 months or more after their first publication (<code>AJR-M-1.2</code> from the October 2026 rerate).</p>
      </PageHeader>
      <div className="doc">
        <p>
          AJR-M weighs citation performance together with output, governance, infrastructure, reach and transparency.
          A mature journal is never scored with the <Link href="/ratings/early-stage/">AJR-E</Link> rubric. Until AJR-M
          has been run for a journal, its page shows &ldquo;AJR-M: not yet rated&rdquo;; missing evidence narrows what is
          scored and is never counted as zero.
        </p>
        <AjrCommon />
      </div>
    </div>
  )
}

export function ajrMatureMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/ratings/mature/', locale) }
}

export function AjrMatureView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: 'AJR-M：成熟期刊评级',
  description: 'AJR-M 适用于首次出版 60 个月及以上的期刊，结果为 AJR 得分（0–100）与 AJR 评级（A+ 至 D），从不采用早期期刊评分细则计算。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="AJR-M：成熟期刊评级" crumbs={[{ label: 'POSI', href: L('/') }, { label: 'AJR', href: L('/ratings/') }, { label: 'AJR-M' }]}>
        <p className="max-w-[68ch]">适用于首次出版 60 个月及以上的期刊（自 2026 年 10 月重新评级起为 <code>AJR-M-1.2</code>）。</p>
      </PageHeader>
      <div className="doc">
        <p>
          AJR-M 综合考量引文表现以及产出、治理、基础设施、影响范围与透明度。成熟期刊从不按 <Link href={L('/ratings/early-stage/')}>AJR-E</Link> 细则评分。在对某期刊运行 AJR-M 之前，其页面显示“AJR-M：尚未评级”；缺失的证据只会缩小评分范围，从不计为零分。
        </p>
        <AjrCommon locale="zh-Hans" />
      </div>
    </div>
  )
}
