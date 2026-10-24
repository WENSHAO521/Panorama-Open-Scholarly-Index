// /pqf/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { PQF_DISCLAIMER, PQF_STATUS_BANDS, PQF_STATUS_LABEL } from '@/lib/evaluation/rules'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'PQF: Core Collection eligibility',
  description: 'The POSI Quality Framework (PQF) decides Core Collection eligibility: a 0–100 score and a status of Eligible, Review Required, Insufficient Evidence or Not Eligible. PQF is not a ranking.',
  alternates: { canonical: '/pqf/' },
}

const FACTORS = [
  ['JTF', 'Journal transparency', 25],
  ['MQF', 'Metadata quality', 25],
  ['EGF', 'Editorial governance', 20],
  ['TDF', 'Technical discoverability', 15],
  ['CVF', 'Citation visibility', 10],
  ['RIF', 'Research integrity', 5],
] as const

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="PQF: Core Collection eligibility" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'PQF' }]}>
        <p className="max-w-[68ch]">
          The POSI Quality Framework answers one question: can the journal enter, or remain in, the Core Collection?
        </p>
      </PageHeader>
      <div className="doc">
        <p><strong>{PQF_DISCLAIMER}</strong></p>
        <h2 id="score">Score</h2>
        <p>Six factors, 100 points in all. Each criterion is met or not met, on published evidence.</p>
        <div className="panel overflow-x-auto max-w-[480px]">
          <table className="dtable">
            <thead><tr><th>Factor</th><th className="text-right">Points</th></tr></thead>
            <tbody>{FACTORS.map(([c, n, pts]) => <tr key={c}><td><span className="font-mono text-[12.5px] mr-2">{c}</span>{n}</td><td className="text-right font-mono">{pts}</td></tr>)}</tbody>
          </table>
        </div>
        <h2 id="status">Status</h2>
        <div className="panel overflow-x-auto max-w-[480px]">
          <table className="dtable">
            <thead><tr><th>PQF score</th><th>Status</th></tr></thead>
            <tbody>
              {PQF_STATUS_BANDS.map(([s, min], i) => (
                <tr key={s}><td className="font-mono text-[13px]">{i === 0 ? `≥ ${min}` : min === 0 ? `< ${PQF_STATUS_BANDS[i - 1][1]}` : `${min}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`}</td><td>{PQF_STATUS_LABEL[s]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 id="use">Use</h2>
        <ul>
          <li>PQF is never used to rank journals, to assign Citation Quartiles or POSI Zones, or to claim academic influence.</li>
          <li>It may be used as a filter, for example PQF ≥ 70, never as a default sort order.</li>
          <li>The letter grades kept in older PQF records are not published.</li>
        </ul>
        <p>
          Admission, review and appeals: <Link href="/editorial-policy/#certification">editorial policy</Link>. How PQF
          fits with AJR and the Citation Ranking: <Link href="/methodology/#architecture">methodology</Link>.
        </p>
      </div>
    </div>
  )
}

export function pqfMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/pqf/', locale) }
}

export function PqfView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: 'PQF：核心合集准入资格',
  description: 'POSI 质量框架（PQF）决定核心合集准入资格：0–100 分的得分，以及“符合条件”“需复核”“证据不足”或“不符合条件”四种状态。PQF 不是排名。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const FACTOR_ZH: Record<string, string> = {
  JTF: '期刊透明度', MQF: '元数据质量', EGF: '编辑治理', TDF: '技术可发现性', CVF: '引文可见度', RIF: '科研诚信',
}
const STATUS_ZH: Record<string, string> = { eligible: '符合条件', review_required: '需复核', insufficient_evidence: '证据不足', not_eligible: '不符合条件' }

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="PQF：核心合集准入资格" crumbs={[{ label: 'POSI', href: L('/') }, { label: '评价方法', href: L('/methodology/') }, { label: 'PQF' }]}>
        <p className="max-w-[68ch]">
          POSI 质量框架（POSI Quality Framework）只回答一个问题：期刊能否进入或继续保留在核心合集中？
        </p>
      </PageHeader>
      <div className="doc">
        <p><strong>PQF 是资格与质量框架评估，并非引文排名指标，不决定引文分区或 POSI Zone。</strong></p>
        <h2 id="score">得分</h2>
        <p>共六个因子，总计 100 分。每项标准依据公开证据判定为满足或不满足。</p>
        <div className="panel overflow-x-auto max-w-[480px]">
          <table className="dtable">
            <thead><tr><th>因子</th><th className="text-right">分值</th></tr></thead>
            <tbody>{FACTORS.map(([c, , pts]) => <tr key={c}><td><span className="font-mono text-[12.5px] mr-2">{c}</span>{FACTOR_ZH[c]}</td><td className="text-right font-mono">{pts}</td></tr>)}</tbody>
          </table>
        </div>
        <h2 id="status">状态</h2>
        <div className="panel overflow-x-auto max-w-[480px]">
          <table className="dtable">
            <thead><tr><th>PQF 得分</th><th>状态</th></tr></thead>
            <tbody>
              {PQF_STATUS_BANDS.map(([s, min], i) => (
                <tr key={s}><td className="font-mono text-[13px]">{i === 0 ? `≥ ${min}` : min === 0 ? `< ${PQF_STATUS_BANDS[i - 1][1]}` : `${min}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`}</td><td>{STATUS_ZH[s]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 id="use">用途</h2>
        <ul>
          <li>PQF 从不用于期刊排名、划定引文分区或 POSI Zone，也不用于宣称学术影响力。</li>
          <li>PQF 可用作筛选条件（例如 PQF ≥ 70），但从不作为默认排序。</li>
          <li>旧版 PQF 记录中保留的字母等级不予发布。</li>
        </ul>
        <p>
          准入、复核与申诉：见<Link href={L('/editorial-policy/#certification')}>编辑政策</Link>。PQF 与 AJR 及引文排名的关系：见<Link href={L('/methodology/#architecture')}>评价方法</Link>。
        </p>
      </div>
    </div>
  )
}
