import Link from 'next/link'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { getAllRecords } from '@/lib/records-data'
import { toIndexRecord, type Collection } from '@/lib/records'
import { DISCOVERED_JOURNALS } from '@/lib/data'
import { getStaticRecordJournals } from '@/lib/records-data'
import { DATA_CUTOFF } from '@/lib/release'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { SnapshotPanel } from '@/components/SnapshotPanel'

export const metadata = {
  title: 'Datasets',
  description: 'Download every POSI file: journal records in JSON and CSV, rankings, the PSC subject classification and the checksummed canonical snapshot.',
}

function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const AUDITS = [
  {
    name: 'Initial journal migration',
    desc: '23,822 legacy source records audited in two independent dry runs with byte-identical output. 171 possible-duplicate groups resolved by live OpenAlex ISSN-L lookups: 166 merged, 5 kept distinct. 23,331 POSI-J ids minted, 0 collisions.',
    href: 'https://github.com/WENSHAO521/posi-data/tree/master/audits/migrations/initial-journal-migration',
  },
  {
    name: 'OpenAlex enrichment',
    desc: 'OpenAlex source id and ISSN-L enrichment over all 23,819 candidate entities (23,674 verified). Superseded by the completed migration above.',
    href: 'https://github.com/WENSHAO521/posi-data/tree/master/audits/migrations/openalex-enrichment',
  },
  {
    name: 'Core and Benchmark identity migration',
    desc: 'Extended permanent ids to the ~1,031 curated Core Collection and Global Benchmark records: 874 newly minted, 157 resolved to existing ids, 0 flagged for manual review.',
    href: 'https://github.com/WENSHAO521/posi-data/pull/3',
  },
]

export default function DatasetsPage() {
  const idx = getAllRecords().map(toIndexRecord)
  const group = (ks: Collection[]) => idx.filter(r => ks.includes(r.k))
  const core = group(['core', 'candidate'])
  const bench = group(['benchmark'])
  const disc = group(['discovered'])

  const files = [
    { path: '/data/index/core.json', alt: '/data/index/core.csv', rows: core.length, bytes: JSON.stringify(core).length, what: 'Core Collection and Candidate records, compact index' },
    { path: '/data/index/benchmark.json', alt: '/data/index/benchmark.csv', rows: bench.length, bytes: JSON.stringify(bench).length, what: 'Global Benchmark curated seed, compact index' },
    { path: '/data/index/discovered.json', alt: '/data/index/discovered.csv', rows: disc.length, bytes: JSON.stringify(disc).length, what: 'Discovered records, compact index' },
    { path: '/data/journal/{code}.json', rows: getStaticRecordJournals().length, bytes: null, what: 'Full record with status and indicators, one file per Core and Benchmark journal' },
    { path: '/data/records/discovered-{a-z,0}.json', rows: DISCOVERED_JOURNALS.length, bytes: JSON.stringify(DISCOVERED_JOURNALS).length, what: 'Full Discovered records, 27 shards by first character of the record key' },
    { path: '/data/meta/psc.json', rows: psc.categories.length, bytes: JSON.stringify(psc).length, what: 'PSC subject taxonomy v' + psc.version },
    { path: '/data/meta/schema.json', rows: null, bytes: null, what: 'Field dictionary and index key map (see Record schema)' },
    { path: '/data/meta/stats.json', rows: null, bytes: null, what: 'Record counts by collection and verification state' },
  ]

  return (
    <div className="wrap">
      <PageHeader title="Datasets" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Datasets' }]}>
        <p className="max-w-[65ch]">
          POSI journal records, rankings and the subject classification are available for download under open
          licenses. Data cutoff <span className="font-mono">{DATA_CUTOFF}</span>.
        </p>
      </PageHeader>

      <div className="space-y-14">
        <section aria-labelledby="site-files">
          <SectionTitle id="site-files">Files on this site</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Index files use short keys, documented in the{' '}
            <Link href="/docs/schema/" className="link">record schema</Link>.
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable min-w-[720px]">
              <thead><tr><th>Path</th><th>Contents</th><th className="text-right">Records</th><th className="text-right">Size</th><th>Formats</th></tr></thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.path}>
                    <td className="font-mono text-[13px] whitespace-nowrap">
                      {f.path.includes('{') ? f.path : <a className="link" href={f.path}>{f.path}</a>}
                    </td>
                    <td className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{f.what}</td>
                    <td className="text-right font-mono tnum text-[13px]">{f.rows === null ? '' : fmt(f.rows)}</td>
                    <td className="text-right font-mono tnum text-[13px]" style={{ color: 'var(--muted)' }}>{f.bytes ? kb(f.bytes) : ''}</td>
                    <td className="text-[13px] whitespace-nowrap">
                      JSON{f.alt && <>, <a className="link" href={f.alt}>CSV</a></>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="canonical">
          <SectionTitle id="canonical">Canonical snapshot</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            The authoritative, immutable copy is published at <span className="font-mono">data.posi.panorama-sg.com</span>.
            Each snapshot records the data and engine versions it was computed from, with SHA-256 checksums.
          </p>
          <SnapshotPanel />
        </section>

        <section aria-labelledby="repos" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <SectionTitle id="repos">Where the data is made</SectionTitle>
            <dl className="space-y-5 text-[14px]">
              {[
                ['posi-data', 'https://github.com/WENSHAO521/posi-data', 'Canonical journal records, PSC taxonomy, metric snapshots and audits. Plain text, versioned, reviewed by pull request.'],
                ['posi-engine', 'https://github.com/WENSHAO521/posi-engine', 'The classifier and calculators. Check out a pinned commit, run it against the pinned data commit, and you should get the published numbers.'],
                ['posi-data-delivery', 'https://github.com/WENSHAO521/posi-data-delivery', 'The public, immutable snapshot mirror this site reads from.'],
              ].map(([name, href, body]) => (
                <div key={name}>
                  <dt>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="font-mono font-medium link inline-flex items-center gap-1">
                      {name} <ArrowSquareOut className="h-3.5 w-3.5" />
                    </a>
                  </dt>
                  <dd className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <SectionTitle>Licenses</SectionTitle>
            <div className="panel overflow-hidden">
              <table className="dtable">
                <tbody>
                  <tr><td>POSI-produced data (PSC, scores, rankings, curated metadata)</td><td className="font-mono whitespace-nowrap">CC BY 4.0</td></tr>
                  <tr><td>Source code of this site and posi-engine</td><td className="font-mono whitespace-nowrap">MIT</td></tr>
                  <tr><td>Upstream metadata (Crossref, OpenAlex, DOAJ, ROR, ORCID)</td><td className="whitespace-nowrap">Source license</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>POSI does not relabel third-party open data as its own.</p>
          </div>
        </section>

        <section aria-labelledby="audits">
          <SectionTitle id="audits">Published audits</SectionTitle>
          <ul className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
            {AUDITS.map(a => (
              <li key={a.name} className="panel p-5 flex flex-col">
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{a.name}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed flex-1" style={{ color: 'var(--muted)' }}>{a.desc}</p>
                <a href={a.href} target="_blank" rel="noopener noreferrer" className="mt-4 link text-[13.5px] inline-flex items-center gap-1">
                  Audit trail <ArrowSquareOut className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cite" className="max-w-[820px]">
          <SectionTitle id="cite">Cite the dataset</SectionTitle>
          <pre className="code whitespace-pre-wrap"><code>{`Panorama Open Scholarly Index (${DATA_CUTOFF.slice(0, 4)}). POSI journal records, data snapshot ${DATA_CUTOFF}. Panorama Scholarly Group. https://posi.panorama-sg.com/datasets/. License: CC BY 4.0.`}</code></pre>
        </section>
      </div>
    </div>
  )
}
