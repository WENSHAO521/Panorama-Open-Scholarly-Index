import Link from 'next/link'
import { getAllRecords } from '@/lib/records-data'
import { toIndexRecord, freshnessOf, VERIFICATION, FRESHNESS, type Verification, type Freshness } from '@/lib/records'
import { PageHeader, SectionTitle, VerificationPill, FreshnessTag, fmt } from '@/components/db'
import { DATA_CUTOFF } from '@/lib/release'

export const metadata = {
  title: 'Provenance and verification',
  description: 'How POSI assigns verification and freshness states, orders its sources, resolves duplicates and labels small samples.',
}

const TIERS = [
  { name: 'Persistent identifiers', body: 'ISSN, ISSN-L, DOI prefix, OpenAlex source id. Checked against the issuing registry before anything is called verified.' },
  { name: 'Open registry metadata', body: 'Crossref, OpenAlex, DOAJ and the ISSN Portal. Taken as-is and labelled with the registry it came from.' },
  { name: 'Publisher declarations', body: 'Frequency, peer-review model, license and country as stated by the journal. Recorded as declared, never as observed.' },
  { name: 'Computed values', body: 'Subjects, ratings and citation indicators from posi-engine under a named, versioned specification.' },
]

export default function ProvenancePage() {
  const all = getAllRecords()
  const idx = all.map(toIndexRecord)
  const byV = idx.reduce<Record<string, number>>((a, r) => { a[r.v] = (a[r.v] ?? 0) + 1; return a }, {})
  const byF = all.reduce<Record<string, number>>((a, j) => { const f = freshnessOf(j); a[f] = (a[f] ?? 0) + 1; return a }, {})

  return (
    <div className="pb-10 space-y-12 max-w-[900px]">
      <PageHeader title="Provenance and verification" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Provenance' }]}>
        <p>
          Every record states how much of it has been confirmed and how recently it changed. The rules follow the
          provenance discipline of{' '}
          <span>scholarly-corpus-builder</span>:
          identifiers before plausibility, open sources before anything else, and no value upgraded because it merely looks right.
        </p>
      </PageHeader>

      <section aria-labelledby="verification">
        <SectionTitle id="verification" aside={`${fmt(idx.length)} records`}>Verification states</SectionTitle>
        <div className="panel overflow-x-auto">
          <table className="dtable">
            <thead><tr><th>State</th><th>Rule</th><th className="text-right">Records</th></tr></thead>
            <tbody>
              {(Object.keys(VERIFICATION) as Verification[]).map(v => (
                <tr key={v}>
                  <td className="whitespace-nowrap"><VerificationPill v={v} /></td>
                  <td className="text-[13.5px]">{VERIFICATION[v].rule}</td>
                  <td className="text-right font-mono tnum">{fmt(byV[v] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          The state describes the record&apos;s identity, not the journal&apos;s quality. A Discovered record marked
          needs check may describe an excellent journal; it only means POSI has not confirmed the record yet.
        </p>
      </section>

      <section aria-labelledby="freshness">
        <SectionTitle id="freshness" aside={`Cutoff ${DATA_CUTOFF}`}>Freshness</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(FRESHNESS) as Freshness[]).map(f => (
            <li key={f} className="panel p-4 flex items-start justify-between gap-4">
              <div>
                <FreshnessTag f={f} />
                <p className="mt-2 text-[13.5px]" style={{ color: 'var(--muted)' }}>{FRESHNESS[f].rule}</p>
              </div>
              <span className="font-mono tnum text-[18px]">{fmt(byF[f] ?? 0)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13.5px]" style={{ color: 'var(--muted)' }}>
          Journal records use a 6 to 12 month window. Freshness is computed from each record&apos;s own update
          timestamp against the data cutoff; it is never assumed.
        </p>
      </section>

      <section aria-labelledby="order">
        <SectionTitle id="order">Source order</SectionTitle>
        <ol className="space-y-3">
          {TIERS.map((t, i) => (
            <li key={t.name} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
              <span className="font-mono text-[13px] pt-0.5" style={{ color: 'var(--teal)' }}>{i + 1}</span>
              <div>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{t.name}</p>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[14px]">Each field&apos;s basis is listed in the <Link href="/docs/schema/" className="link">record schema</Link>.</p>
      </section>

      <section aria-labelledby="dedup" className="prose-doc">
        <h2 id="dedup" style={{ marginTop: 0 }}>Duplicates and identity</h2>
        <p>
          Records are merged on identifiers in this order: ISSN-L, canonical ISSN pair, OpenAlex source id. Title
          similarity alone never merges two records. Every possible duplicate found during the identity migration
          was resolved with a live lookup: 166 groups merged, 5 confirmed distinct, none left ambiguous. The audit is
          linked from <Link href="/datasets/#audits">Datasets</Link>.
        </p>
        <p>
          Unknown values stay unknown. An ISSN, year, publisher or license that was not found is stored as null and
          shown as &quot;Not recorded&quot;, never filled with a best guess.
        </p>

        <h2>Small samples</h2>
        <p>
          Citation indicators computed from very few items are labelled on every record page: fewer than 5 items is
          <em> illustrative</em>, 5 to 19 is a <em>limited sample</em>. These labels travel with the number so a
          value from three articles is never read as if it came from three hundred.
        </p>

        <h2>Declared versus observed</h2>
        <p>
          What a journal says about itself (peer-review model, frequency, license) is kept apart from what POSI or a
          registry observed (registered articles, DOAJ listing, ISSN country). Record pages show them in separate
          sections so a declaration is never presented as a measurement.
        </p>
      </section>
    </div>
  )
}
