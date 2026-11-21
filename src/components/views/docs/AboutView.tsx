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
    description: 'The Panorama Open Scholarly Index (POSI) is an open citation index and journal directory published by Panorama Scholarly Group Ltd.',
    lead: 'The Panorama Open Scholarly Index (POSI) is an open citation index and journal directory published by Panorama Scholarly Group Ltd. POSI indexes all scholarly journals registered with Crossref or described in OpenAlex. It admits journals to its Core Collection following editorial evaluation, rates the lifecycle and publishing development of Core Collection journals (AJR), and ranks journals by PNCI within subject categories.',
    stats: { indexed: 'Indexed journals', core: 'Core Collection', ranked: 'Ranked journals', publishers: 'Publishers', publications: 'Publications', publicationsValue: '300 million+' },
  },
  'zh-Hans': {
    title: '关于 POSI', crumb: '关于',
    description: 'Panorama Open Scholarly Index（POSI）是由 Panorama Scholarly Group Ltd. 出版的开放引文索引与期刊目录。',
    lead: 'Panorama Open Scholarly Index（POSI）是由 Panorama Scholarly Group Ltd. 出版的开放引文索引与期刊目录。POSI 收录在 Crossref 注册或由 OpenAlex 描述的全部学术期刊；经编辑评审后接纳期刊进入核心合集，对核心合集期刊的生命周期与出版发展进行评级（AJR），并在各学科类别内按 PNCI 对期刊进行排名。',
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
        <h2 id="provides">Services</h2>
        <p>POSI provides the following services, all of which are freely available without registration:</p>
        <ul>
          <li><Link href="/publications/">Publication search</Link> covering more than 300 million works, with citation export and links to open access versions.</li>
          <li>A <Link href="/journals/">journal directory</Link> comprising all indexed journals. Each journal has a dedicated record presenting its identifiers, annual output and citations, subject classification, research topics and ranking.</li>
          <li>The <Link href="/core-collection/">Core Collection</Link>, comprising journals that have applied for certification and passed editorial evaluation.</li>
          <li><Link href="/rankings/">Journal Citation Rankings</Link> by PNCI within subject categories, reporting citation rank, percentile, Citation Quartile (C-Q1 to C-Q4) and POSI Zone.</li>
          <li><Link href="/certificate/">Certificates of indexing</Link> issued to authors, which any party may verify.</li>
          <li><Link href="/datasets/">Data downloads</Link> of the journal directory, rankings and journal records.</li>
        </ul>
      </section>

      <section aria-labelledby="coverage">
        <h2 id="coverage">Scope of coverage</h2>
        <p>
          POSI indexes journals; it does not index individual submissions. A journal is included when it holds an
          ISSN and is registered with Crossref or described in OpenAlex. All indexed journals are listed in the
          journal directory; those whose citation data meet the minimum requirements are also included in the
          Citation Rankings. The Core Collection is a distinct tier, to which a journal is admitted only upon
          application for certification. The applicable rules are set out in
          the <Link href="/editorial-policy/">editorial policy</Link>.
        </p>
      </section>

      <section aria-labelledby="data">
        <h2 id="data">Data sources and update schedule</h2>
        <p>
          Journal metadata is obtained from Crossref and OpenAlex and is refreshed daily. Publication search
          additionally draws on DataCite and Zenodo. The Citation Rankings are published annually in December, and
          the AJR ratings of Core Collection journals are reviewed monthly. Both are produced under a versioned
          methodology documented in <Link href="/methodology/">methodology</Link>.
        </p>
      </section>

      <section aria-labelledby="independence">
        <h2 id="independence">Independence and integrity</h2>
        <p>
          POSI is independent of Web of Science, Scopus and DOAJ. Listing in those or any other services has no
          bearing on inclusion in POSI, admission to the Core Collection, or any score or ranking. Rankings are
          generated by versioned calculation code, and no publisher, editor, sponsor or member of staff is able to
          alter a published result manually.
        </p>
      </section>

      <section aria-labelledby="coi">
        <h2 id="coi">Conflict of interest</h2>
        <p>
          Panorama Scholarly Group Ltd. is both the publisher of POSI and a publisher of scholarly journals.{' '}
          {psg} of the {core} Core Collection journals are published by Panorama Scholarly Group. These journals
          are evaluated under the same criteria as all other journals. Users are advised to take this relationship
          into account. The journals concerned are listed in
          the <Link href="/coi/">conflict of interest disclosure</Link>.
        </p>
      </section>

      <section aria-labelledby="licensing">
        <h2 id="licensing">Licensing</h2>
        <p>
          POSI is open source. POSI data is published under the CC BY 4.0 licence and its software under the MIT
          License. Third-party metadata remains subject to its original licence: OpenAlex data is released under
          CC0, and Crossref metadata is provided without restriction.
        </p>
      </section>

      <section aria-labelledby="publisher">
        <h2 id="publisher">Publisher and contact</h2>
        <address className="not-italic mt-3 panel p-4 text-[15px] leading-relaxed">
          <strong style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</strong><br />
          Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
          625 Nathan Road, Kowloon, Hong Kong SAR<br />
          <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
        </address>
        <p>
          Enquiries are acknowledged within two to three business days. Certification reviews are completed within
          ten to twenty business days. The subject line to be used for each type of request is specified
          under <Link href="/contact/">contact</Link>.
        </p>
      </section>

      <section aria-labelledby="use">
        <h2 id="use">Appropriate use</h2>
        <p>
          Journal rankings evaluate journals; they do not measure the quality of individual articles or
          researchers, and should not serve as the sole basis for decisions on appointment, promotion or funding.
          Further guidance is provided in <Link href="/responsible-use/">responsible use</Link>.
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
        <h2 id="provides">服务内容</h2>
        <p>POSI 提供以下服务，全部免费开放，无需注册：</p>
        <ul>
          <li><Link href={L('/publications/')}>文献检索</Link>：覆盖逾 3 亿篇文献，支持引文导出，并提供开放获取版本链接。</li>
          <li><Link href={L('/journals/')}>期刊目录</Link>：涵盖全部收录期刊。每种期刊均设有独立记录页，列明其标识符、逐年发文量与被引量、学科分类、研究主题及排名。</li>
          <li><Link href={L('/core-collection/')}>核心合集</Link>：由申请认证并通过编辑评审的期刊组成。</li>
          <li><Link href={L('/rankings/')}>期刊引文排名</Link>：在各学科类别内按 PNCI 排名，列出引文排名、百分位、引文分区（C-Q1 至 C-Q4）与 POSI Zone。</li>
          <li><Link href={L('/certificate/')}>收录证书</Link>：向作者出具，任何人均可核验。</li>
          <li><Link href={L('/datasets/')}>数据下载</Link>：期刊目录、排名与期刊记录。</li>
        </ul>
      </section>

      <section aria-labelledby="coverage">
        <h2 id="coverage">收录范围</h2>
        <p>
          POSI 以期刊为收录对象，不收录单篇投稿。期刊凡拥有 ISSN，并在 Crossref 注册或由 OpenAlex 描述，即予收录。全部收录期刊均列入期刊目录；其中引文数据达到最低要求者，同时列入引文排名。核心合集为独立层级，期刊须提出认证申请方可入选。相关规则详见<Link href={L('/editorial-policy/')}>编辑政策</Link>。
        </p>
      </section>

      <section aria-labelledby="data">
        <h2 id="data">数据来源与更新周期</h2>
        <p>
          期刊元数据取自 Crossref 与 OpenAlex，每日更新；文献检索另外查询 DataCite 与 Zenodo。引文排名每年 12 月发布一次；核心合集期刊的 AJR 评级每月复核一次。两者均依据有版本号的评价方法进行，详见<Link href={L('/methodology/')}>评价方法</Link>。
        </p>
      </section>

      <section aria-labelledby="independence">
        <h2 id="independence">独立性与公正性</h2>
        <p>
          POSI 独立于 Web of Science、Scopus 与 DOAJ。期刊是否被上述或其他任何服务收录，与其能否被 POSI 收录、能否入选核心合集以及任何评分或排名均无关联。排名由有版本号的计算代码生成，任何出版商、编辑、赞助方或工作人员均无法人工修改已发布的结果。
        </p>
      </section>

      <section aria-labelledby="coi">
        <h2 id="coi">利益冲突</h2>
        <p>
          Panorama Scholarly Group Ltd. 既是 POSI 的出版方，也是学术期刊的出版商。在 {core} 种核心合集期刊中，有 {psg} 种由 Panorama Scholarly Group 出版。上述期刊与其他所有期刊适用相同的评审标准。敬请使用者在使用时考虑这一关系。相关期刊列于<Link href={L('/coi/')}>利益冲突声明</Link>。
        </p>
      </section>

      <section aria-labelledby="licensing">
        <h2 id="licensing">许可协议</h2>
        <p>
          POSI 为开源项目。POSI 数据以 CC BY 4.0 许可协议发布，软件以 MIT 许可证发布。第三方元数据仍适用其原有许可：OpenAlex 数据以 CC0 发布，Crossref 元数据可无限制使用。
        </p>
      </section>

      <section aria-labelledby="publisher">
        <h2 id="publisher">出版方与联系方式</h2>
        <address className="not-italic mt-3 panel p-4 text-[15px] leading-relaxed">
          <strong style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</strong><br />
          Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
          625 Nathan Road, Kowloon, Hong Kong SAR<br />
          <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
        </address>
        <p>
          来函将于两至三个工作日内获确认回复；认证评审于十至二十个工作日内完成。各类请求所应使用的邮件主题，详见<Link href={L('/contact/')}>联系我们</Link>。
        </p>
      </section>

      <section aria-labelledby="use">
        <h2 id="use">合理使用</h2>
        <p>
          期刊排名的评价对象为期刊，不衡量单篇论文或研究人员个人的水平，不应作为聘任、晋升或资助决定的唯一依据。详见<Link href={L('/responsible-use/')}>负责任使用</Link>。
        </p>
      </section>
    </div>
  )
}
