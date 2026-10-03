// Shared body of the AJR pages (/ratings/, /ratings/early-stage/, /ratings/mature/).
import Link from 'next/link'
import { AJR_DISCLAIMER, AJR_RATING_SCALE, ajrRatingRange } from '@/lib/evaluation/rules'

export function AjrRatingScale() {
  return (
    <div className="panel overflow-x-auto max-w-[420px]">
      <table className="dtable">
        <thead><tr><th>AJR Score</th><th>AJR Rating</th></tr></thead>
        <tbody>{AJR_RATING_SCALE.map(([r]) => <tr key={r}><td className="font-mono text-[13px]">{ajrRatingRange(r)}</td><td className="font-medium">Rating {r}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export function AjrCommon() {
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
          complaints, fees, copyright, ownership, advertising) covers all its journals and POSI has verified that page,
          the journal inherits it. Journal-specific items such as the editorial board, peer-review process and access
          model never do.
        </li>
        <li>
          <strong>The journal&rsquo;s own Crossref records</strong>: when most of its recent articles carry a license, a
          Crossmark correction policy, received and accepted dates, or conflict-of-interest and data-availability
          statements, that counts as evidence of the matching practice.
        </li>
      </ul>
      <p>
        A later source only fills what an earlier one could not resolve; it never overrides what the journal&rsquo;s
        website shows. Evidence that cannot be reached is not counted against the journal. This is Evidence Coverage
        EC-1.1, used by AJR-E-1.2 and AJR-M-1.2 from the November 2026 rerate.
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
