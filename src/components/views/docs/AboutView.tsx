// About POSI (/about/), in every language it is published in.
import Link from 'next/link'
import type { Metadata } from 'next'
import { getDirectory, getPublishers } from '@/lib/global-journals'
import { getCoreCollection, PSG_JOURNALS } from '@/lib/data'
import { getRankings, RANKING_AVAILABLE } from '@/lib/rankings'
import { PageHeader, fmt } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const WORDS = {
  en: {
    title: 'About POSI', crumb: 'About',
    description: 'The Panorama Open Scholarly Index is a citation index and journal directory published by Panorama Scholarly Group Ltd.',
    lead: 'The Panorama Open Scholarly Index (POSI) is a citation index and journal directory published by Panorama Scholarly Group Ltd. It covers every scholarly journal registered with Crossref or described by OpenAlex, certifies journals for its Core Collection after editorial evaluation, rates their lifecycle development (AJR), and ranks journals by PNCI within subject categories.',
    stats: { indexed: 'Indexed journals', core: 'Core Collection', ranked: 'Ranked journals', publishers: 'Publishers', publications: 'Publications', publicationsValue: '300 million+' },
  },
  'zh-Hans': {
    title: '关于 POSI', crumb: '关于',
    description: 'Panorama Open Scholarly Index 是由 Panorama Scholarly Group Ltd. 出版的引文索引与期刊目录。',
    lead: 'Panorama Open Scholarly Index（POSI）是由 Panorama Scholarly Group Ltd. 出版的引文索引与期刊目录。POSI 收录所有在 Crossref 注册或由 OpenAlex 描述的学术期刊，经编辑评审后认证核心合集期刊，对期刊的生命周期发展进行评级（AJR），并在各学科类别内按 PNCI 对期刊进行排名。',
    stats: { indexed: '收录期刊', core: '核心合集', ranked: '已排名期刊', publishers: '出版商', publications: '文献', publicationsValue: '3 亿篇以上' },
  },
} satisfies Record<Locale, unknown>

interface Data { core: number; psg: number }

export function aboutMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/about/', locale) }
}

export function AboutView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const indexed = getDirectory().records.length
  const core = getCoreCollection().length
  const { ranked } = getRankings()
  const psg = PSG_JOURNALS.length
  const publishers = getPublishers().length
  const d: Data = { core, psg }

  return (
    <div className="pb-12">
      <PageHeader locale={locale} title={w.title} crumbs={[{ label: 'POSI', href: localizedHref(locale, '/') }, { label: w.crumb }]}>
        <p className="max-w-[68ch]">{w.lead}</p>
      </PageHeader>

      <dl className="stat-strip grid-cols-2 lg:grid-cols-4 max-w-[900px]">
        {[
          [w.stats.indexed, fmt(indexed)],
          [w.stats.core, fmt(core)],
          // Before the first ranking edition, show a figure that exists rather than "Pending".
          RANKING_AVAILABLE ? [w.stats.ranked, fmt(ranked.length)] : [w.stats.publishers, fmt(publishers)],
          [w.stats.publications, w.stats.publicationsValue],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mt-1 figure text-[22px]">{v}</dd>
          </div>
        ))}
      </dl>

      {locale === 'zh-Hans' ? <Zh {...d} /> : <En {...d} />}
    </div>
  )
}

function En({ core, psg }: Data) {
  return (
    <div className="doc mt-12">
      <section aria-labelledby="provides">
        <h2 id="provides">What POSI provides</h2>
        <ul>
          <li><Link href="/publications/">Publication search</Link> across more than 300 million works, with citation export and open access links.</li>
          <li>A <Link href="/journals/">journal directory</Link> of every indexed journal, with a profile page for each: identifiers, output and citations per year, subject, topics and ranking.</li>
          <li>The <Link href="/core-collection/">Core Collection</Link>: journals that applied for certification and passed editorial evaluation.</li>
          <li><Link href="/rankings/">Journal rankings</Link> by PNCI within subject categories, with citation ranks, percentiles, Citation Quartiles (C-Q1 to C-Q4) and POSI Zones.</li>
          <li><Link href="/certificate/">Certificates of indexing</Link> for authors, verifiable by anyone.</li>
          <li><Link href="/datasets/">Data downloads</Link> of the directory, rankings and records.</li>
        </ul>
      </section>

      <section aria-labelledby="coverage">
        <h2 id="coverage">Coverage</h2>
        <p>
          POSI indexes journals, not individual submissions. A journal is included when it has an ISSN and is
          registered with Crossref or described by OpenAlex. Indexed journals appear in the directory and, when their
          citation data meet the minimum requirements, in the Citation Rankings. The Core Collection is a separate tier that a journal enters only by applying for
          certification. The rules are set out in the <Link href="/editorial-policy/">editorial policy</Link>.
        </p>
        <p>
          Metadata is taken from Crossref and OpenAlex and refreshed daily. The Citation Ranking is published once a
          year, each December, and AJR ratings of Core Collection journals are re-rated every month, both under a
          versioned methodology described in <Link href="/methodology/">methodology</Link>.
        </p>
      </section>

      <section aria-labelledby="independence">
        <h2 id="independence">Independence</h2>
        <p>
          POSI is independent of Web of Science, Scopus and DOAJ. Listing in those or any other services does not
          determine inclusion in POSI, admission to the Core Collection, or any score or ranking. Rankings are
          produced by versioned calculation code. No publisher, editor, sponsor or member of staff can change a
          published result by hand.
        </p>
      </section>

      <section aria-labelledby="coi">
        <h2 id="coi">Conflict of interest</h2>
        <p>
          Panorama Scholarly Group Ltd. publishes POSI and also publishes journals.{' '}
          {psg} of the {core} Core Collection journals are published by Panorama Scholarly Group. These journals
          are evaluated under the same criteria as every other journal. Readers should take this relationship into
          account. The affected journals are listed in the <Link href="/coi/">conflict of interest disclosure</Link>.
        </p>
      </section>

      <section aria-labelledby="licensing">
        <h2 id="licensing">Licensing</h2>
        <p>
          POSI is open source. POSI data is published under CC BY 4.0 and the software under the MIT License.
          Third-party metadata keeps its original license: OpenAlex data is CC0, and Crossref metadata is
          provided without restriction.
        </p>
      </section>

      <section aria-labelledby="publisher">
        <h2 id="publisher">Publisher</h2>
        <address className="not-italic mt-3 panel p-4 text-[14.5px] leading-relaxed">
          <strong style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</strong><br />
          Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
          625 Nathan Road, Kowloon, Hong Kong SAR<br />
          <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
        </address>
        <p>
          Enquiries are acknowledged within two to three business days. Certification reviews take ten to twenty
          business days. See <Link href="/contact/">contact</Link> for the right subject line for each request.
        </p>
      </section>

      <section aria-labelledby="use">
        <h2 id="use">Appropriate use</h2>
        <p>
          Journal rankings describe journals, not the quality of individual articles or researchers. They should
          not be the sole basis for hiring, promotion or funding decisions. See{' '}
          <Link href="/responsible-use/">responsible use</Link>.
        </p>
      </section>
    </div>
  )
}

function Zh({ core, psg }: Data) {
  const L = (p: string) => localizedHref('zh-Hans', p)
  return (
    <div className="doc mt-12">
      <section aria-labelledby="provides">
        <h2 id="provides">POSI 提供的服务</h2>
        <ul>
          <li><Link href={L('/publications/')}>文献检索</Link>：覆盖 3 亿多篇文献，支持引文导出与开放获取链接。</li>
          <li><Link href={L('/journals/')}>期刊目录</Link>：收录全部已收录期刊，每种期刊均有独立页面，展示标识符、逐年发文量与被引量、学科、主题及排名。</li>
          <li><Link href={L('/core-collection/')}>核心合集</Link>：经申请认证并通过编辑评审的期刊。</li>
          <li><Link href={L('/rankings/')}>期刊排名</Link>：在各学科类别内按 PNCI 排名，提供引文排名、百分位、引文分区（C-Q1 至 C-Q4）与 POSI Zone。</li>
          <li><Link href={L('/certificate/')}>收录证书</Link>：面向作者出具，任何人均可验证。</li>
          <li><Link href={L('/datasets/')}>数据下载</Link>：期刊目录、排名与记录。</li>
        </ul>
      </section>

      <section aria-labelledby="coverage">
        <h2 id="coverage">收录范围</h2>
        <p>
          POSI 收录的是期刊，而非单篇投稿。期刊只要拥有 ISSN，并在 Crossref 注册或由 OpenAlex 描述，即予收录。已收录期刊列入期刊目录；其引文数据达到最低要求时，进入引文排名。核心合集是独立的一个层级，期刊须申请认证方可入选。相关规则详见<Link href={L('/editorial-policy/')}>编辑政策</Link>。
        </p>
        <p>
          元数据取自 Crossref 与 OpenAlex，每日更新。引文排名每年 12 月发布一次；核心合集期刊的 AJR 评级每月重新评定。两者均依据有版本号的方法进行，详见<Link href={L('/methodology/')}>评价方法</Link>。
        </p>
      </section>

      <section aria-labelledby="independence">
        <h2 id="independence">独立性</h2>
        <p>
          POSI 独立于 Web of Science、Scopus 与 DOAJ。期刊是否被上述或其他任何服务收录，均不影响其能否被 POSI 收录、能否入选核心合集，也不影响任何评分或排名。排名由有版本号的计算代码生成，任何出版商、编辑、赞助方或工作人员都无法人工修改已发布的结果。
        </p>
      </section>

      <section aria-labelledby="coi">
        <h2 id="coi">利益冲突</h2>
        <p>
          Panorama Scholarly Group Ltd. 既出版 POSI，也出版期刊。在 {core} 种核心合集期刊中，有 {psg} 种由 Panorama Scholarly Group 出版。这些期刊与其他所有期刊采用相同的评审标准。请读者在使用时考虑这一关系。相关期刊列于<Link href={L('/coi/')}>利益冲突声明</Link>。
        </p>
      </section>

      <section aria-labelledby="licensing">
        <h2 id="licensing">许可协议</h2>
        <p>
          POSI 是开源项目。POSI 数据以 CC BY 4.0 发布，软件以 MIT 许可证发布。第三方元数据保留其原有许可：OpenAlex 数据为 CC0，Crossref 元数据可无限制使用。
        </p>
      </section>

      <section aria-labelledby="publisher">
        <h2 id="publisher">出版者</h2>
        <address className="not-italic mt-3 panel p-4 text-[14.5px] leading-relaxed">
          <strong style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</strong><br />
          Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
          625 Nathan Road, Kowloon, Hong Kong SAR<br />
          <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
        </address>
        <p>
          咨询将在两至三个工作日内得到确认回复。认证评审需时十至二十个工作日。各类请求应使用的邮件主题，请见<Link href={L('/contact/')}>联系我们</Link>。
        </p>
      </section>

      <section aria-labelledby="use">
        <h2 id="use">合理使用</h2>
        <p>
          期刊排名描述的是期刊，而非单篇论文或研究人员的水平，不应作为招聘、晋升或资助决定的唯一依据。详见<Link href={L('/responsible-use/')}>负责任使用</Link>。
        </p>
      </section>
    </div>
  )
}
