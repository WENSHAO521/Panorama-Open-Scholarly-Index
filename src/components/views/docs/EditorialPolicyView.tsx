// /editorial-policy/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PQF_STATUS_BANDS, PQF_STATUS_LABEL, PQF_DISCLAIMER, type PqfStatus } from '@/lib/evaluation/rules'
import { PageHeader, OnThisPage } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Editorial policy',
  description: 'How journals are indexed in POSI, how the Core Collection is certified, and how coverage is reviewed, changed and appealed.',
  alternates: { canonical: '/editorial-policy/' },
}

const PQF = [
  { code: 'JTF', name: 'Journal transparency', pts: 25, body: 'Published governance, editorial policies, author charges and reviewer guidelines.' },
  { code: 'MQF', name: 'Metadata quality', pts: 25, body: 'Article-level identifiers, abstracts, keywords and reference lists deposited with Crossref.' },
  { code: 'EGF', name: 'Editorial governance', pts: 20, body: 'A verifiable editorial board, its geographic diversity, and reviewer independence.' },
  { code: 'TDF', name: 'Technical discoverability', pts: 15, body: 'Machine-readable article metadata, working DOI links and accessible journal pages.' },
  { code: 'CVF', name: 'Citation visibility', pts: 10, body: 'Citation data visible in Crossref, OpenAlex and OpenCitations, with open reference lists.' },
  { code: 'RIF', name: 'Research integrity', pts: 5, body: 'Policies on retractions, similarity checking, data availability, ethics and authorship.' },
]

// Status bands from the central evaluation module (POSI-EVAL-1.0 § 2).
const OUTCOME_RESULT: Record<PqfStatus, string> = {
  eligible: 'Admitted to the Core Collection.',
  review_required: 'Reviewed by the editorial team before a decision.',
  insufficient_evidence: 'Not admitted. The journal may reapply once the missing evidence is published.',
  not_eligible: 'Not admitted.',
}
const OUTCOMES = PQF_STATUS_BANDS.map(([status, min], i) => [
  PQF_STATUS_LABEL[status],
  i === 0 ? `${min.toFixed(2)} or more` : min === 0 ? `Below ${PQF_STATUS_BANDS[i - 1][1]}` : `${min.toFixed(2)}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`,
  OUTCOME_RESULT[status],
])

const STATES = [
  ['Continuing review', 'Every Core Collection journal is re-checked against the same criteria at least once a year, or sooner if a concern is raised.'],
  ['Warning', 'A specific, unresolved concern, such as a policy page removed or an editorial board that can no longer be verified. The concern is shown on the journal record while POSI asks the publisher to respond.'],
  ['Suspension', 'A warning not resolved in time, or a citation-integrity finding. Affected metrics are withheld with the reason stated. The record stays visible.'],
  ['Withdrawal', 'At the publisher’s request, for any reason. Not treated as an integrity finding.'],
  ['Ceased', 'The journal has stopped publishing. The record keeps its last publication date.'],
  ['Delisting', 'Permanent removal from the Core Collection after an unresolved suspension or a confirmed severe integrity violation. The record states the reason.'],
  ['Reinstatement', 'A suspended or delisted journal that resolves the issue may return through the same evaluation as a new application.'],
]

const CONTENTS: [string, string][] = [
  ['tiers', 'Two tiers of coverage'],
  ['certification', 'Certification for the Core Collection'],
  ['evidence', 'Evidence standards'],
  ['review', 'Continuing review and coverage changes'],
  ['principles', 'Principles'],
  ['appeals', 'Corrections and appeals'],
]

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Editorial policy" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Editorial policy' }]}>
        <p className="max-w-[68ch]">
          How journals enter POSI, how the Core Collection is certified, and how coverage is reviewed and changed.
        </p>
      </PageHeader>

      <OnThisPage items={CONTENTS} />

      <div className="doc">
        <section aria-labelledby="tiers">
          <h2 id="tiers">1. Two tiers of coverage</h2>
          <h3>Indexed</h3>
          <p>
            Every scholarly journal with an ISSN that is registered with Crossref or described by OpenAlex is
            indexed. Indexed journals appear in the <Link href="/journals/">journal directory</Link>, have a
            profile page, are eligible for the <Link href="/rankings/">rankings</Link>, and their publications
            are eligible for <Link href="/certificate/">certificates of indexing</Link>. Journals without an ISSN
            are not indexed; records are matched on ISSN only, never on title.
          </p>
          <h3>Core Collection</h3>
          <p>
            The <Link href="/core-collection/">Core Collection</Link> contains journals that applied for
            certification and passed editorial evaluation under the POSI Quality Framework (PQF). Admission is by
            application only. Core Collection journals are marked throughout POSI and on certificates.
          </p>
        </section>

        <section aria-labelledby="certification">
          <h2 id="certification">2. Certification for the Core Collection</h2>
          <p>
            A publisher applies through the <Link href="/certification/">certification form</Link>. The journal
            must already be indexed. POSI evaluates publicly available evidence only: the journal website, its
            registry metadata and its deposited article metadata. A decision is issued within ten to twenty
            business days.
          </p>
          <h3>Evaluation criteria</h3>
          <p>
            PQF scores six factors from 100 points. Each criterion within a factor is met or not met, and points
            are awarded in proportion to the criteria met.
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Factor</th><th>Assesses</th><th className="text-right">Points</th></tr></thead>
              <tbody>
                {PQF.map(f => (
                  <tr key={f.code}>
                    <td className="whitespace-nowrap"><span className="font-mono text-[12.5px] mr-2" style={{ color: 'var(--muted)' }}>{f.code}</span>{f.name}</td>
                    <td className="text-[13.5px]">{f.body}</td>
                    <td className="text-right font-mono tnum">{f.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Outcomes</h3>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Status</th><th>PQF score</th><th>Result</th></tr></thead>
              <tbody>
                {OUTCOMES.map(([s, r, d]) => (
                  <tr key={s}><td className="whitespace-nowrap font-medium">{s}</td><td className="whitespace-nowrap font-mono text-[13px]">{r}</td><td className="text-[13.5px]">{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {PQF_DISCLAIMER} PQF decides admission only: it never ranks journals, and the letter grade kept in older PQF
            records is not published. The Citation Rankings are computed from PNCI as described in{' '}
            <Link href="/methodology/#ranking">methodology</Link>.
          </p>
        </section>

        <section aria-labelledby="evidence">
          <h2 id="evidence">3. Evidence standards</h2>
          <ul>
            <li>Identifiers (ISSN, ISSN-L, DOI prefix, OpenAlex id) are confirmed against the issuing registry before a record is marked verified.</li>
            <li>Registry metadata is recorded with the registry it came from.</li>
            <li>Statements made by a journal, such as peer-review model or publication frequency, are recorded as declared, not as observed.</li>
            <li>Computed values are labelled with the methodology version that produced them.</li>
          </ul>
          <p>
            See <Link href="/docs/provenance/">provenance and verification</Link> for how each state is assigned.
          </p>
        </section>

        <section aria-labelledby="review">
          <h2 id="review">4. Continuing review and coverage changes</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <tbody>
                {STATES.map(([s, d]) => (
                  <tr key={s}><td className="whitespace-nowrap font-medium align-top">{s}</td><td className="text-[13.5px]">{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Coverage changes are announced in <Link href="/announcements/">news</Link>.</p>
        </section>

        <section aria-labelledby="principles">
          <h2 id="principles">5. Principles</h2>
          <ul>
            <li>A journal’s access model and its listing in other databases are never, by themselves, grounds for inclusion, warning or removal.</li>
            <li>Every warning, suspension or delisting names its evidence.</li>
            <li>Records are never deleted silently. The history of a record stays public.</li>
            <li>No score, rank or quartile is ever set or changed by hand.</li>
            <li>Journals published by Panorama Scholarly Group are evaluated under the same criteria. See the <Link href="/coi/">conflict of interest disclosure</Link>.</li>
          </ul>
        </section>

        <section aria-labelledby="appeals">
          <h2 id="appeals">6. Corrections and appeals</h2>
          <p>
            Publishers may request a correction to a record, or appeal a certification decision, warning,
            suspension or delisting, by writing to <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>{' '}
            with supporting evidence. Appeals are reviewed independently of the original finding, and the appeal
            status is shown on the record while under review.
          </p>
        </section>
      </div>
    </div>
  )
}

export function editorialPolicyMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/editorial-policy/', locale) }
}

export function EditorialPolicyView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '编辑政策',
  description: '期刊如何被 POSI 收录、核心合集如何认证，以及收录范围如何复核、调整与申诉。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const PQF_ZH: Record<string, { name: string; body: string }> = {
  JTF: { name: '期刊透明度', body: '公开的治理结构、编辑政策、作者收费与审稿人指南。' },
  MQF: { name: '元数据质量', body: '向 Crossref 存缴的文章级标识符、摘要、关键词与参考文献列表。' },
  EGF: { name: '编辑治理', body: '可核实的编委会、编委的地域多样性，以及审稿人的独立性。' },
  TDF: { name: '技术可发现性', body: '机器可读的文章元数据、有效的 DOI 链接与可访问的期刊页面。' },
  CVF: { name: '引文可见度', body: '在 Crossref、OpenAlex 与 OpenCitations 中可见的引文数据，以及开放的参考文献列表。' },
  RIF: { name: '科研诚信', body: '关于撤稿、相似度检测、数据可用性、伦理与作者署名的政策。' },
}

const STATUS_ZH: Record<PqfStatus, string> = { eligible: '符合条件', review_required: '需复核', insufficient_evidence: '证据不足', not_eligible: '不符合条件' }
const OUTCOME_RESULT_ZH: Record<PqfStatus, string> = {
  eligible: '纳入核心合集。',
  review_required: '由编辑团队复核后作出决定。',
  insufficient_evidence: '不予纳入。期刊公布所缺证据后可重新申请。',
  not_eligible: '不予纳入。',
}
const OUTCOMES_ZH = PQF_STATUS_BANDS.map(([status, min], i) => [
  STATUS_ZH[status],
  i === 0 ? `${min.toFixed(2)} 及以上` : min === 0 ? `低于 ${PQF_STATUS_BANDS[i - 1][1]}` : `${min.toFixed(2)}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`,
  OUTCOME_RESULT_ZH[status],
])

const STATES_ZH = [
  ['持续复核', '每本核心合集期刊至少每年按相同标准复核一次；如有疑虑提出，则提前复核。'],
  ['警示', '存在具体且尚未解决的问题，例如政策页面被删除，或编委会已无法核实。问题会显示在期刊记录中，同时 POSI 请出版商作出回应。'],
  ['暂停', '警示未能及时解决，或发现引文诚信问题。受影响的指标暂不发布，并注明原因。记录仍保持可见。'],
  ['撤出', '应出版商要求撤出，原因不限。不视为诚信问题。'],
  ['停刊', '期刊已停止出版。记录保留其最后出版日期。'],
  ['除名', '暂停问题未解决，或经确认存在严重诚信违规，期刊将被永久移出核心合集。记录注明原因。'],
  ['恢复', '被暂停或除名的期刊在问题解决后，可按新申请的同一评估程序重新纳入。'],
]

const CONTENTS_ZH: [string, string][] = [
  ['tiers', '两级收录'],
  ['certification', '核心合集认证'],
  ['evidence', '证据标准'],
  ['review', '持续复核与收录范围调整'],
  ['principles', '原则'],
  ['appeals', '更正与申诉'],
]

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="编辑政策" crumbs={[{ label: 'POSI', href: L('/') }, { label: '关于', href: L('/about/') }, { label: '编辑政策' }]}>
        <p className="max-w-[68ch]">
          期刊如何进入 POSI、核心合集如何认证，以及收录范围如何复核与调整。
        </p>
      </PageHeader>

      <OnThisPage items={CONTENTS_ZH} locale="zh-Hans" />

      <div className="doc">
        <section aria-labelledby="tiers">
          <h2 id="tiers">1. 两级收录</h2>
          <h3>收录（Indexed）</h3>
          <p>
            凡在 Crossref 注册或由 OpenAlex 描述、且拥有 ISSN 的学术期刊均被收录。收录期刊出现在<Link href={L('/journals/')}>期刊目录</Link>中，拥有概况页面，有资格参与<Link href={L('/rankings/')}>排名</Link>，其文献也有资格获得<Link href={L('/certificate/')}>收录证书</Link>。没有 ISSN 的期刊不予收录；记录仅依据 ISSN 匹配，从不依据刊名。
          </p>
          <h3>核心合集（Core Collection）</h3>
          <p>
            <Link href={L('/core-collection/')}>核心合集</Link>由申请认证并通过 POSI 质量框架（PQF）编辑评估的期刊组成，仅接受申请入选。核心合集期刊在 POSI 全站及证书上均有标注。
          </p>
        </section>

        <section aria-labelledby="certification">
          <h2 id="certification">2. 核心合集认证</h2>
          <p>
            出版商通过<Link href={L('/certification/')}>认证申请表</Link>提出申请，期刊须已被收录。POSI 仅评估公开可得的证据：期刊网站、其注册机构元数据及其存缴的文章元数据。决定将在十至二十个工作日内作出。
          </p>
          <h3>评估标准</h3>
          <p>
            PQF 按六个因子评分，满分 100 分。每个因子下的每项标准判定为满足或不满足，按满足标准的比例给分。
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>因子</th><th>评估内容</th><th className="text-right">分值</th></tr></thead>
              <tbody>
                {PQF.map(f => (
                  <tr key={f.code}>
                    <td className="whitespace-nowrap"><span className="font-mono text-[12.5px] mr-2" style={{ color: 'var(--muted)' }}>{f.code}</span>{PQF_ZH[f.code].name}</td>
                    <td className="text-[13.5px]">{PQF_ZH[f.code].body}</td>
                    <td className="text-right font-mono tnum">{f.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>评估结果</h3>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>状态</th><th>PQF 得分</th><th>结果</th></tr></thead>
              <tbody>
                {OUTCOMES_ZH.map(([s, r, d]) => (
                  <tr key={s}><td className="whitespace-nowrap font-medium">{s}</td><td className="whitespace-nowrap font-mono text-[13px]">{r}</td><td className="text-[13.5px]">{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            PQF 是资格与质量框架评估，并非引文排名指标，不决定引文分区或 POSI Zone。PQF 仅决定准入：它从不用于期刊排名，旧版 PQF 记录中保留的字母等级也不予发布。引文排名依据 PNCI 计算，详见<Link href={L('/methodology/#ranking')}>评价方法</Link>。
          </p>
        </section>

        <section aria-labelledby="evidence">
          <h2 id="evidence">3. 证据标准</h2>
          <ul>
            <li>标识符（ISSN、ISSN-L、DOI 前缀、OpenAlex ID）须先与签发注册机构核对，记录方可标记为已核验。</li>
            <li>注册机构元数据连同其来源注册机构一并记录。</li>
            <li>期刊自身的陈述（例如同行评审模式或出版频率）记录为“自述”，而非观察结果。</li>
            <li>计算值标注生成该值的评价方法版本。</li>
          </ul>
          <p>
            各状态的赋予方式详见<Link href={L('/docs/provenance/')}>数据溯源与核验</Link>。
          </p>
        </section>

        <section aria-labelledby="review">
          <h2 id="review">4. 持续复核与收录范围调整</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <tbody>
                {STATES_ZH.map(([s, d]) => (
                  <tr key={s}><td className="whitespace-nowrap font-medium align-top">{s}</td><td className="text-[13.5px]">{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>收录范围的调整在<Link href={L('/announcements/')}>新闻动态</Link>中公布。</p>
        </section>

        <section aria-labelledby="principles">
          <h2 id="principles">5. 原则</h2>
          <ul>
            <li>期刊的获取模式及其是否被其他数据库收录，本身从不构成收录、警示或移除的理由。</li>
            <li>每项警示、暂停或除名都注明所依据的证据。</li>
            <li>记录从不被悄然删除，记录的历史始终公开。</li>
            <li>任何得分、排名或分区从不由人工设定或更改。</li>
            <li>Panorama Scholarly Group 出版的期刊按相同标准评估。详见<Link href={L('/coi/')}>利益冲突声明</Link>。</li>
          </ul>
        </section>

        <section aria-labelledby="appeals">
          <h2 id="appeals">6. 更正与申诉</h2>
          <p>
            出版商可发送邮件至 <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a> 并附上支持证据，申请更正记录，或对认证决定、警示、暂停或除名提出申诉。申诉由独立于原判定的人员复核，复核期间记录上会显示申诉状态。
          </p>
        </section>
      </div>
    </div>
  )
}
