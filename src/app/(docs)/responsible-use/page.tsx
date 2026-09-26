import Link from 'next/link'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Responsible use',
  description: 'How POSI journal rankings, certification and data should and should not be used.',
}

export default function ResponsibleUsePage() {
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
            <li>Comparing journals within a subject category by citation performance, using the category rank, percentile and quartile.</li>
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
            <li>Comparing quartiles or scores across subject categories, which differ in citation practice.</li>
            <li>Treating PCS-Q quartiles as equivalent to quartiles published by other services.</li>
            <li>Treating indexing as an endorsement of every article a journal publishes.</li>
          </ul>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits">Known limitations</h2>
          <ul>
            <li>Citation counts come from Crossref and depend on what publishers deposit, so coverage varies between publishers and fields.</li>
            <li>Subject classification is computed from OpenAlex topics. Journals without a clear subject are not ranked by category.</li>
            <li>New journals need four complete years of publications before their citation score is comparable.</li>
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
