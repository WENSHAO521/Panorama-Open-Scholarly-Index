// /grades/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { PosiGrades } from '@/components/PosiGrades'
import { AJR_RATING_SCALE } from '@/lib/evaluation/rules'
import { ZONE_SHARE } from '@/lib/evaluation/display'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'How to read POSI grades',
  description: 'The POSI grades badge: Core Collection tier, AJR rating, Citation Quartile and POSI Zone, what each means and how it is assigned.',
  alternates: { canonical: '/grades/' },
}

const PARTS: [string, string, string, React.ReactNode][] = [
  ['Tier', 'Core · Indexed', 'Core journals applied for certification and passed PQF editorial evaluation. Every other journal registered with Crossref or OpenAlex is Indexed, including a formerly certified journal a PQF re-review found below the bar.', <Link key="t" href="/editorial-policy/#certification">Editorial policy</Link>],
  ['AJR', AJR_RATING_SCALE.map(([r]) => r).join(' · '), 'An absolute lifecycle rating from published evidence, for Core Collection journals only. Not a quartile: many journals can share a rating.', <Link key="a" href="/ratings/">AJR ratings</Link>],
  ['C-Q', 'C-Q1 · C-Q2 · C-Q3 · C-Q4', 'Citation Quartile: the journal’s PNCI percentile within its PSC subject category, in four equal bands.', <Link key="q" href="/methodology/#quartiles">Citation Quartiles</Link>],
  ['Zone', `${Object.entries(ZONE_SHARE).map(([z]) => z).join(' · ')}`, `POSI Zone: a tiered reading of the same percentile. ${Object.entries(ZONE_SHARE).map(([z, s]) => `Zone ${z} is ${s.toLowerCase()}`).join('; ')}.`, <Link key="z" href="/methodology/#zones">POSI Zones</Link>],
]

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="How to read POSI grades" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Methodology', href: '/methodology/' }, { label: 'POSI grades' }]}>
        <p className="max-w-[68ch]">
          Every journal in POSI carries one grades badge, the same on every page: its collection tier, then its AJR
          rating (Core Collection journals only), Citation Quartile and POSI Zone where they have been assigned.
        </p>
      </PageHeader>

      <div className="doc">
        <h2 id="examples">Examples</h2>
        <div className="panel p-4 space-y-3 max-w-[560px] text-[13.5px]">
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades size="md" tier="core" ajr="A−" quartile="Q1" zone={1} />
            <span style={{ color: 'var(--muted)' }}>A certified journal, rated and ranked</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades size="md" tier="indexed" quartile="Q3" zone={3} />
            <span style={{ color: 'var(--muted)' }}>Indexed, ranked, not rated</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades size="md" tier="indexed" showEmpty />
            <span style={{ color: 'var(--muted)' }}>Indexed, not yet ranked</span>
          </div>
        </div>

        <h2 id="parts">What each part means</h2>
        <div className="panel overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>Part</th><th>Values</th><th>Meaning</th><th>Method</th></tr></thead>
            <tbody>
              {PARTS.map(([part, values, meaning, link]) => (
                <tr key={part}>
                  <td className="font-semibold whitespace-nowrap">{part}</td>
                  <td className="font-mono text-[12.5px] min-w-[150px]">{values}</td>
                  <td className="text-[13.5px] min-w-[240px]">{meaning}</td>
                  <td className="whitespace-nowrap text-[13px]">{link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          A part is left out, or shown as a dash, until it has been assigned. The first Citation Ranking edition under
          PNCI-1.0 is computed in the next data cycle; until then no journal has a C-Q or Zone. A dashed border marks
          a provisional value.
        </p>

        <h2 id="not">What POSI grades are not</h2>
        <ul>
          <li>
            They are not Web of Science or Scopus labels, and are independent of both. POSI does not record whether a
            journal is in SCIE, SSCI, AHCI or ESCI; each journal page links to Clarivate’s Master Journal List to check.
            For Scopus, each journal page shows the journal’s status as stated in Elsevier’s published Scopus source
            list, with the list’s date, and links to the journal’s Scopus page. For PubMed, it shows whether the journal
            is in NLM’s list of journals cited in PubMed and links to its NLM Catalog record, which states MEDLINE indexing.
          </li>
          <li>They describe journals, not individual articles or researchers. See <Link href="/responsible-use/">responsible use</Link>.</li>
          <li>No publisher, editor or sponsor can change a grade by hand. See the <Link href="/editorial-policy/">editorial policy</Link>.</li>
        </ul>
      </div>
    </div>
  )
}

export function gradesMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/grades/', locale) }
}

export function GradesView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '如何解读 POSI 等级',
  description: 'POSI 等级徽章：核心合集层级、AJR 评级、引文分区与 POSI Zone 的含义及评定方式。',
}

const L = (p: string) => localizedHref('zh-Hans', p)
const ZONE_SHARE_ZH: Record<string, string> = { 1: '前 5%', 2: '前 5%–20%', 3: '前 20%–50%', 4: '后 50%' }

const PARTS_ZH: [string, string, string, React.ReactNode][] = [
  ['层级', 'Core · Indexed', 'Core（核心合集）期刊经申请认证并通过 PQF 编辑评估。其他所有在 Crossref 或 OpenAlex 登记的期刊均为 Indexed（收录），包括曾获认证、但在 PQF 复审中未达标的期刊。', <Link key="t" href={L('/editorial-policy/#certification')}>编辑政策</Link>],
  ['AJR', AJR_RATING_SCALE.map(([r]) => r).join(' · '), '依据公开证据给出的绝对生命周期评级，仅适用于核心合集期刊。它不是分区：多本期刊可以获得相同评级。', <Link key="a" href={L('/ratings/')}>AJR 评级</Link>],
  ['C-Q', 'C-Q1 · C-Q2 · C-Q3 · C-Q4', '引文分区：期刊在其 PSC 学科类别内的 PNCI 百分位，均分为四档。', <Link key="q" href={L('/methodology/#quartiles')}>引文分区</Link>],
  ['Zone', `${Object.keys(ZONE_SHARE).join(' · ')}`, `POSI Zone：对同一百分位的分层解读。${Object.keys(ZONE_SHARE).map(z => `Zone ${z} 为${ZONE_SHARE_ZH[z]}`).join('；')}。`, <Link key="z" href={L('/methodology/#zones')}>POSI Zone</Link>],
]

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="如何解读 POSI 等级" crumbs={[{ label: 'POSI', href: L('/') }, { label: '评价方法', href: L('/methodology/') }, { label: 'POSI 等级' }]}>
        <p className="max-w-[68ch]">
          POSI 中的每本期刊都带有一枚等级徽章，在所有页面上保持一致：依次为收录层级、AJR 评级（仅核心合集期刊），以及已评定的引文分区与 POSI Zone。
        </p>
      </PageHeader>

      <div className="doc">
        <h2 id="examples">示例</h2>
        <div className="panel p-4 space-y-3 max-w-[560px] text-[13.5px]">
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades locale="zh-Hans" size="md" tier="core" ajr="A−" quartile="Q1" zone={1} />
            <span style={{ color: 'var(--muted)' }}>已认证期刊，已评级并已排名</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades locale="zh-Hans" size="md" tier="indexed" quartile="Q3" zone={3} />
            <span style={{ color: 'var(--muted)' }}>收录期刊，已排名，未评级</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PosiGrades locale="zh-Hans" size="md" tier="indexed" showEmpty />
            <span style={{ color: 'var(--muted)' }}>收录期刊，尚未排名</span>
          </div>
        </div>

        <h2 id="parts">各部分含义</h2>
        <div className="panel overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>部分</th><th>取值</th><th>含义</th><th>方法</th></tr></thead>
            <tbody>
              {PARTS_ZH.map(([part, values, meaning, link]) => (
                <tr key={part}>
                  <td className="font-semibold whitespace-nowrap">{part}</td>
                  <td className="font-mono text-[12.5px] min-w-[150px]">{values}</td>
                  <td className="text-[13.5px] min-w-[240px]">{meaning}</td>
                  <td className="whitespace-nowrap text-[13px]">{link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          某一部分在评定之前不显示或显示为短横线。基于 PNCI-1.0 的首期引文排名将在下一个数据周期计算，在此之前任何期刊都没有 C-Q 或 Zone。虚线边框表示暂定值。
        </p>

        <h2 id="not">POSI 等级不是什么</h2>
        <ul>
          <li>
            POSI 等级不是 Web of Science 或 Scopus 的标签，与两者均无关联。POSI 不记录期刊是否被 SCIE、SSCI、AHCI 或 ESCI 收录；每个期刊页面都提供 Clarivate Master Journal List 的链接以供查询。对于 Scopus，每个期刊页面会显示 Elsevier 公开的 Scopus 来源列表中所载的期刊状态及列表日期，并链接至该期刊的 Scopus 页面。对于 PubMed，页面会显示期刊是否在 NLM 的 PubMed 引用期刊列表中，并链接至其 NLM Catalog 记录（其中注明 MEDLINE 收录情况）。
          </li>
          <li>POSI 等级描述的是期刊，而非单篇文章或研究人员。详见<Link href={L('/responsible-use/')}>负责任使用</Link>。</li>
          <li>任何出版商、编辑或资助方都无法手工更改等级。详见<Link href={L('/editorial-policy/')}>编辑政策</Link>。</li>
        </ul>
      </div>
    </div>
  )
}
