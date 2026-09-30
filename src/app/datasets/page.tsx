import Link from 'next/link'
import { getAllRecords, getStaticRecordJournals } from '@/lib/records-data'
import { toIndexRecord, type Collection } from '@/lib/records'
import { DISCOVERED_JOURNALS } from '@/lib/data'
import { getDirectory, getDirectoryCategories, getPublishers } from '@/lib/global-journals'
import { getRankings, RANKING_DOWNLOADS } from '@/lib/rankings'
import { DATA_BASE, dataUrl } from '@/lib/data-base'
import { PUBLISHER_SHARD_COUNT } from '@/lib/publishers'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { PageHeader, SectionTitle, fmt } from '@/components/db'
import { SnapshotPanel } from '@/components/SnapshotPanel'

export const metadata = {
  title: 'Datasets',
  description: 'Download every POSI file: the global journal directory, publishers, rankings, curated journal records in JSON and CSV, the PSC subject classification and the checksummed canonical snapshot.',
  alternates: { canonical: '/datasets/' },
}

function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

interface DataFile { path: string; alt?: string; rows: number | null; bytes: number | null; what: string }

/** Short name shown for a file: its path under the data or rankings folder. */
const fileName = (url: string) => url.replace(`${RANKING_DOWNLOADS}/`, 'rankings/').replace(`${DATA_BASE}/`, '')

function FileTable({ files }: { files: DataFile[] }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="dtable min-w-[720px]">
        <thead><tr><th>Path</th><th>Contents</th><th className="text-right">Records</th><th className="text-right">Size</th><th>Formats</th></tr></thead>
        <tbody>
          {files.map(f => (
            <tr key={f.path}>
              <td className="font-mono text-[13px] whitespace-nowrap">
                {f.path.includes('{') ? fileName(f.path) : <a className="link" href={f.path}>{fileName(f.path)}</a>}
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
  )
}

const AUDIT_BASE = 'https://github.com/WENSHAO521/posi-data/tree/master/audits/'

// Audits published in posi-data, newest first.
const AUDITS = [
  {
    name: 'POSI Journal Evaluation Architecture 1.0', date: '2026-09-28', path: 'migrations/evaluation-architecture-1.0-2026',
    desc: 'AJR Ratings (A+ to D) added from each published AJR score; legacy E-Q/M-Q quartiles, PCS-Q quartiles and PCI Citation Q kept as archive and retired as rankings. Citation Rankings move to PNCI-1.0.',
  },
  {
    name: 'Global index and PCS edition', date: '2026-09-27', path: 'global-index/global-index-2026-09-26',
    desc: 'Every journal registered with Crossref or described by OpenAlex, 158,242 after merging on ISSN; PCS computed from Crossref for each (journals looked up under each of their ISSNs). Its PCS-Q ranks are retired (POSI-EVAL-1.0).',
  },
  {
    name: 'PCS ETL, full scope', date: '2026-08-14', path: 'pcs-etl/pcs-etl-v1-global1024-2026',
    desc: 'POSI Citation Score from Crossref data for 4,320 journals (the 31 Core Collection journals and the full 4,289-journal Global Benchmark): 6.77 million works fetched, PCS computed for 4,089.',
  },
  {
    name: 'AJR-E-1.1 rerate, Core Collection', date: '2026-08-14', path: 'ratings/ajr-e-1.1-rerate-core30-2026',
    desc: 'First run of the Early-Stage rating against all 31 Core Collection journals, combining site-crawl and Crossref article-sample evidence.',
  },
  {
    name: 'Publisher-expansion canonical records', date: '2026-08-13', path: 'migrations/publisher-expansion-canonical-records-2026',
    desc: 'Wrote the 2,177 journal records that the Elsevier and Frontiers expansion had minted ids for, so every registry id resolves to a record.',
  },
  {
    name: 'Citation preview correction', date: '2026-08-13', path: 'migrations/citation-preview-correction-2026',
    desc: 'Withdrew provisional citation quartiles on 3,245 Global Benchmark records and replaced them with a diagnostic-only preview: Benchmark membership alone does not make a journal ranking-eligible.',
  },
  {
    name: 'Elsevier and Frontiers expansion', date: '2026-08-12', path: 'migrations/elsevier-jnlactive-expansion-2026',
    desc: "Global Benchmark grown from 1,000 to 4,289 records from the publishers' own title lists (3,113 Elsevier, 183 Frontiers), with every identity conflict resolved in a second-round re-run.",
  },
  {
    name: 'Core and Benchmark identity remap', date: '2026-08', path: 'migrations/benchmark-identity-remap-2026',
    desc: 'All 1,000 Global Benchmark and 31 Core Collection journals resolved against the 24,205-record registry: 0 new ids, 0 conflicts, 0 left for manual review.',
  },
  {
    name: 'Initial journal migration', date: '2026', path: 'migrations/initial-journal-migration',
    desc: '23,822 legacy source records audited in two independent dry runs with byte-identical output; 171 possible-duplicate groups resolved (166 merged, 5 kept distinct); 23,331 POSI-J ids minted, 0 collisions.',
  },
]

export default function DatasetsPage() {
  const idx = getAllRecords().map(toIndexRecord)
  const group = (ks: Collection[]) => idx.filter(r => ks.includes(r.k))
  const core = group(['core'])
  const bench = group(['benchmark'])
  const disc = group(['discovered', 'curated'])

  const { records: directory, source } = getDirectory()
  const categories = getDirectoryCategories().filter(c => c.count > 0)
  const publishers = getPublishers()
  const { all, ranked, year } = getRankings()

  const global: DataFile[] = [
    { path: dataUrl('journals/index.json'), rows: categories.length, bytes: null, what: 'Global journal directory: totals, and the file list for each subject category' },
    { path: dataUrl('journals/{category}.json'), rows: directory.length, bytes: JSON.stringify(directory).length, what: 'Every indexed journal, one file per PSC category; categories over 4,000 journals are split by first letter' },
    { path: dataUrl('meta/publishers.json'), rows: publishers.length, bytes: JSON.stringify(publishers).length, what: 'Every publisher with indexed journals: journal, Core, open-access and DOAJ counts, and works' },
    { path: `${DATA_BASE}/publishers/{00-${(PUBLISHER_SHARD_COUNT - 1).toString(16)}}.json`, rows: publishers.length, bytes: null, what: `Publisher details with subjects, countries and every journal, in ${PUBLISHER_SHARD_COUNT} hashed shards` },
    { path: `${RANKING_DOWNLOADS}/citation-${year}.json`, alt: `${RANKING_DOWNLOADS}/citation-${year}.csv`, rows: all.length, bytes: null, what: `Citation Ranking ${year} (PNCI-1.0): the edition's versions, snapshot date and thresholds, and the file list per subject category; the CSV has the ${ranked.length.toLocaleString('en-US')} ranked journals` },
    { path: `${RANKING_DOWNLOADS}/citation-${year}-all.csv`, rows: all.length, bytes: null, what: 'Every journal of the Citation Ranking edition, all ranking statuses, as one CSV' },
    { path: `${RANKING_DOWNLOADS}/citation-${year}-{category}.json`, rows: all.length, bytes: null, what: 'PNCI, citation rank, percentile, Citation Quartile, POSI Zone and ranking status per journal, one file per PSC category, with PCI and PCS as descriptive fields' },
  ]

  const curated: DataFile[] = [
    { path: dataUrl('index/core.json'), alt: dataUrl('index/core.csv'), rows: core.length, bytes: JSON.stringify(core).length, what: 'Core Collection records, compact index' },
    { path: dataUrl('index/benchmark.json'), alt: dataUrl('index/benchmark.csv'), rows: bench.length, bytes: JSON.stringify(bench).length, what: 'Global Benchmark curated seed, compact index' },
    { path: dataUrl('index/discovered.json'), alt: dataUrl('index/discovered.csv'), rows: disc.length, bytes: JSON.stringify(disc).length, what: 'Discovered and other curated (not certified) records, compact index' },
    { path: dataUrl('journal/{code}.json'), rows: getStaticRecordJournals().length, bytes: null, what: 'Full record with status and indicators, one file per Core and Benchmark journal' },
    { path: dataUrl('records/discovered-{00-63}.json'), rows: DISCOVERED_JOURNALS.length, bytes: JSON.stringify(DISCOVERED_JOURNALS).length, what: 'Full Discovered records, 64 shards by a hash of the record key' },
    { path: dataUrl('meta/psc.json'), rows: psc.categories.length, bytes: JSON.stringify(psc).length, what: 'PSC subject taxonomy v' + psc.version },
    { path: dataUrl('meta/schema.json'), rows: null, bytes: null, what: 'Field dictionary and index key map (see Record schema)' },
    { path: dataUrl('meta/stats.json'), rows: null, bytes: null, what: 'Record counts by collection and verification state' },
  ]

  return (
    <div className="wrap">
      <PageHeader title="Datasets" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Datasets' }]}>
        <p className="max-w-[65ch]">
          The global journal directory, publishers, rankings, curated journal records and the subject classification,
          under open licences. Every file is regenerated from the current data.
        </p>
      </PageHeader>

      <div className="space-y-14">
        <section aria-labelledby="global-files">
          <SectionTitle id="global-files">Global index</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            {source === 'global'
              ? <>{fmt(directory.length)} journals registered with Crossref or OpenAlex, the {fmt(publishers.length)} publishers behind them, and the ranking edition.</>
              : <>The global corpus was not available for this build, so these files hold the curated records only.</>}
          </p>
          <FileTable files={global} />
        </section>

        <section aria-labelledby="site-files">
          <SectionTitle id="site-files">Curated records</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Records POSI holds with a permanent POSI-J id. Index files use short keys, documented in the{' '}
            <Link href="/docs/schema/" className="link">record schema</Link>.
          </p>
          <FileTable files={curated} />
        </section>

        <section aria-labelledby="canonical">
          <SectionTitle id="canonical">Canonical snapshot</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Each snapshot is immutable and records the data and engine versions it was computed from, with SHA-256 checksums.
          </p>
          <SnapshotPanel />
        </section>

        <section aria-labelledby="audits">
          <SectionTitle id="audits" aside={<a href={AUDIT_BASE} className="link" target="_blank" rel="noopener">All audits on GitHub</a>}>Published audits</SectionTitle>
          <p className="text-[14px] mb-4 max-w-[70ch]" style={{ color: 'var(--muted)' }}>
            Every change to the curated corpus is published with its method, counts and per-record files in the posi-data repository.
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable min-w-[720px]">
              <thead><tr><th>Audit</th><th>Date</th><th>Summary</th></tr></thead>
              <tbody>
                {AUDITS.map(a => (
                  <tr key={a.path}>
                    <td className="whitespace-nowrap align-top">
                      <a href={AUDIT_BASE + a.path} className="link font-medium" target="_blank" rel="noopener">{a.name}</a>
                    </td>
                    <td className="font-mono text-[12.5px] whitespace-nowrap align-top" style={{ color: 'var(--muted)' }}>{a.date}</td>
                    <td className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{a.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="licences" className="max-w-[760px]">
          <SectionTitle id="licences">Licences</SectionTitle>
          <div className="panel overflow-hidden">
            <table className="dtable">
              <tbody>
                <tr><td>POSI-produced data (PSC, scores, rankings, curated metadata)</td><td className="font-mono whitespace-nowrap">CC BY 4.0</td></tr>
                <tr><td>Source code of this site and posi-engine</td><td className="font-mono whitespace-nowrap">MIT</td></tr>
                <tr><td>Upstream metadata (Crossref, OpenAlex, DOAJ, ROR, ORCID)</td><td className="whitespace-nowrap">Source license</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>POSI is open source. Third-party open data are credited and keep their original licences.</p>
        </section>

        <section aria-labelledby="cite" className="max-w-[820px] pb-10">
          <SectionTitle id="cite">Cite the dataset</SectionTitle>
          <pre className="code whitespace-pre-wrap"><code>{`Panorama Open Scholarly Index (${new Date().getFullYear()}). POSI journal records. Panorama Scholarly Group. https://posi.panorama-sg.com/datasets/. Accessed [date]. Licence: CC BY 4.0.`}</code></pre>
        </section>
      </div>
    </div>
  )
}
