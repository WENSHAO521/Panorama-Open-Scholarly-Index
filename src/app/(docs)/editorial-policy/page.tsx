import Link from 'next/link'
import { PQF_STATUS_BANDS, PQF_STATUS_LABEL, PQF_DISCLAIMER, type PqfStatus } from '@/lib/evaluation/rules'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Editorial policy',
  description: 'How journals are indexed in POSI, how the Core Collection is certified, and how coverage is reviewed, changed and appealed.',
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

export default function EditorialPolicyPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Editorial policy" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Editorial policy' }]}>
        <p className="max-w-[68ch]">
          How journals enter POSI, how the Core Collection is certified, and how coverage is reviewed and changed.
        </p>
      </PageHeader>

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
