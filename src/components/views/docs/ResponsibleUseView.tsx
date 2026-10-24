// /responsible-use/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Responsible use',
  description: 'How POSI journal rankings, certification and data should and should not be used.',
  alternates: { canonical: '/responsible-use/' },
}

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Responsible use" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Responsible use' }]}>
        <p className="max-w-[68ch]">
          POSI follows the principles of the San Francisco Declaration on Research Assessment (DORA) and the Leiden
          Manifesto: journal-level indicators describe journals, and should not stand in for judgements about
          individual articles or researchers.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="appropriate">
          <h2 id="appropriate">Appropriate uses</h2>
          <ul>
            <li>Finding and identifying journals, and checking their ISSNs, publisher, open access status and registry records.</li>
            <li>Comparing journals within a subject category by citation performance, using the PNCI category rank, percentile, Citation Quartile and POSI Zone.</li>
            <li>Confirming that a journal is indexed, or certified for the Core Collection.</li>
            <li>Documenting that a publication appears in an indexed journal, with a certificate of indexing.</li>
            <li>Research on scholarly publishing, using the data under CC BY 4.0.</li>
          </ul>
        </section>

        <section aria-labelledby="inappropriate">
          <h2 id="inappropriate">Uses to avoid</h2>
          <ul>
            <li>Judging an individual article or researcher by the rank of the journal it appeared in.</li>
            <li>Using POSI rankings as the only basis for hiring, promotion, tenure or funding decisions.</li>
            <li>Comparing Citation Quartiles, zones or raw citation scores across subject categories, which differ in citation practice.</li>
            <li>Treating POSI Citation Quartiles (C-Q1 to C-Q4) as equivalent to quartiles published by other services.</li>
            <li>Reading a PQF score as a ranking, or an AJR Rating (A+ to D) as a quartile.</li>
            <li>Treating indexing as an endorsement of every article a journal publishes.</li>
          </ul>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits">Known limitations</h2>
          <ul>
            <li>Citation counts come from Crossref and depend on what publishers deposit, so coverage varies between publishers and fields.</li>
            <li>Subject classification is computed from OpenAlex topics. Journals without a clear subject are not ranked by category.</li>
            <li>New or small journals may have unstable citation estimates. POSI applies minimum sample, coverage and category-size requirements, and marks rankings that do not meet them in full as provisional.</li>
            <li>PNCI reduces but cannot eliminate disciplinary and database-coverage differences; citation indicators measure citation performance, not every dimension of scholarly quality.</li>
            <li>Panorama Scholarly Group publishes both POSI and some of the journals it covers. See the <Link href="/coi/">conflict of interest disclosure</Link>.</li>
          </ul>
          <p>How each figure is produced is set out in the <Link href="/methodology/">methodology</Link>.</p>
        </section>

        <section aria-labelledby="cite">
          <h2 id="cite">Citing POSI</h2>
          <p className="formula">Panorama Open Scholarly Index (POSI). Panorama Scholarly Group Ltd. https://posi.panorama-sg.com. Accessed [date].</p>
          <p>
            When reusing data, please also credit the original sources shown on each record, such as Crossref and
            OpenAlex. Licensing is described under <Link href="/docs/data/#license">data sources and access</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}

export function responsibleUseMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/responsible-use/', locale) }
}

export function ResponsibleUseView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '负责任使用',
  description: 'POSI 期刊排名、认证与数据的适当用途与应避免的用途。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="负责任使用" crumbs={[{ label: 'POSI', href: L('/') }, { label: '关于', href: L('/about/') }, { label: '负责任使用' }]}>
        <p className="max-w-[68ch]">
          POSI 遵循《旧金山科研评价宣言》（DORA）与《莱顿宣言》的原则：期刊层面的指标描述的是期刊，不应替代对单篇文章或研究人员的评判。
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="appropriate">
          <h2 id="appropriate">适当用途</h2>
          <ul>
            <li>查找和识别期刊，核查其 ISSN、出版商、开放获取状态与登记记录。</li>
            <li>在同一学科类别内按引文表现比较期刊，依据 PNCI 类别排名、百分位、引文分区与 POSI Zone。</li>
            <li>确认期刊已被收录，或已获核心合集认证。</li>
            <li>以收录证书证明某篇文献发表于被收录的期刊。</li>
            <li>在 CC BY 4.0 许可下使用数据开展学术出版研究。</li>
          </ul>
        </section>

        <section aria-labelledby="inappropriate">
          <h2 id="inappropriate">应避免的用途</h2>
          <ul>
            <li>以文章所载期刊的排名评判单篇文章或研究人员。</li>
            <li>将 POSI 排名作为招聘、晋升、终身教职或资助决定的唯一依据。</li>
            <li>跨学科类别比较引文分区、Zone 或原始引文得分，因为各学科的引用习惯不同。</li>
            <li>将 POSI 引文分区（C-Q1 至 C-Q4）等同于其他机构发布的分区。</li>
            <li>将 PQF 得分视为排名，或将 AJR 评级（A+ 至 D）视为分区。</li>
            <li>将收录视为对期刊所发表每篇文章的认可。</li>
          </ul>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits">已知局限</h2>
          <ul>
            <li>引文数据来自 Crossref，取决于出版商存缴的内容，因此不同出版商与领域的覆盖程度不一。</li>
            <li>学科分类依据 OpenAlex 主题计算。学科归属不明确的期刊不参与类别排名。</li>
            <li>新创办或规模较小的期刊，其引文估计可能不稳定。POSI 设有最低样本量、覆盖率与类别规模要求，未完全满足要求的排名标注为暂定。</li>
            <li>PNCI 能够减小但无法消除学科差异与数据库覆盖差异；引文指标衡量的是引文表现，并不涵盖学术质量的所有维度。</li>
            <li>Panorama Scholarly Group 既出版 POSI，也出版其收录的部分期刊。详见<Link href={L('/coi/')}>利益冲突声明</Link>。</li>
          </ul>
          <p>各项数据的生成方式详见<Link href={L('/methodology/')}>评价方法</Link>。</p>
        </section>

        <section aria-labelledby="cite">
          <h2 id="cite">引用 POSI</h2>
          <p className="formula">Panorama Open Scholarly Index (POSI). Panorama Scholarly Group Ltd. https://posi.panorama-sg.com. Accessed [date].</p>
          <p>
            再利用数据时，请同时注明各记录所示的原始来源，例如 Crossref 与 OpenAlex。许可说明见<Link href={L('/docs/data/#license')}>数据来源与获取</Link>。
          </p>
        </section>
      </div>
    </div>
  )
}
