// /ratings/early-stage/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { AjrCommon } from '@/components/AjrPage'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'AJR-E: Early-stage Journal Rating',
  description: 'AJR-E rates journals 12–59 months after first publication on seven evidence-based dimensions, as an AJR Score (0–100) and an AJR Rating (A+ to D).',
  alternates: { canonical: '/ratings/early-stage/' },
}

const DIMENSIONS = [
  ['Editorial governance and peer review', 15], ['Research integrity and publication ethics', 15], ['Metadata and digital publishing infrastructure', 15],
  ['Publishing stability and operational performance', 15], ['Scholarly output quality signals', 20], ['Scholarly reach and concentration', 10], ['Openness, data and transparency', 10],
] as const

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="AJR-E: Early-stage Journal Rating" crumbs={[{ label: 'POSI', href: '/' }, { label: 'AJR', href: '/ratings/' }, { label: 'AJR-E' }]}>
        <p className="max-w-[68ch]">For journals 12–59 months after their first publication (<code>AJR-E-1.2</code> from the October 2026 rerate; <code>AJR-E-1.1</code> before).</p>
      </PageHeader>
      <div className="doc">
        <h2 id="dimensions">Dimensions</h2>
        <div className="panel overflow-x-auto max-w-[560px]">
          <table className="dtable">
            <thead><tr><th>Dimension</th><th className="text-right">Points</th></tr></thead>
            <tbody>{DIMENSIONS.map(([d, p]) => <tr key={d}><td>{d}</td><td className="text-right font-mono">{p}</td></tr>)}</tbody>
          </table>
        </div>
        <p>
          A score is published when the evidence coverage is sufficient: from 80% it is official, from 60% provisional
          (shown and marked). Below that, or with too small an article sample, the journal is not rated and the reason
          is shown. Scores are computed from evidence only; no score is set by hand.
        </p>
        <AjrCommon />
        <p><Link href="/ratings/mature/">AJR-M</Link> applies from 60 months.</p>
      </div>
    </div>
  )
}

export function ajrEarlyStageMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/ratings/early-stage/', locale) }
}

export function AjrEarlyStageView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: 'AJR-E：早期期刊评级',
  description: 'AJR-E 依据七个基于证据的维度，对首次出版 12–59 个月的期刊进行评级，结果为 AJR 得分（0–100）与 AJR 评级（A+ 至 D）。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const DIMENSIONS_ZH = ['编辑治理与同行评议', '科研诚信与出版伦理', '元数据与数字出版基础设施', '出版稳定性与运营表现', '学术产出质量信号', '学术影响范围与集中度', '开放性、数据与透明度']

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="AJR-E：早期期刊评级" crumbs={[{ label: 'POSI', href: L('/') }, { label: 'AJR', href: L('/ratings/') }, { label: 'AJR-E' }]}>
        <p className="max-w-[68ch]">适用于首次出版后 12–59 个月的期刊（自 2026 年 10 月重新评级起为 <code>AJR-E-1.2</code>，此前为 <code>AJR-E-1.1</code>）。</p>
      </PageHeader>
      <div className="doc">
        <h2 id="dimensions">评价维度</h2>
        <div className="panel overflow-x-auto max-w-[560px]">
          <table className="dtable">
            <thead><tr><th>维度</th><th className="text-right">分值</th></tr></thead>
            <tbody>{DIMENSIONS.map(([d, p], i) => <tr key={d}><td>{DIMENSIONS_ZH[i]}</td><td className="text-right font-mono">{p}</td></tr>)}</tbody>
          </table>
        </div>
        <p>
          证据覆盖率足够时才发布得分：达到 80% 为正式得分，达到 60% 为暂定得分（显示并加以标注）。低于此标准，或文章样本过少时，期刊不予评级，并显示原因。得分完全依据证据计算，不存在人工设定的得分。
        </p>
        <AjrCommon locale="zh-Hans" />
        <p>自 60 个月起适用 <Link href={L('/ratings/mature/')}>AJR-M</Link>。</p>
      </div>
    </div>
  )
}
