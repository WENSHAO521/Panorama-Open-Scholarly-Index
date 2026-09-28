import Link from 'next/link'
import { getDirectory } from '@/lib/global-journals'
import { getCoreCollection, PSG_JOURNALS } from '@/lib/data'
import { getRankings, RANKING_AVAILABLE } from '@/lib/rankings'
import { PageHeader, fmt } from '@/components/db'

export const metadata = {
  title: 'About POSI',
  description: 'The Panorama Open Scholarly Index is a citation index and journal directory published by Panorama Scholarly Group Ltd.',
  alternates: { canonical: '/about/' },
}

export default function AboutPage() {
  const indexed = getDirectory().records.length
  const core = getCoreCollection().length
  const { ranked } = getRankings()
  const psg = PSG_JOURNALS.length

  return (
    <div className="pb-12">
      <PageHeader title="About POSI" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About' }]}>
        <p className="max-w-[68ch]">
          The Panorama Open Scholarly Index (POSI) is a citation index and journal directory published by
          Panorama Scholarly Group Ltd. It covers every scholarly journal registered with Crossref or described
          by OpenAlex, certifies journals for its Core Collection after editorial evaluation, rates their lifecycle
          development (AJR), and ranks journals by PNCI within subject categories.
        </p>
      </PageHeader>

      <dl className="stat-strip grid-cols-2 lg:grid-cols-4 max-w-[900px]">
        {[
          ['Indexed journals', fmt(indexed)],
          ['Core Collection', fmt(core)],
          ['Ranked journals', RANKING_AVAILABLE ? fmt(ranked.length) : 'Pending'],
          ['Publications', 'Over 300 million'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mt-1 figure text-[22px]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="doc mt-12">
        <section aria-labelledby="provides">
          <h2 id="provides">What POSI provides</h2>
          <ul>
            <li><Link href="/publications/">Publication search</Link> across more than 300 million works, with citation export and open access links.</li>
            <li>A <Link href="/journals/">journal directory</Link> of every indexed journal, with a profile page for each: identifiers, output and citations per year, subject, topics and ranking.</li>
            <li>The <Link href="/core-collection/">Core Collection</Link>: journals that applied for certification and passed editorial evaluation.</li>
            <li><Link href="/rankings/">Journal rankings</Link> by PNCI within subject categories, with citation ranks, percentiles, Citation Quartiles (C-Q1 to C-Q4) and POSI Zones.</li>
            <li><Link href="/certificate/">Certificates of indexing</Link> for authors, verifiable by anyone.</li>
            <li><Link href="/datasets/">Data downloads</Link> of the directory, rankings and records.</li>
          </ul>
        </section>

        <section aria-labelledby="coverage">
          <h2 id="coverage">Coverage</h2>
          <p>
            POSI indexes journals, not individual submissions. A journal is included when it has an ISSN and is
            registered with Crossref or described by OpenAlex. Indexed journals appear in the directory and, when their
            citation data meet the minimum requirements, in the Citation Rankings. The Core Collection is a separate tier that a journal enters only by applying for
            certification. The rules are set out in the <Link href="/editorial-policy/">editorial policy</Link>.
          </p>
          <p>
            Metadata is taken from Crossref and OpenAlex and refreshed daily. Rankings are recomputed each
            indexing cycle under a versioned methodology, described in <Link href="/methodology/">methodology</Link>.
          </p>
        </section>

        <section aria-labelledby="independence">
          <h2 id="independence">Independence</h2>
          <p>
            POSI is independent of Web of Science, Scopus and DOAJ. Listing in those or any other services does not
            determine inclusion in POSI, admission to the Core Collection, or any score or ranking. Rankings are
            produced by versioned calculation code. No publisher, editor, sponsor or member of staff can change a
            published result by hand.
          </p>
        </section>

        <section aria-labelledby="coi">
          <h2 id="coi">Conflict of interest</h2>
          <p>
            Panorama Scholarly Group Ltd. publishes POSI and also publishes journals.{' '}
            {psg} of the {core} Core Collection journals are published by Panorama Scholarly Group. These journals
            are evaluated under the same criteria as every other journal. Readers should take this relationship into
            account. The affected journals are listed in the <Link href="/coi/">conflict of interest disclosure</Link>.
          </p>
        </section>

        <section aria-labelledby="licensing">
          <h2 id="licensing">Licensing</h2>
          <p>
            POSI is open source. POSI data is published under CC BY 4.0 and the software under the MIT License.
            Third-party metadata keeps its original license: OpenAlex data is CC0, and Crossref metadata is
            provided without restriction.
          </p>
        </section>

        <section aria-labelledby="publisher">
          <h2 id="publisher">Publisher</h2>
          <address className="not-italic mt-3 panel p-4 text-[14.5px] leading-relaxed">
            <strong style={{ color: 'var(--ink)' }}>Panorama Scholarly Group Ltd.</strong><br />
            Room 1508, 15/F., Office Tower Two, Grand Plaza<br />
            625 Nathan Road, Kowloon, Hong Kong SAR<br />
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
          </address>
          <p>
            Enquiries are acknowledged within two to three business days. Certification reviews take ten to twenty
            business days. See <Link href="/contact/">contact</Link> for the right subject line for each request.
          </p>
        </section>

        <section aria-labelledby="use">
          <h2 id="use">Appropriate use</h2>
          <p>
            Journal rankings describe journals, not the quality of individual articles or researchers. They should
            not be the sole basis for hiring, promotion or funding decisions. See{' '}
            <Link href="/responsible-use/">responsible use</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
