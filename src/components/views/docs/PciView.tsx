// /pci/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { PCS_DISCLAIMER, RANKING_BASIS } from '@/lib/evaluation/rules'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Citation indicators: PCI, PNCI and PCS',
  description: 'POSI Citation Analytics: PCI (source citation impact, Core Collection journals only), PNCI (normalized by field, year and document type; the metric of the official Citation Rankings) and PCS (a supplementary Crossref indicator).',
  alternates: { canonical: '/pci/' },
}

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Citation indicators: PCI, PNCI and PCS" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'Citation indicators' }]}>
        <p className="max-w-[68ch]">
          PCI is one component of POSI Citation Analytics. PNCI is the normalized metric used for official subject-level
          Citation Rankings. PCS provides an independent supplementary citation perspective.
        </p>
      </PageHeader>
      <div className="doc">
        <h2 id="pci">PCI — POSI Citation Impact</h2>
        <p>
          Citations to a journal&rsquo;s citable items from a two-year publication window, per item, from OpenAlex
          (<code>PCI-1.0</code>; a five-year variant, PCI-5, is computed alongside). PCI is the source citation performance
          indicator. It is not normalized by field, so it is not compared across fields, and it does not decide a rank.
        </p>
        <p>
          PCI is a Core Collection indicator: it is reported for Core Collection journals only. Indexed journals have no
          PCI; their citation performance is shown by PNCI and PCS.
        </p>
        <h2 id="pnci">PNCI — POSI Normalized Citation Indicator</h2>
        <p className="formula">PNCI = (1 / n) × Σ C<sub>i</sub> / E(field<sub>i</sub>, year<sub>i</sub>, type<sub>i</sub>)</p>
        <p>
          Each eligible item&rsquo;s citations are divided by the mean citations of all items of the same PSC field,
          publication year and document type, and the ratios are averaged over the journal&rsquo;s items. 1.00 is the
          average of the comparison group. Because every item is compared with items like it, a large journal does not
          rank higher for its size, and older items do not outweigh recent ones (<code>PNCI-1.0</code>).
        </p>
        <p><strong>{RANKING_BASIS}</strong> See the <Link href="/methodology/#ranking">ranking method</Link>.</p>
        <h2 id="pcs">PCS — POSI Citation Score</h2>
        <p>
          The mean Crossref citations of a journal&rsquo;s citable items from the four complete years before the metric year
          (<code>PCS-1.0</code>): a view of citation performance independent of OpenAlex.
        </p>
        <p><strong>{PCS_DISCLAIMER}</strong></p>
        <h2 id="reading">Reading the three together</h2>
        <ul>
          <li>The three indicators are shown side by side and never averaged or used to correct one another.</li>
          <li>Total citations are shown as a description of a journal and never decide a rank.</li>
          <li>Citation indicators measure citation performance, not every dimension of scholarly quality.</li>
        </ul>
      </div>
    </div>
  )
}

export function pciMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/pci/', locale) }
}

export function PciView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '引文指标：PCI、PNCI 与 PCS',
  description: 'POSI 引文分析：PCI（来源引文影响力，仅适用于核心合集期刊）、PNCI（按领域、年份与文献类型标准化，是官方引文排名所用指标）以及 PCS（基于 Crossref 的补充指标）。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="引文指标：PCI、PNCI 与 PCS" crumbs={[{ label: 'POSI', href: L('/') }, { label: '评价方法', href: L('/methodology/') }, { label: '引文指标' }]}>
        <p className="max-w-[68ch]">
          PCI 是 POSI 引文分析的组成部分之一。PNCI 是官方学科引文排名所用的标准化指标。PCS 提供独立的补充性引文视角。
        </p>
      </PageHeader>
      <div className="doc">
        <h2 id="pci">PCI：POSI 引文影响力（POSI Citation Impact）</h2>
        <p>
          期刊在两年出版窗口内可引文献的篇均被引次数，数据来自 OpenAlex（<code>PCI-1.0</code>；同时计算五年版本 PCI-5）。PCI 是来源引文表现指标，未按领域标准化，因此不作跨领域比较，也不决定排名。
        </p>
        <p>
          PCI 是核心合集指标，仅对核心合集期刊报告。收录期刊没有 PCI，其引文表现由 PNCI 与 PCS 体现。
        </p>
        <h2 id="pnci">PNCI：POSI 标准化引文指标（POSI Normalized Citation Indicator）</h2>
        <p className="formula">PNCI = (1 / n) × Σ C<sub>i</sub> / E(field<sub>i</sub>, year<sub>i</sub>, type<sub>i</sub>)</p>
        <p>
          每篇合格文献的被引次数除以同一 PSC 领域、同一出版年份、同一文献类型全部文献的平均被引次数，再对期刊所有文献的比值取平均。1.00 即对照组的平均水平。由于每篇文献都与同类文献比较，大型期刊不会因规模而排名靠前，较早的文献也不会压过近期文献（<code>PNCI-1.0</code>）。
        </p>
        <p><strong>引文分区与 POSI Zone 依据期刊在合格 PSC 类别内的 PNCI 百分位划定。</strong>详见<Link href={L('/methodology/#ranking')}>排名方法</Link>。</p>
        <h2 id="pcs">PCS：POSI 引文得分（POSI Citation Score）</h2>
        <p>
          期刊在指标年份之前四个完整年度内可引文献的 Crossref 平均被引次数（<code>PCS-1.0</code>），提供独立于 OpenAlex 的引文表现视角。
        </p>
        <p><strong>PCS 是补充性引文指标，不决定 POSI 官方引文排名、引文百分位、引文分区或 POSI Zone。</strong></p>
        <h2 id="reading">三项指标的解读</h2>
        <ul>
          <li>三项指标并列展示，从不取平均，也不相互校正。</li>
          <li>总被引次数仅用于描述期刊，从不决定排名。</li>
          <li>引文指标衡量的是引文表现，并不涵盖学术质量的所有维度。</li>
        </ul>
      </div>
    </div>
  )
}
