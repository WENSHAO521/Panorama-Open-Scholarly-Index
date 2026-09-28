import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { RANKING_SNAPSHOT, RANKING_VERSION, PNCI_VERSION, ZONES_EDITION_VERSION, EVALUATION_EDITION_VERSION, getRankings } from '@/lib/rankings'
import {
  AJR_RATING_SCALE, AJR_DISCLAIMER, PCS_DISCLAIMER, PQF_DISCLAIMER, PQF_STATUS_BANDS, PQF_STATUS_LABEL, RANKING_BASIS, RANKING_THRESHOLDS,
  ajrRatingRange,
} from '@/lib/evaluation/rules'
import { ZONE_METHOD, ZONE_SHARE, fmtSnapshot } from '@/lib/evaluation/display'

export const metadata = {
  title: 'Methodology',
  description: 'The POSI Journal Evaluation Architecture: PQF Core Collection eligibility, AJR lifecycle ratings, the PCI, PNCI and PCS citation indicators, and the PNCI-based Citation Ranking with Citation Quartiles and POSI Zones.',
  alternates: { canonical: '/methodology/' },
}

const CONTENTS = [
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

export default function MethodologyPage() {
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

      <nav aria-label="On this page" className="mb-10 max-w-[760px]">
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[14px] list-decimal pl-5" style={{ color: 'var(--muted)' }}>
          {CONTENTS.map(([id, label]) => <li key={id}><a href={`#${id}`} className="hover:underline" style={{ color: 'var(--teal)' }}>{label}</a></li>)}
        </ol>
      </nav>

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
          <p>AJR evaluates a journal by lifecycle stage, counted in months since its first publication:</p>
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
            compared across fields.
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
            <code>PCS-1.0</code>. <strong>{PCS_DISCLAIMER}</strong>
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
                  ['AJR', 'AJR-E-1.1, AJR-M-1.0, rating scale AJR-RATING-1.0'],
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
