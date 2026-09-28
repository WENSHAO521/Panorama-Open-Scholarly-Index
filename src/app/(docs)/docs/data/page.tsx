import Link from 'next/link'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Data sources and access',
  description: 'Where POSI data comes from, how often it is updated, and how to download and reuse it.',
  alternates: { canonical: '/docs/data/' },
}

const SOURCES = [
  ['Crossref', 'Journal list, ISSNs, DOI counts, article metadata, item-level citation counts for PNCI and PCS, certificate checks', 'Daily'],
  ['OpenAlex', 'Journal profiles, topics, output and citations per year, h-index, open access and DOAJ status, publication search', 'Daily; search is live'],
  ['POSI editorial', 'Core Collection records, PQF evaluations, verified classifications, certification decisions', 'On each decision'],
]

const FORMATS = [
  ['Journal directory', 'CSV per subject category', <Link key="j" href="/journals/">Journals</Link>],
  ['Citation Rankings', 'CSV and JSON per PSC category', <Link key="r" href="/rankings/">Rankings</Link>],
  ['Journal records', 'JSON per record', <Link key="d" href="/datasets/">Data downloads</Link>],
  ['Publication search results', 'CSV, BibTeX and RIS', <Link key="p" href="/publications/">Publications</Link>],
  ['Full data snapshots', 'JSON, versioned', <Link key="s" href="/datasets/">Data downloads</Link>],
]

export default function DataAccessPage() {
  return (
    <div className="pb-12">
      <PageHeader title="Data sources and access" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Data sources and access' }]}>
        <p className="max-w-[68ch]">Where POSI data comes from, how often it changes, and how to download and reuse it.</p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="sources">
          <h2 id="sources">Sources</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Source</th><th>Used for</th><th>Updated</th></tr></thead>
              <tbody>
                {SOURCES.map(([s, u, f]) => (
                  <tr key={s}><td className="font-medium whitespace-nowrap">{s}</td><td className="text-[13.5px]">{u}</td><td className="whitespace-nowrap text-[13.5px]">{f}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Every value on a record names its source. Registry values are shown as the registry states them;
            publisher statements are marked as declared. See <Link href="/docs/provenance/">provenance and verification</Link>.
          </p>
        </section>

        <section aria-labelledby="formats">
          <h2 id="formats">Downloads</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Data</th><th>Format</th><th>Where</th></tr></thead>
              <tbody>
                {FORMATS.map(([d, f, w]) => (
                  <tr key={d as string}><td className="font-medium whitespace-nowrap">{d}</td><td className="text-[13.5px]">{f}</td><td className="text-[13.5px]">{w}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Field definitions are listed in the <Link href="/docs/schema/">record schema</Link>. Every download
            states the methodology version and date it was produced from.
          </p>
        </section>

        <section aria-labelledby="license">
          <h2 id="license">Licence and attribution</h2>
          <p>
            POSI data is published under CC BY 4.0. Please cite it as: <em>Panorama Open Scholarly Index (POSI),
            Panorama Scholarly Group Ltd., accessed [date]</em>. Third-party metadata keeps its original licence:
            OpenAlex data is CC0 and Crossref metadata is available without restriction.
          </p>
        </section>

        <section aria-labelledby="corrections">
          <h2 id="corrections">Corrections</h2>
          <p>
            Registry data is corrected at its source: publishers update Crossref through their member account, and
            OpenAlex accepts corrections through its support form. POSI picks up the change at the next daily
            update. For POSI records and classifications, write to{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
