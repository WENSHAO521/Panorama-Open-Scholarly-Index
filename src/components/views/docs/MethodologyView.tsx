// /methodology/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader, OnThisPage } from '@/components/db'
import { RANKING_SNAPSHOT, RANKING_VERSION, PNCI_VERSION, ZONES_EDITION_VERSION, EVALUATION_EDITION_VERSION, getRankings } from '@/lib/rankings'
import {
  AJR_RATING_SCALE, AJR_DISCLAIMER, PCS_DISCLAIMER, PQF_DISCLAIMER, PQF_STATUS_BANDS, PQF_STATUS_LABEL, RANKING_BASIS, RANKING_THRESHOLDS,
  ajrRatingRange,
} from '@/lib/evaluation/rules'
import { ZONE_METHOD, ZONE_SHARE, fmtSnapshot } from '@/lib/evaluation/display'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { formatMonth } from '@/i18n/format'

const EN_META = {
  title: 'Methodology',
  description: 'The POSI Journal Evaluation Architecture: PQF Core Collection eligibility, AJR lifecycle ratings, the PCI, PNCI and PCS citation indicators, and the PNCI-based Citation Ranking with Citation Quartiles and POSI Zones.',
  alternates: { canonical: '/methodology/' },
}

const CONTENTS: [string, string][] = [
  ['architecture', 'POSI Evaluation Architecture'],
  ['pqf', 'Core Collection Eligibility — PQF'],
  ['ajr', 'Journal Lifecycle Evaluation — AJR'],
  ['indicators', 'Citation Indicators'],
  ['ranking', 'Citation Ranking Method'],
  ['percentiles', 'Citation Percentiles'],
  ['quartiles', 'Citation Quartiles'],
  ['zones', 'POSI Zones'],
  ['minimum', 'Minimum Data Requirements'],
  ['ties', 'Ties'],
  ['provisional', 'Provisional Rankings'],
  ['subjects', 'Category Assignment'],
  ['snapshots', 'Ranking Snapshots'],
  ['versions', 'Versioning'],
  ['limitations', 'Limitations'],
]

function En() {
  const { year } = getRankings()
  const t = RANKING_THRESHOLDS
  return (
    <div className="pb-12">
      <PageHeader title="Methodology" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Methodology' }]}>
        <p className="max-w-[70ch]">
          How POSI evaluates journals: Core Collection eligibility, lifecycle ratings, citation indicators, and the
          subject-level Citation Ranking with its quartiles and zones. Formulas, thresholds and versions are published
          here; journal pages show results only.
        </p>
      </PageHeader>

      <OnThisPage items={CONTENTS} />

      <div className="doc">
        <section aria-labelledby="architecture">
          <h2 id="architecture">1. POSI Evaluation Architecture</h2>
          <p>
            POSI evaluates a journal in five separate layers (<code>{EVALUATION_EDITION_VERSION}</code>). Each answers one
            question and has its own vocabulary; no layer feeds or relabels another.
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Layer</th><th>Question</th><th>Published as</th></tr></thead>
              <tbody>
                <tr><td className="font-medium whitespace-nowrap">PQF</td><td className="text-[13.5px]">Can the journal enter, or remain in, the Core Collection?</td><td className="text-[13.5px]">Score 0–100 and an eligibility status</td></tr>
                <tr><td className="font-medium whitespace-nowrap">AJR</td><td className="text-[13.5px]">How strong is the journal&rsquo;s lifecycle and publishing-development profile?</td><td className="text-[13.5px]">AJR Score 0–100 and AJR Rating A+ to D</td></tr>
                <tr><td className="font-medium whitespace-nowrap">PCI, PNCI, PCS</td><td className="text-[13.5px]">What does citation evidence show?</td><td className="text-[13.5px]">Citation indicators</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Citation Ranking</td><td className="text-[13.5px]">Where does the journal rank within its PSC category?</td><td className="text-[13.5px]">Citation Rank, Citation Percentile, Citation Quartile C-Q1 to C-Q4, from PNCI</td></tr>
                <tr><td className="font-medium whitespace-nowrap">POSI Zones</td><td className="text-[13.5px]">POSI&rsquo;s selective grouping of the same ranking</td><td className="text-[13.5px]">Zone 1 to Zone 4, from the same percentile</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            PQF is not a ranking. AJR is not a quartile. PCS does not decide any rank. PNCI is the metric of the
            official subject rankings; the Citation Quartile is the standard 25-point grouping of its percentile, and
            the POSI Zone a selective grouping of the same percentile. Q1–Q4 are used for the Citation Quartile only,
            shown as C-Q1 to C-Q4.
          </p>
        </section>

        <section aria-labelledby="pqf">
          <h2 id="pqf">2. Core Collection Eligibility — PQF</h2>
          <p>
            The POSI Quality Framework scores six factors from 100 points (transparency, metadata quality, editorial
            governance, technical discoverability, citation visibility, research integrity; see the{' '}
            <Link href="/pqf/">PQF page</Link> and the <Link href="/editorial-policy/#certification">editorial policy</Link>).
            Its result is an eligibility status:
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>PQF score</th><th>Status</th></tr></thead>
              <tbody>
                {PQF_STATUS_BANDS.map(([s, min], i) => (
                  <tr key={s}><td className="font-mono text-[13px] whitespace-nowrap">{i === 0 ? `≥ ${min}` : min === 0 ? `< ${PQF_STATUS_BANDS[i - 1][1]}` : `${min}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`}</td><td>{PQF_STATUS_LABEL[s]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p><strong>{PQF_DISCLAIMER}</strong> PQF may be used as a filter (for example PQF ≥ 70); it is never a sort order for journals.</p>
        </section>

        <section aria-labelledby="ajr">
          <h2 id="ajr">3. Journal Lifecycle Evaluation — AJR</h2>
          <p>
            AJR evaluates a journal by lifecycle stage, counted in months since its first publication. It is published for
            Core Collection journals only; other journals show no AJR.
          </p>
          <ul>
            <li><strong>Observation</strong>, 0–11 months: too early to rate; no score.</li>
            <li><strong>AJR-E</strong> (Early-stage Journal Rating), 12–59 months.</li>
            <li><strong>AJR-M</strong> (Mature Journal Rating), 60 months or more.</li>
          </ul>
          <p>Each model gives an AJR Score from 0 to 100 and an AJR Rating:</p>
          <div className="panel overflow-x-auto max-w-[420px]">
            <table className="dtable">
              <thead><tr><th>AJR Score</th><th>AJR Rating</th></tr></thead>
              <tbody>{AJR_RATING_SCALE.map(([r]) => <tr key={r}><td className="font-mono text-[13px]">{ajrRatingRange(r)}</td><td className="font-medium">{r}</td></tr>)}</tbody>
            </table>
          </div>
          <p>
            <strong>{AJR_DISCLAIMER}</strong> The rating is read from the score alone. Earlier E-Q and M-Q quartiles are
            withdrawn and are never converted into ratings. See <Link href="/ratings/">AJR ratings</Link>.
          </p>
        </section>

        <section aria-labelledby="indicators">
          <h2 id="indicators">4. Citation Indicators</h2>
          <h3 id="pci">PCI — POSI Citation Impact</h3>
          <p>
            The source citation performance indicator: citations to a journal&rsquo;s citable items from a two-year
            publication window, per item, from OpenAlex (<code>PCI-1.0</code>). PCI is not normalized by field and is not
            compared across fields. PCI is a Core Collection indicator: it is reported for Core Collection journals only,
            and indexed journals have none.
          </p>
          <h3 id="pnci">PNCI — POSI Normalized Citation Indicator</h3>
          <p>The primary ranking metric. Each eligible item&rsquo;s citations are divided by the expected citations of items like it:</p>
          <p className="formula">PNCI = (1 / n) × Σ C<sub>i</sub> / E(field<sub>i</sub>, year<sub>i</sub>, type<sub>i</sub>)</p>
          <ul>
            <li><em>C<sub>i</sub></em>: citations to item <em>i</em>; <em>n</em>: the journal&rsquo;s eligible items.</li>
            <li><em>E</em>: the mean citations of all eligible items of the same PSC field, publication year and document type. Where that group has fewer than 50 items, the field and publication year are used.</li>
            <li>1.00 is the average of the comparison group; above 1 is above it, below 1 below it.</li>
            <li>Items: the citable items of the four complete years before the metric year, with Crossref citation counts (<code>{PNCI_VERSION}</code>).</li>
          </ul>
          <h3 id="pcs">PCS — POSI Citation Score</h3>
          <p>
            A supplementary independent citation indicator: the mean Crossref citations of a journal&rsquo;s citable
            items from the four complete years before the metric year (for {year}: {year - 4} to {year - 1}),{' '}
            <code>PCS-1.0</code>. A journal with no works in Crossref (its DOIs are registered with DataCite, as for
            journals on Zenodo) is computed from DataCite&rsquo;s records and citation counts instead; its PCS states that
            source and is not directly comparable with a Crossref-based one. <strong>{PCS_DISCLAIMER}</strong>
          </p>
          <p>
            PCI, PNCI and PCS are shown side by side and are never averaged. Total citations are descriptive and never
            decide a rank. More on each indicator on the <Link href="/pci/">citation indicators</Link> page.
          </p>
        </section>

        <section aria-labelledby="ranking">
          <h2 id="ranking">5. Citation Ranking Method</h2>
          <p><strong>{RANKING_BASIS}</strong></p>
          <ol>
            <li>The cohort is the journals of one PSC category that meet the minimum data requirements (§ 9). Categories are never pooled.</li>
            <li>Journals are ordered by PNCI, highest first, on unrounded values.</li>
            <li>The Citation Rank is the position in that order; tied journals share it (§ 10).</li>
          </ol>
        </section>

        <section aria-labelledby="percentiles">
          <h2 id="percentiles">6. Citation Percentiles</h2>
          <p>For a group of tied journals occupying positions <em>r</em><sub>start</sub> to <em>r</em><sub>end</sub> in a cohort of <em>N</em>:</p>
          <p className="formula">r<sub>mid</sub> = (r<sub>start</sub> + r<sub>end</sub>) / 2 &nbsp;&nbsp; percentile = 100 × (N − r<sub>mid</sub> + 0.5) / N</p>
          <p>Percentiles are stored at full precision, limited to 0–100, and shown with one decimal.</p>
        </section>

        <section aria-labelledby="quartiles">
          <h2 id="quartiles">7. Citation Quartiles</h2>
          <div className="panel overflow-x-auto max-w-[420px]">
            <table className="dtable">
              <thead><tr><th>Percentile</th><th>Citation Quartile</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[13px]">≥ 75</td><td>C-Q1</td></tr>
                <tr><td className="font-mono text-[13px]">50 to &lt; 75</td><td>C-Q2</td></tr>
                <tr><td className="font-mono text-[13px]">25 to &lt; 50</td><td>C-Q3</td></tr>
                <tr><td className="font-mono text-[13px]">&lt; 25</td><td>C-Q4</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            The C stands for Citation, so that POSI quartiles are not confused with those of other services. Quartiles
            follow the percentile, so they do not always hold exactly 25% of a category.
          </p>
        </section>

        <section aria-labelledby="zones">
          <h2 id="zones">8. POSI Zones</h2>
          <p>POSI Zones (POSI 分区) read the same percentile, counted from the top of the ranking:</p>
          <div className="panel overflow-x-auto max-w-[560px]">
            <table className="dtable">
              <thead><tr><th>Percentile</th><th>Zone</th><th>Share of the ranking</th></tr></thead>
              <tbody>
                {([[1, '≥ 95'], [2, '80 to < 95'], [3, '50 to < 80'], [4, '< 50']] as const).map(([z, p]) => (
                  <tr key={z}><td className="font-mono text-[13px]">{p}</td><td className="font-medium">Zone {z} · {ZONE_SHARE[z]}</td><td className="text-[13.5px]">{ZONE_METHOD[z]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Zones are independent of the quartile: a C-Q1 journal can be in Zone 1, 2 or 3. Official zones need a category
            of at least {t.categoryOfficialZone} ranked journals (§ 9). Rule <code>{ZONES_EDITION_VERSION}</code>; the
            earlier PCS-based trial (<code>POSI-ZONES-1.0</code>) is withdrawn.
          </p>
        </section>

        <section aria-labelledby="minimum">
          <h2 id="minimum">9. Minimum Data Requirements</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Requirement</th><th>Official</th><th>Otherwise</th></tr></thead>
              <tbody>
                <tr><td>Eligible citable items</td><td className="text-[13.5px]">{t.officialItems} or more, from at least {t.officialPublicationYears} publication years</td><td className="text-[13.5px]">{t.provisionalItems}–{t.officialItems - 1} items or a single year: provisional. Fewer than {t.provisionalItems}: insufficient data (observation period for journals under 12 months)</td></tr>
                <tr><td>Citation coverage</td><td className="text-[13.5px]">Citation data retrieved for at least {t.minCoverage * 100}% of eligible items</td><td className="text-[13.5px]">Incomplete citation coverage: not ranked</td></tr>
                <tr><td>PSC category</td><td className="text-[13.5px]">High-confidence or editor-confirmed, not multidisciplinary</td><td className="text-[13.5px]">PNCI shown, not ranked</td></tr>
              </tbody>
            </table>
          </div>
          <p>What a category publishes depends on its number of ranked journals, <em>N</em>:</p>
          <div className="panel overflow-x-auto max-w-[620px]">
            <table className="dtable">
              <thead><tr><th>N</th><th>Rank, percentile, Citation Quartile</th><th>POSI Zone</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[13px]">≥ {t.categoryOfficialZone}</td><td>Yes</td><td>Official</td></tr>
                <tr><td className="font-mono text-[13px]">{t.categoryProvisionalZone}–{t.categoryOfficialZone - 1}</td><td>Yes</td><td>Provisional</td></tr>
                <tr><td className="font-mono text-[13px]">{t.categoryQuartile}–{t.categoryProvisionalZone - 1}</td><td>Yes</td><td>None</td></tr>
                <tr><td className="font-mono text-[13px]">&lt; {t.categoryQuartile}</td><td>No (PNCI only): Insufficient Category Size</td><td>None</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            A journal&rsquo;s age does not decide its Citation Ranking: a young journal is ranked once it meets these
            requirements, and its lifecycle stage is shown beside it.
          </p>
        </section>

        <section aria-labelledby="ties">
          <h2 id="ties">10. Ties</h2>
          <p>
            Journals with the same PNCI share the same rank (1, 2, 2, 4), the same mid-rank percentile, and therefore the
            same quartile and zone. Ties are never broken by title, ISSN, date or record id.
          </p>
        </section>

        <section aria-labelledby="provisional">
          <h2 id="provisional">11. Provisional Rankings</h2>
          <p>
            A provisional ranking ({t.provisionalItems}–{t.officialItems - 1} eligible items, or items from a single
            publication year) has a rank, percentile and quartile marked &ldquo;Provisional&rdquo; (for example Provisional
            C-Q2) and no zone. Provisional journals keep their place in the category, so the percentiles of official
            journals do not depend on whether they are shown.
          </p>
        </section>

        <section aria-labelledby="subjects">
          <h2 id="subjects">12. Category Assignment</h2>
          <p>
            Each journal is assigned one primary category of the <Link href="/subjects/">POSI Subject Classification</Link>{' '}
            (PSC): 42 categories in six domains, computed from the journal&rsquo;s OpenAlex topics through a fixed crosswalk.
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Assignment</th><th>Rule</th><th>Ranked</th></tr></thead>
              <tbody>
                <tr><td className="font-medium whitespace-nowrap">High confidence</td><td className="text-[13.5px]">The leading category holds at least 35% of the journal&rsquo;s topic mass, at least 1.5 times the next category, and the journal has at least 50 works.</td><td>Yes</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Provisional</td><td className="text-[13.5px]">A category leads, but on fewer than 50 works, or without a clear margin.</td><td>No</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Multidisciplinary</td><td className="text-[13.5px]">No category and no domain dominates.</td><td>No</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Not classified</td><td className="text-[13.5px]">No topic data.</td><td>No</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            An editor-confirmed primary category takes precedence. Confirmation records whether the classification is
            correct; it never moves a journal to the category where its quartile would be better.
          </p>
        </section>

        <section aria-labelledby="snapshots">
          <h2 id="snapshots">13. Ranking Snapshots</h2>
          <p>
            The journal index is built from Crossref and OpenAlex, merged on ISSN, and refreshed daily. Citations are
            harvested in cycles; each cycle computes PCS and PNCI for every indexed journal and publishes a Citation
            Ranking edition with its snapshot date. Every rank states the snapshot and model that produced it; a
            published edition is never recomputed in place.{' '}
            {RANKING_SNAPSHOT ? <>Current snapshot: {fmtSnapshot(RANKING_SNAPSHOT)} ({RANKING_SNAPSHOT}).</> : <>The first PNCI-1.0 edition has not been published yet.</>}
          </p>
        </section>

        <section aria-labelledby="versions">
          <h2 id="versions">14. Versioning</h2>
          <div className="panel overflow-x-auto max-w-[560px]">
            <table className="dtable">
              <tbody>
                {[
                  ['Evaluation architecture', EVALUATION_EDITION_VERSION],
                  ['Citation ranking', RANKING_VERSION],
                  ['PNCI', PNCI_VERSION],
                  ['POSI Zones', ZONES_EDITION_VERSION],
                  ['AJR', 'AJR-E-1.2, AJR-M-1.2 and Evidence Coverage EC-1.1 from the October 2026 rerate (earlier ratings: AJR-E-1.1; no AJR-M rating was published before), rating scale AJR-RATING-1.0'],
                  ['PQF', 'PQF v1.0'],
                  ['PCI, PCS', 'PCI-1.0, PCS-1.0'],
                  ['Subject crosswalk', 'PSC-CROSSWALK-0.3'],
                ].map(([k, v]) => <tr key={k}><td>{k}</td><td className="font-mono text-[13px]">{v}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p>
            A change to any formula or threshold is a new version, announced in <Link href="/announcements/">news</Link>.
            Retired: the PCS-based quartiles (PCS-Q), the lifecycle quartiles (E-Q, M-Q) and the PCI-based Citation Q.
            For sources and verification see <Link href="/docs/provenance/">provenance</Link>.
          </p>
        </section>

        <section aria-labelledby="limitations">
          <h2 id="limitations">15. Limitations</h2>
          <ul>
            <li>Citation indicators measure citation performance, not every dimension of scholarly quality.</li>
            <li>Citation practices vary across fields.</li>
            <li>PNCI reduces but cannot eliminate all disciplinary and database-coverage differences.</li>
            <li>New or small journals may have unstable estimates. POSI therefore applies minimum sample, coverage, and category-size requirements.</li>
            <li>A ranking describes a journal in one snapshot. It does not assess individual articles or researchers; see <Link href="/responsible-use/">responsible use</Link>.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export function methodologyMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/methodology/', locale) }
}

export function MethodologyView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '评价方法',
  description: 'POSI 期刊评价体系：PQF 核心合集准入资格、AJR 生命周期评级、PCI、PNCI 与 PCS 引文指标，以及基于 PNCI 的引文排名、引文分区与 POSI Zone。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const CONTENTS_ZH: [string, string][] = [
  ['architecture', 'POSI 评价体系'],
  ['pqf', '核心合集准入资格：PQF'],
  ['ajr', '期刊生命周期评价：AJR'],
  ['indicators', '引文指标'],
  ['ranking', '引文排名方法'],
  ['percentiles', '引文百分位'],
  ['quartiles', '引文分区'],
  ['zones', 'POSI Zone'],
  ['minimum', '最低数据要求'],
  ['ties', '并列'],
  ['provisional', '暂定排名'],
  ['subjects', '类别归属'],
  ['snapshots', '排名快照'],
  ['versions', '版本管理'],
  ['limitations', '局限性'],
]

const STATUS_ZH: Record<string, string> = { eligible: '符合条件', review_required: '需复核', insufficient_evidence: '证据不足', not_eligible: '不符合条件' }
const ZONE_SHARE_ZH: Record<number, string> = { 1: '前 5%', 2: '前 5%–20%', 3: '前 20%–50%', 4: '后 50%' }
const ZONE_METHOD_ZH: Record<number, string> = { 1: '前 5%', 2: '自顶部起第 5 至第 20 百分位', 3: '自顶部起第 20 至第 50 百分位', 4: '后 50%' }

function Zh() {
  const { year } = getRankings()
  const t = RANKING_THRESHOLDS
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="评价方法" crumbs={[{ label: 'POSI', href: L('/') }, { label: '关于', href: L('/about/') }, { label: '评价方法' }]}>
        <p className="max-w-[70ch]">
          POSI 如何评价期刊：核心合集准入资格、生命周期评级、引文指标，以及学科层面的引文排名及其分区与 Zone。公式、阈值与版本均在本页公布；期刊页面只显示结果。
        </p>
      </PageHeader>

      <OnThisPage items={CONTENTS_ZH} locale="zh-Hans" />

      <div className="doc">
        <section aria-labelledby="architecture">
          <h2 id="architecture">1. POSI 评价体系</h2>
          <p>
            POSI 从五个相互独立的层面评价期刊（<code>{EVALUATION_EDITION_VERSION}</code>）。每一层只回答一个问题，并使用各自的术语；任何一层都不为另一层提供输入，也不改变另一层的标签。
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>层面</th><th>问题</th><th>发布形式</th></tr></thead>
              <tbody>
                <tr><td className="font-medium whitespace-nowrap">PQF</td><td className="text-[13.5px]">期刊能否进入或继续保留在核心合集中？</td><td className="text-[13.5px]">0–100 分的得分及准入资格状态</td></tr>
                <tr><td className="font-medium whitespace-nowrap">AJR</td><td className="text-[13.5px]">期刊的生命周期与出版发展状况如何？</td><td className="text-[13.5px]">0–100 分的 AJR 得分及 A+ 至 D 的 AJR 评级</td></tr>
                <tr><td className="font-medium whitespace-nowrap">PCI、PNCI、PCS</td><td className="text-[13.5px]">引文证据显示了什么？</td><td className="text-[13.5px]">引文指标</td></tr>
                <tr><td className="font-medium whitespace-nowrap">引文排名</td><td className="text-[13.5px]">期刊在其 PSC 类别中排名如何？</td><td className="text-[13.5px]">依据 PNCI 得出的引文排名、引文百分位、引文分区 C-Q1 至 C-Q4</td></tr>
                <tr><td className="font-medium whitespace-nowrap">POSI Zone</td><td className="text-[13.5px]">POSI 对同一排名的精选分组</td><td className="text-[13.5px]">依据同一百分位划分的 Zone 1 至 Zone 4</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            PQF 不是排名。AJR 不是分区。PCS 不决定任何排名。PNCI 是官方学科排名所用的指标；引文分区是对其百分位按每 25 个百分点所作的标准分组，POSI Zone 则是对同一百分位的精选分组。Q1–Q4 仅用于引文分区，显示为 C-Q1 至 C-Q4。
          </p>
        </section>

        <section aria-labelledby="pqf">
          <h2 id="pqf">2. 核心合集准入资格：PQF</h2>
          <p>
            POSI 质量框架按六个因子评分，满分 100 分（透明度、元数据质量、编辑治理、技术可发现性、引文可见度、科研诚信；详见 <Link href={L('/pqf/')}>PQF 页面</Link>与<Link href={L('/editorial-policy/#certification')}>编辑政策</Link>）。其结果为一项准入资格状态：
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>PQF 得分</th><th>状态</th></tr></thead>
              <tbody>
                {PQF_STATUS_BANDS.map(([s, min], i) => (
                  <tr key={s}><td className="font-mono text-[13px] whitespace-nowrap">{i === 0 ? `≥ ${min}` : min === 0 ? `< ${PQF_STATUS_BANDS[i - 1][1]}` : `${min}–${(PQF_STATUS_BANDS[i - 1][1] - 0.01).toFixed(2)}`}</td><td>{STATUS_ZH[s]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p><strong>PQF 是资格与质量框架评估，并非引文排名指标，不决定引文分区或 POSI Zone。</strong>PQF 可用作筛选条件（例如 PQF ≥ 70），但从不作为期刊的排序依据。</p>
        </section>

        <section aria-labelledby="ajr">
          <h2 id="ajr">3. 期刊生命周期评价：AJR</h2>
          <p>
            AJR 按生命周期阶段评价期刊，阶段以首次出版以来的月数计算。AJR 仅对核心合集期刊发布，其他期刊不显示 AJR。
          </p>
          <ul>
            <li><strong>观察期</strong>，0–11 个月：时间过短，不予评级，无得分。</li>
            <li><strong>AJR-E</strong>（早期期刊评级），12–59 个月。</li>
            <li><strong>AJR-M</strong>（成熟期刊评级），60 个月及以上。</li>
          </ul>
          <p>每个模型给出 0 至 100 分的 AJR 得分及一项 AJR 评级：</p>
          <div className="panel overflow-x-auto max-w-[420px]">
            <table className="dtable">
              <thead><tr><th>AJR 得分</th><th>AJR 评级</th></tr></thead>
              <tbody>{AJR_RATING_SCALE.map(([r]) => <tr key={r}><td className="font-mono text-[13px]">{ajrRatingRange(r)}</td><td className="font-medium">{r}</td></tr>)}</tbody>
            </table>
          </div>
          <p>
            <strong>AJR 评级是依据期刊生命周期给出的绝对评级，并非引文分区，不应解读为学科内的相对排名。</strong>评级仅由得分换算得出。此前的 E-Q 与 M-Q 分区已撤回，从不换算为评级。详见 <Link href={L('/ratings/')}>AJR 评级</Link>。
          </p>
        </section>

        <section aria-labelledby="indicators">
          <h2 id="indicators">4. 引文指标</h2>
          <h3 id="pci">PCI：POSI 引文影响力</h3>
          <p>
            来源引文表现指标：期刊在两年出版窗口内可引文献的篇均被引次数，数据来自 OpenAlex（<code>PCI-1.0</code>）。PCI 未按领域标准化，不作跨领域比较。PCI 是核心合集指标：仅对核心合集期刊报告，收录期刊没有 PCI。
          </p>
          <h3 id="pnci">PNCI：POSI 标准化引文指标</h3>
          <p>主要排名指标。每篇合格文献的被引次数除以同类文献的期望被引次数：</p>
          <p className="formula">PNCI = (1 / n) × Σ C<sub>i</sub> / E(field<sub>i</sub>, year<sub>i</sub>, type<sub>i</sub>)</p>
          <ul>
            <li><em>C<sub>i</sub></em>：文献 <em>i</em> 的被引次数；<em>n</em>：期刊的合格文献数。</li>
            <li><em>E</em>：同一 PSC 领域、同一出版年份、同一文献类型全部合格文献的平均被引次数。该组少于 50 篇时，改用领域与出版年份。</li>
            <li>1.00 为对照组的平均水平；高于 1 表示高于平均，低于 1 表示低于平均。</li>
            <li>文献范围：指标年份之前四个完整年度的可引文献，采用 Crossref 被引次数（<code>{PNCI_VERSION}</code>）。</li>
          </ul>
          <h3 id="pcs">PCS：POSI 引文得分</h3>
          <p>
            一项独立的补充性引文指标：期刊在指标年份之前四个完整年度内（{year} 年为 {year - 4} 至 {year - 1} 年）可引文献的 Crossref 平均被引次数，<code>PCS-1.0</code>。在 Crossref 中没有文献的期刊（其 DOI 在 DataCite 注册，例如托管于 Zenodo 的期刊）改用 DataCite 的记录与被引次数计算，其 PCS 注明该来源，不宜与基于 Crossref 的 PCS 直接比较。<strong>PCS 是补充性引文指标，不决定 POSI 官方引文排名、引文百分位、引文分区或 POSI Zone。</strong>
          </p>
          <p>
            PCI、PNCI 与 PCS 并列展示，从不取平均。总被引次数仅用于描述，从不决定排名。各指标的详细说明见<Link href={L('/pci/')}>引文指标</Link>页面。
          </p>
        </section>

        <section aria-labelledby="ranking">
          <h2 id="ranking">5. 引文排名方法</h2>
          <p><strong>引文分区与 POSI Zone 依据期刊在合格 PSC 类别内的 PNCI 百分位划定。</strong></p>
          <ol>
            <li>参与排名的群组为同一 PSC 类别中满足最低数据要求（§ 9）的期刊。各类别从不合并计算。</li>
            <li>期刊按未经舍入的 PNCI 值由高到低排序。</li>
            <li>引文排名即期刊在该排序中的位置；并列期刊名次相同（§ 10）。</li>
          </ol>
        </section>

        <section aria-labelledby="percentiles">
          <h2 id="percentiles">6. 引文百分位</h2>
          <p>在规模为 <em>N</em> 的群组中，一组并列期刊占据第 <em>r</em><sub>start</sub> 至第 <em>r</em><sub>end</sub> 位时：</p>
          <p className="formula">r<sub>mid</sub> = (r<sub>start</sub> + r<sub>end</sub>) / 2 &nbsp;&nbsp; percentile = 100 × (N − r<sub>mid</sub> + 0.5) / N</p>
          <p>百分位以完整精度存储，限定在 0–100 之间，显示时保留一位小数。</p>
        </section>

        <section aria-labelledby="quartiles">
          <h2 id="quartiles">7. 引文分区</h2>
          <div className="panel overflow-x-auto max-w-[420px]">
            <table className="dtable">
              <thead><tr><th>百分位</th><th>引文分区</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[13px]">≥ 75</td><td>C-Q1</td></tr>
                <tr><td className="font-mono text-[13px]">50 至 &lt; 75</td><td>C-Q2</td></tr>
                <tr><td className="font-mono text-[13px]">25 至 &lt; 50</td><td>C-Q3</td></tr>
                <tr><td className="font-mono text-[13px]">&lt; 25</td><td>C-Q4</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            C 代表 Citation（引文），以免 POSI 分区与其他机构的分区混淆。分区依百分位而定，因此并不总是恰好占类别的 25%。
          </p>
        </section>

        <section aria-labelledby="zones">
          <h2 id="zones">8. POSI Zone</h2>
          <p>POSI Zone（POSI 分区）解读的是同一百分位，从排名顶部起算：</p>
          <div className="panel overflow-x-auto max-w-[560px]">
            <table className="dtable">
              <thead><tr><th>百分位</th><th>Zone</th><th>在排名中的位置</th></tr></thead>
              <tbody>
                {([[1, '≥ 95'], [2, '80 至 < 95'], [3, '50 至 < 80'], [4, '< 50']] as const).map(([z, p]) => (
                  <tr key={z}><td className="font-mono text-[13px]">{p}</td><td className="font-medium">Zone {z} · {ZONE_SHARE_ZH[z]}</td><td className="text-[13.5px]">{ZONE_METHOD_ZH[z]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Zone 独立于分区：C-Q1 期刊可能位于 Zone 1、2 或 3。正式 Zone 要求类别中至少有 {t.categoryOfficialZone} 本已排名期刊（§ 9）。规则版本 <code>{ZONES_EDITION_VERSION}</code>；此前基于 PCS 的试行版本（<code>POSI-ZONES-1.0</code>）已撤回。
          </p>
        </section>

        <section aria-labelledby="minimum">
          <h2 id="minimum">9. 最低数据要求</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>要求</th><th>正式</th><th>否则</th></tr></thead>
              <tbody>
                <tr><td>合格可引文献</td><td className="text-[13.5px]">{t.officialItems} 篇及以上，来自至少 {t.officialPublicationYears} 个出版年份</td><td className="text-[13.5px]">{t.provisionalItems}–{t.officialItems - 1} 篇或仅有一个年份：暂定。少于 {t.provisionalItems} 篇：数据不足（创刊不满 12 个月的期刊处于观察期）</td></tr>
                <tr><td>引文覆盖率</td><td className="text-[13.5px]">至少 {t.minCoverage * 100}% 的合格文献已获取引文数据</td><td className="text-[13.5px]">引文覆盖不完整：不参与排名</td></tr>
                <tr><td>PSC 类别</td><td className="text-[13.5px]">高置信度或经编辑确认，且非多学科</td><td className="text-[13.5px]">显示 PNCI，不参与排名</td></tr>
              </tbody>
            </table>
          </div>
          <p>类别发布的内容取决于其已排名期刊数 <em>N</em>：</p>
          <div className="panel overflow-x-auto max-w-[620px]">
            <table className="dtable">
              <thead><tr><th>N</th><th>排名、百分位、引文分区</th><th>POSI Zone</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[13px]">≥ {t.categoryOfficialZone}</td><td>有</td><td>正式</td></tr>
                <tr><td className="font-mono text-[13px]">{t.categoryProvisionalZone}–{t.categoryOfficialZone - 1}</td><td>有</td><td>暂定</td></tr>
                <tr><td className="font-mono text-[13px]">{t.categoryQuartile}–{t.categoryProvisionalZone - 1}</td><td>有</td><td>无</td></tr>
                <tr><td className="font-mono text-[13px]">&lt; {t.categoryQuartile}</td><td>无（仅 PNCI）：类别规模不足</td><td>无</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            期刊的创刊时间不决定其引文排名：新创办的期刊一旦满足上述要求即参与排名，其生命周期阶段会一并显示。
          </p>
        </section>

        <section aria-labelledby="ties">
          <h2 id="ties">10. 并列</h2>
          <p>
            PNCI 相同的期刊名次相同（1、2、2、4），取相同的中位名次百分位，因此分区与 Zone 也相同。并列从不依据刊名、ISSN、日期或记录 ID 区分先后。
          </p>
        </section>

        <section aria-labelledby="provisional">
          <h2 id="provisional">11. 暂定排名</h2>
          <p>
            暂定排名（{t.provisionalItems}–{t.officialItems - 1} 篇合格文献，或文献仅来自一个出版年份）的名次、百分位与分区均标注为“暂定”（例如暂定 C-Q2），且不划定 Zone。暂定期刊在类别中保留其位置，因此正式期刊的百分位不受暂定期刊是否显示的影响。
          </p>
        </section>

        <section aria-labelledby="subjects">
          <h2 id="subjects">12. 类别归属</h2>
          <p>
            每本期刊被归入 <Link href={L('/subjects/')}>POSI 学科分类</Link>（PSC）中的一个主类别：PSC 共有六大领域、42 个类别，依据期刊的 OpenAlex 主题，通过固定的对照表计算得出。
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>归属</th><th>规则</th><th>参与排名</th></tr></thead>
              <tbody>
                <tr><td className="font-medium whitespace-nowrap">高置信度</td><td className="text-[13.5px]">首位类别至少占期刊主题权重的 35%，且至少为次位类别的 1.5 倍，期刊至少有 50 篇作品。</td><td>是</td></tr>
                <tr><td className="font-medium whitespace-nowrap">暂定</td><td className="text-[13.5px]">有类别居首，但作品少于 50 篇，或领先幅度不明显。</td><td>否</td></tr>
                <tr><td className="font-medium whitespace-nowrap">多学科</td><td className="text-[13.5px]">没有任何类别或领域占主导。</td><td>否</td></tr>
                <tr><td className="font-medium whitespace-nowrap">未分类</td><td className="text-[13.5px]">没有主题数据。</td><td>否</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            经编辑确认的主类别优先。确认只记录分类是否正确，从不将期刊移至能使其分区更好的类别。
          </p>
        </section>

        <section aria-labelledby="snapshots">
          <h2 id="snapshots">13. 排名快照</h2>
          <p>
            期刊索引由 Crossref 与 OpenAlex 数据按 ISSN 合并构建，每日更新。引文数据按周期采集；每个周期为所有收录期刊计算 PCS 与 PNCI，并发布一期注明快照日期的引文排名。每个名次都注明生成它的快照与模型；已发布的版次从不原地重新计算。
            {RANKING_SNAPSHOT ? <>当前快照：{formatMonth('zh-Hans', RANKING_SNAPSHOT)}（{RANKING_SNAPSHOT}）。</> : <>首期 PNCI-1.0 版次尚未发布。</>}
          </p>
        </section>

        <section aria-labelledby="versions">
          <h2 id="versions">14. 版本管理</h2>
          <div className="panel overflow-x-auto max-w-[560px]">
            <table className="dtable">
              <tbody>
                {[
                  ['评价体系', EVALUATION_EDITION_VERSION],
                  ['引文排名', RANKING_VERSION],
                  ['PNCI', PNCI_VERSION],
                  ['POSI Zone', ZONES_EDITION_VERSION],
                  ['AJR', '自 2026 年 10 月重新评级起为 AJR-E-1.2、AJR-M-1.2 与证据覆盖规则 EC-1.1（此前评级：AJR-E-1.1；此前未发布过 AJR-M 评级），评级标尺 AJR-RATING-1.0'],
                  ['PQF', 'PQF v1.0'],
                  ['PCI、PCS', 'PCI-1.0, PCS-1.0'],
                  ['学科对照表', 'PSC-CROSSWALK-0.3'],
                ].map(([k, v]) => <tr key={k}><td>{k}</td><td className="font-mono text-[13px]">{v}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p>
            任何公式或阈值的变更都构成新版本，并在<Link href={L('/announcements/')}>新闻动态</Link>中公布。已停用：基于 PCS 的分区（PCS-Q）、生命周期分区（E-Q、M-Q）以及基于 PCI 的 Citation Q。来源与核验详见<Link href={L('/docs/provenance/')}>数据溯源</Link>。
          </p>
        </section>

        <section aria-labelledby="limitations">
          <h2 id="limitations">15. 局限性</h2>
          <ul>
            <li>引文指标衡量的是引文表现，并不涵盖学术质量的所有维度。</li>
            <li>各领域的引用习惯不同。</li>
            <li>PNCI 能够减小但无法消除所有学科差异与数据库覆盖差异。</li>
            <li>新创办或规模较小的期刊，其估计值可能不稳定，因此 POSI 设有最低样本量、覆盖率与类别规模要求。</li>
            <li>排名描述的是期刊在某一快照中的情况，不评价单篇文章或研究人员；详见<Link href={L('/responsible-use/')}>负责任使用</Link>。</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
