// /docs/data/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Data sources and access',
  description: 'Where POSI data comes from, how often it is updated, and how to download and reuse it.',
  alternates: { canonical: '/docs/data/' },
}

const SOURCES = [
  ['Crossref', 'Journal list, ISSNs, DOI counts, article metadata, item-level citation counts for PNCI and PCS, certificate checks', 'Daily'],
  ['OpenAlex', 'Journal profiles, topics, output and citations per year, h-index, open access and DOAJ status, publication search', 'Daily; search is live'],
  ['DataCite', 'Records mixed into publication search; articles of journals whose DOIs are registered with DataCite (Zenodo included), on their journal listings and, when Crossref has none of their works, for AJR article data and PCS; publication pages when OpenAlex cannot answer', 'Search and listings live; AJR and PCS with each run'],
  ['Zenodo', 'Records mixed into publication search; Zenodo records, with files and licences, on publication pages when the sources above cannot answer', 'Live'],
  ['Journal websites', 'AJR evidence: editorial governance, peer review, research integrity and transparency policies', 'Monthly, Core Collection'],
  ['POSI editorial', 'Core Collection records, PQF evaluations, verified classifications, certification decisions', 'On each decision'],
]

const FORMATS = [
  ['Journal directory', 'CSV per subject category', <Link key="j" href="/journals/">Journals</Link>],
  ['Citation Rankings', 'CSV and JSON per PSC category', <Link key="r" href="/rankings/">Rankings</Link>],
  ['Journal records', 'JSON per record', <Link key="d" href="/datasets/">Data downloads</Link>],
  ['Publication search results', 'CSV, BibTeX and RIS', <Link key="p" href="/publications/">Publications</Link>],
  ['Full data snapshots', 'JSON, versioned', <Link key="s" href="/datasets/">Data downloads</Link>],
]

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Data sources and access" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Data sources and access' }]}>
        <p className="max-w-[68ch]">Where POSI data comes from, how often it changes, and how to download and reuse it.</p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="sources">
          <h2 id="sources">Sources</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Source</th><th>Used for</th><th>Updated</th></tr></thead>
              <tbody>
                {SOURCES.map(([s, u, f]) => (
                  <tr key={s}><td className="font-medium whitespace-nowrap">{s}</td><td className="text-[13.5px]">{u}</td><td className="whitespace-nowrap text-[13.5px]">{f}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Every value on a record names its source. Registry values are shown as the registry states them;
            publisher statements are marked as declared. See <Link href="/docs/provenance/">provenance and verification</Link>.
          </p>
        </section>

        <section aria-labelledby="formats">
          <h2 id="formats">Downloads</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Data</th><th>Format</th><th>Where</th></tr></thead>
              <tbody>
                {FORMATS.map(([d, f, w]) => (
                  <tr key={d as string}><td className="font-medium whitespace-nowrap">{d}</td><td className="text-[13.5px]">{f}</td><td className="text-[13.5px]">{w}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Field definitions are listed in the <Link href="/docs/schema/">record schema</Link>. Every download
            states the methodology version and date it was produced from.
          </p>
        </section>

        <section aria-labelledby="license">
          <h2 id="license">Licence and attribution</h2>
          <p>
            POSI data is published under CC BY 4.0. Please cite it as: <em>Panorama Open Scholarly Index (POSI),
            Panorama Scholarly Group Ltd., accessed [date]</em>. Third-party metadata keeps its original licence:
            OpenAlex data is CC0 and Crossref metadata is available without restriction.
          </p>
        </section>

        <section aria-labelledby="corrections">
          <h2 id="corrections">Corrections</h2>
          <p>
            Registry data is corrected at its source: publishers update Crossref through their member account, and
            OpenAlex accepts corrections through its support form. POSI picks up the change at the next daily
            update. For POSI records and classifications, write to{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}

export function dataAccessMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/docs/data/', locale) }
}

export function DataAccessView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '数据来源与获取',
  description: 'POSI 数据的来源、更新频率，以及下载与再利用方式。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const SOURCES_ZH = [
  ['Crossref', '期刊列表、ISSN、DOI 数量、文章元数据、用于 PNCI 与 PCS 的文献级被引次数、证书核查', '每日'],
  ['OpenAlex', '期刊概况、主题、逐年产出与被引、h 指数、开放获取与 DOAJ 状态、文献检索', '每日；检索为实时'],
  ['DataCite', '并入文献检索的记录；DOI 在 DataCite 注册的期刊（含 Zenodo）的文章，用于其期刊文献列表，并在 Crossref 无其文献时用于 AJR 文章数据与 PCS；OpenAlex 无法响应时用于文献页面', '检索与列表为实时；AJR 与 PCS 随每次运行更新'],
  ['Zenodo', '并入文献检索的记录；上述来源无法响应时，文献页面使用 Zenodo 记录（含文件与许可协议）', '实时'],
  ['期刊网站', 'AJR 证据：编辑治理、同行评议、科研诚信与透明度政策', '每月，核心合集'],
  ['POSI 编辑部', '核心合集记录、PQF 评估、经核实的分类、认证决定', '每次作出决定时'],
]

const FORMATS_ZH = [
  ['期刊目录', '按学科类别提供 CSV', <Link key="j" href={L('/journals/')}>期刊</Link>],
  ['引文排名', '按 PSC 类别提供 CSV 与 JSON', <Link key="r" href={L('/rankings/')}>排名</Link>],
  ['期刊记录', '每条记录一个 JSON', <Link key="d" href={L('/datasets/')}>数据下载</Link>],
  ['文献检索结果', 'CSV、BibTeX 与 RIS', <Link key="p" href={L('/publications/')}>文献</Link>],
  ['完整数据快照', 'JSON，带版本号', <Link key="s" href={L('/datasets/')}>数据下载</Link>],
]

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="数据来源与获取" crumbs={[{ label: '文档', href: L('/docs/') }, { label: '数据来源与获取' }]}>
        <p className="max-w-[68ch]">POSI 数据的来源、更新频率，以及下载与再利用方式。</p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="sources">
          <h2 id="sources">数据来源</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>来源</th><th>用途</th><th>更新频率</th></tr></thead>
              <tbody>
                {SOURCES_ZH.map(([s, u, f]) => (
                  <tr key={s}><td className="font-medium whitespace-nowrap">{s}</td><td className="text-[13.5px]">{u}</td><td className="text-[13.5px] min-w-[120px]">{f}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            记录中的每个值都注明其来源。注册机构数据按注册机构所载原样显示；出版方陈述标注为“自述”。详见<Link href={L('/docs/provenance/')}>数据溯源与核验</Link>。
          </p>
        </section>

        <section aria-labelledby="formats">
          <h2 id="formats">下载</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>数据</th><th>格式</th><th>位置</th></tr></thead>
              <tbody>
                {FORMATS_ZH.map(([d, f, w]) => (
                  <tr key={d as string}><td className="font-medium whitespace-nowrap">{d}</td><td className="text-[13.5px]">{f}</td><td className="text-[13.5px]">{w}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            字段定义见<Link href={L('/docs/schema/')}>记录结构</Link>。每份下载文件都注明其所依据的评价方法版本与生成日期。
          </p>
        </section>

        <section aria-labelledby="license">
          <h2 id="license">许可与署名</h2>
          <p>
            POSI 数据以 CC BY 4.0 许可发布。引用格式：<em>Panorama Open Scholarly Index (POSI), Panorama Scholarly Group Ltd., accessed [date]</em>。第三方元数据保留其原始许可：OpenAlex 数据为 CC0，Crossref 元数据可无限制使用。
          </p>
        </section>

        <section aria-labelledby="corrections">
          <h2 id="corrections">更正</h2>
          <p>
            注册机构数据须在源头更正：出版商通过其会员账户更新 Crossref，OpenAlex 则通过其支持表单受理更正。POSI 会在下一次每日更新时同步变更。POSI 记录与分类的更正，请发送邮件至 <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>。
          </p>
        </section>
      </div>
    </div>
  )
}
