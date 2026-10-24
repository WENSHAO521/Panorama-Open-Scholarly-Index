// Shared body of the AJR pages (/ratings/, /ratings/early-stage/, /ratings/mature/).
import Link from 'next/link'
import { AJR_DISCLAIMER, AJR_RATING_SCALE, ajrRatingRange } from '@/lib/evaluation/rules'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/alternates'

export function AjrRatingScale({ locale = 'en' }: { locale?: Locale }) {
  const zh = locale === 'zh-Hans'
  return (
    <div className="panel overflow-x-auto max-w-[420px]">
      <table className="dtable">
        <thead><tr><th>{zh ? 'AJR 得分' : 'AJR Score'}</th><th>{zh ? 'AJR 评级' : 'AJR Rating'}</th></tr></thead>
        <tbody>{AJR_RATING_SCALE.map(([r]) => <tr key={r}><td className="font-mono text-[13px]">{ajrRatingRange(r)}</td><td className="font-medium">{zh ? `评级 ${r}` : `Rating ${r}`}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export function AjrCommon({ locale = 'en' }: { locale?: Locale }) {
  if (locale === 'zh-Hans') return <AjrCommonZh />
  return (
    <>
      <p><strong>{AJR_DISCLAIMER}</strong></p>
      <h2 id="scope">Which journals are rated</h2>
      <p>
        AJR is published for <Link href="/core-collection/">Core Collection</Link> journals only. A rating rests on
        evidence from the journal&rsquo;s own website, which POSI collects and checks every month for Core Collection
        journals. Other journals, including those found through journal search and the directory, show no AJR: no
        score, rating or lifecycle stage. Their citation performance is shown by PNCI, PCS and the Citation Ranking.
      </p>
      <h2 id="evidence">Where the evidence comes from</h2>
      <p>
        Editorial governance, research integrity and transparency are rated from published evidence, in this order:
      </p>
      <ul>
        <li><strong>The journal&rsquo;s own website</strong>: its policy pages, collected in each monthly run.</li>
        <li>
          <strong>Publisher-wide policies</strong>: where a publisher states that a policy (publication ethics,
          corrections, authorship, conflicts of interest, AI use, data, similarity checking, research ethics,
          complaints, copyright, ownership, advertising) covers all its journals and POSI has verified that page,
          the journal inherits it. Journal-specific items such as the editorial board, peer-review process, access
          model and fees never do.
        </li>
        <li>
          <strong>The journal&rsquo;s own Crossref records</strong>: of its newest articles published in the last three
          years (up to 100, at least 20), when at least half carry a licence for the published article, that is evidence
          of its copyright and licensing terms; when at least half carry a Crossmark update policy, that is its
          corrections and retractions policy. Statements in individual articles (review dates, conflicts of interest,
          data availability) do not count as the journal&rsquo;s policy.
        </li>
      </ul>
      <p>
        A later source only fills what an earlier one could not resolve; it never overrides what the journal&rsquo;s
        website shows. Evidence that cannot be reached is not counted against the journal. This is Evidence Coverage
        EC-1.1, used by AJR-E-1.2 and AJR-M-1.2 from the October 2026 rerate (7 October).
      </p>
      <h2 id="scale">Rating scale</h2>
      <p>Every AJR Rating is read from the AJR Score by one table:</p>
      <AjrRatingScale />
      <p>
        Example: AJR-E 85.72 / 100 is Rating A; AJR-M 82.64 / 100 is Rating A−. The rating is not a quartile and is not
        relative to other journals in the subject. The E-Q and M-Q quartiles published earlier are withdrawn and are not
        converted into ratings.
      </p>
      <h2 id="lifecycle">Lifecycle</h2>
      <ul>
        <li><strong>Observation</strong>: 0–11 months since first publication. No score.</li>
        <li><strong>AJR-E</strong>, Early-stage Journal Rating: 12–59 months.</li>
        <li><strong>AJR-M</strong>, Mature Journal Rating: 60 months or more.</li>
      </ul>
      <p>
        A journal&rsquo;s lifecycle stage does not decide its Citation Ranking, which is computed from PNCI within its PSC
        category (<Link href="/methodology/#ranking">methodology</Link>).
      </p>
      <h2 id="updates">Updates</h2>
      <p>
        Core Collection journals are re-rated every month, on the 7th. Each run collects the evidence again from the
        journal&rsquo;s website, its Crossref records and OpenAlex, and computes the lifecycle stage from the rating date,
        so a journal moves from Observation to AJR-E at 12 months and to AJR-M at 60 months without waiting for a
        review. Evidence that could not be reached in a run is not counted against the journal: the previous evidence
        is kept. Every rating states its date and model version.
      </p>
    </>
  )
}

function AjrCommonZh() {
  const L = (p: string) => localizedHref('zh-Hans', p)
  return (
    <>
      <p><strong>AJR 评级是依据期刊生命周期给出的绝对评级，并非引文分区，不应解读为学科内的相对排名。</strong></p>
      <h2 id="scope">哪些期刊参与评级</h2>
      <p>
        AJR 仅对<Link href={L('/core-collection/')}>核心合集</Link>期刊发布。评级依据期刊自身网站上的证据，POSI 每月为核心合集期刊收集并核查这些证据。其他期刊（包括通过期刊检索和期刊目录找到的期刊）不显示 AJR，即没有得分、评级或生命周期阶段，其引文表现由 PNCI、PCS 与引文排名体现。
      </p>
      <h2 id="evidence">证据来源</h2>
      <p>编辑治理、科研诚信与透明度依据公开证据评级，按以下顺序采用：</p>
      <ul>
        <li><strong>期刊自身网站</strong>：其政策页面，在每月运行中收集。</li>
        <li>
          <strong>出版商统一政策</strong>：若出版商声明某项政策（出版伦理、更正、作者署名、利益冲突、AI 使用、数据、相似度检测、研究伦理、投诉、版权、所有权、广告）适用于其所有期刊，且 POSI 已核实该页面，则期刊沿用该政策。编委会、同行评议流程、获取模式与费用等期刊专属事项从不沿用。
        </li>
        <li>
          <strong>期刊自身的 Crossref 记录</strong>：在近三年出版的最新文章中（最多 100 篇，至少 20 篇），若至少一半带有已出版文章的许可信息，即视为其版权与许可条款的证据；若至少一半带有 Crossmark 更新政策，即视为其更正与撤稿政策。单篇文章中的声明（评审日期、利益冲突、数据可用性）不视为期刊政策。
        </li>
      </ul>
      <p>
        后一来源只补充前一来源无法确定的内容，从不覆盖期刊网站所显示的信息。无法访问的证据不计为期刊的不利因素。此即证据覆盖规则 EC-1.1，自 2026 年 10 月（10 月 7 日）重新评级起由 AJR-E-1.2 与 AJR-M-1.2 采用。
      </p>
      <h2 id="scale">评级标尺</h2>
      <p>所有 AJR 评级均按同一张表由 AJR 得分换算：</p>
      <AjrRatingScale locale="zh-Hans" />
      <p>
        示例：AJR-E 85.72 / 100 为评级 A；AJR-M 82.64 / 100 为评级 A−。评级不是分区，也不与同学科其他期刊相比较。此前发布的 E-Q 与 M-Q 分区已撤回，不会换算为评级。
      </p>
      <h2 id="lifecycle">生命周期</h2>
      <ul>
        <li><strong>观察期</strong>：首次出版后 0–11 个月，不评分。</li>
        <li><strong>AJR-E</strong>，早期期刊评级：12–59 个月。</li>
        <li><strong>AJR-M</strong>，成熟期刊评级：60 个月及以上。</li>
      </ul>
      <p>
        期刊所处的生命周期阶段不决定其引文排名；引文排名依据期刊在其 PSC 类别内的 PNCI 计算（见<Link href={L('/methodology/#ranking')}>评价方法</Link>）。
      </p>
      <h2 id="updates">更新</h2>
      <p>
        核心合集期刊每月 7 日重新评级。每次运行都会重新从期刊网站、其 Crossref 记录与 OpenAlex 收集证据，并按评级日期计算生命周期阶段，因此期刊在满 12 个月时由观察期进入 AJR-E，满 60 个月时进入 AJR-M，无需等待复核。某次运行中无法访问的证据不计为期刊的不利因素，而是沿用此前的证据。每项评级均注明日期与模型版本。
      </p>
    </>
  )
}
