import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { RANKING_VERSION, MIN_ITEMS, MIN_CATEGORY_SIZE, getRankings } from '@/lib/rankings'

export const metadata = {
  title: 'Methodology',
  description: 'How POSI builds its journal index, classifies journals by subject, computes the POSI Citation Score and ranks journals.',
}

const CONTENTS = [
  ['sources', 'Sources and update cycle'],
  ['subjects', 'Subject classification'],
  ['pcs', 'POSI Citation Score (PCS)'],
  ['ranking', 'Ranks, percentiles and quartiles'],
  ['eligibility', 'Ranking eligibility'],
  ['versions', 'Versions'],
]

export default function MethodologyPage() {
  const { year } = getRankings()
  return (
    <div className="pb-12">
      <PageHeader title="Methodology" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Methodology' }]}>
        <p className="max-w-[68ch]">
          How the index is built, how journals are classified by subject, and how the POSI Citation Score and the
          journal rankings are calculated.
        </p>
      </PageHeader>

      <nav aria-label="On this page" className="mb-10 max-w-[760px]">
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[14px] list-decimal pl-5" style={{ color: 'var(--muted)' }}>
          {CONTENTS.map(([id, label]) => <li key={id}><a href={`#${id}`} className="hover:underline" style={{ color: 'var(--teal)' }}>{label}</a></li>)}
        </ol>
      </nav>

      <div className="doc">
        <section aria-labelledby="sources">
          <h2 id="sources">1. Sources and update cycle</h2>
          <p>
            The journal index is built from two registries. OpenAlex describes about 207,000 journals, with their
            topics, output and citation history. Crossref lists about 171,000 journals that register DOIs. The two
            are merged on ISSN: a journal appears once, under its linking ISSN (ISSN-L), whichever registry
            describes it. Journals without an ISSN are left out, because without one a journal cannot be identified
            reliably.
          </p>
          <p>
            Journal metadata is refreshed every day. Rankings are recomputed in cycles: each cycle harvests both
            registries, computes PCS for every indexed journal and publishes a new ranking edition. Publication
            search queries OpenAlex directly, so publication records are always current.
          </p>
        </section>

        <section aria-labelledby="subjects">
          <h2 id="subjects">2. Subject classification</h2>
          <p>
            Each journal is assigned one category of the <Link href="/subjects/">POSI Subject Classification</Link>{' '}
            (PSC): 42 categories in six domains. The assignment is computed from the journal’s OpenAlex topics.
            Each topic is mapped to a PSC category through a fixed crosswalk, and topic counts are summed per
            category.
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Assignment</th><th>Rule</th><th>Ranked by subject</th></tr></thead>
              <tbody>
                <tr><td className="font-medium whitespace-nowrap">High confidence</td><td className="text-[13.5px]">The leading category holds at least 35% of the journal’s topic mass, at least 1.5 times the next category, and the journal has at least 50 works.</td><td>Yes</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Provisional</td><td className="text-[13.5px]">A category leads, but on fewer than 50 works, or without a clear margin over the next category.</td><td>No</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Multidisciplinary</td><td className="text-[13.5px]">No category and no domain dominates, as with Science, Nature or The Lancet. Listed under Multidisciplinary.</td><td>No</td></tr>
                <tr><td className="font-medium whitespace-nowrap">Not classified</td><td className="text-[13.5px]">No topic data, usually a journal registered with Crossref only.</td><td>No</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            A subject editor may confirm a classification. A confirmed classification counts as high confidence.
            Confirmation records whether the classification is correct; it never moves a journal to a category
            where it would rank better.
          </p>
        </section>

        <section aria-labelledby="pcs">
          <h2 id="pcs">3. POSI Citation Score (PCS)</h2>
          <p>
            PCS is the mean number of citations received by a journal’s citable items published in the four
            complete years before the metric year. For the {year} edition, that is items published from {year - 4}{' '}
            to {year - 1}.
          </p>
          <p className="formula">PCS = total citations to eligible items ÷ number of eligible items</p>
          <ul>
            <li>Citations are Crossref’s citation count for each DOI.</li>
            <li>Eligible items are research articles, reviews and other citable document types. Editorials, corrections and similar items are excluded.</li>
            <li>Every eligible item in the window is counted. There is no sampling.</li>
            <li>A work with no citation data is counted separately from a work with zero citations, and reported in the journal’s coverage figure.</li>
          </ul>
          <p>
            Crossref’s citation data depends on what publishers deposit, so coverage varies between publishers and
            fields. PCS is a Crossref-observed citation indicator, not a census of every citation.
          </p>
        </section>

        <section aria-labelledby="ranking">
          <h2 id="ranking">4. Ranks, percentiles and quartiles</h2>
          <p>
            Journals are ranked by PCS in two ways: within their subject category, and across all journals. The
            ranking method is the same in both.
          </p>
          <ol>
            <li>Journals are ordered by PCS, highest first.</li>
            <li>Journals with the same PCS share the mid-point of the positions they occupy.</li>
            <li>The percentile is <code>100 × (N − rank + 0.5) ÷ N</code>, where N is the number of ranked journals.</li>
            <li>The quartile follows from the percentile: PCS-Q1 at 75 or above, PCS-Q2 at 50 or above, PCS-Q3 at 25 or above, otherwise PCS-Q4.</li>
          </ol>
          <p>
            Quartiles are always labelled PCS-Q1 to PCS-Q4, so they cannot be confused with quartiles published by
            other services.
          </p>
        </section>

        <section aria-labelledby="eligibility">
          <h2 id="eligibility">5. Ranking eligibility</h2>
          <p>Core Collection and indexed journals are ranked under the same rules. A journal receives an overall rank when:</p>
          <ul>
            <li>PCS has been computed for the current window;</li>
            <li>it has at least {MIN_ITEMS} eligible items in the window; and</li>
            <li>citation data was retrieved for at least 90% of those items.</li>
          </ul>
          <p>A category rank additionally requires:</p>
          <ul>
            <li>a high-confidence or confirmed subject classification (multidisciplinary journals are ranked overall only); and</li>
            <li>at least {MIN_CATEGORY_SIZE} ranked journals in the category.</li>
          </ul>
          <p>A journal that is not ranked shows the first rule it did not meet on its profile page.</p>
        </section>

        <section aria-labelledby="versions">
          <h2 id="versions">6. Versions</h2>
          <p>
            Every published value carries the methodology version that produced it. The current versions are
            ranking <code>{RANKING_VERSION}</code>, citation score <code>PCS-1.0</code> and subject crosswalk{' '}
            <code>PSC-CROSSWALK-0.3</code>. A change to any formula or threshold is published as a new version and
            announced in <Link href="/announcements/">news</Link>; earlier editions are not recalculated silently.
          </p>
          <p>
            For how records are verified and sourced, see <Link href="/docs/provenance/">provenance and verification</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
