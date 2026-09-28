import Link from 'next/link'
import { JOURNAL_FIELDS, INDEX_KEYS, BASIS, type Basis } from '@/lib/schema'
import { PageHeader, SectionTitle, BasisTag } from '@/components/db'

export const metadata = {
  title: 'Record schema',
  description: 'Every field in a POSI journal record: type, provenance basis, source and meaning, plus the short keys used in the index files.',
  alternates: { canonical: '/docs/schema/' },
}

export default function SchemaPage() {
  return (
    <div className="pb-10 space-y-12">
      <PageHeader title="Record schema" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Record schema' }]}>
        <p className="max-w-[65ch]">
          The fields of a journal record, as published in <span className="font-mono">/data/journal/&#123;code&#125;.json</span> and
          the Discovered shards. Each field states its basis so declared claims are never mistaken for measurements.
          Machine-readable copy: <a href="/data/meta/schema.json" className="link font-mono">/data/meta/schema.json</a>.
        </p>
      </PageHeader>

      <section aria-labelledby="basis">
        <SectionTitle id="basis">Provenance basis</SectionTitle>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {(Object.keys(BASIS) as Basis[]).map(b => (
            <div key={b} className="flex gap-3">
              <dt className="shrink-0 pt-0.5"><BasisTag b={b} /></dt>
              <dd className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{BASIS[b].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="fields">
        <SectionTitle id="fields">Fields</SectionTitle>
        <div className="panel overflow-x-auto">
          <table className="dtable min-w-[760px]">
            <thead><tr><th>Field</th><th>Type</th><th>Basis</th><th>Source</th><th>Meaning</th></tr></thead>
            <tbody>
              {JOURNAL_FIELDS.map(f => (
                <tr key={f.key}>
                  <td className="font-mono text-[13px] whitespace-nowrap">{f.key}</td>
                  <td className="font-mono text-[12px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>{f.type}</td>
                  <td><BasisTag b={f.basis} /></td>
                  <td className="text-[13px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>{f.source}</td>
                  <td className="text-[13.5px]">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="index-keys">
        <SectionTitle id="index-keys">Index file keys</SectionTitle>
        <p className="text-[14px] mb-4 max-w-[65ch]" style={{ color: 'var(--muted)' }}>
          The files under <span className="font-mono">/data/index/</span> use one-letter keys to stay small. The CSV
          versions use full column names.
        </p>
        <div className="panel overflow-x-auto max-w-[760px]">
          <table className="dtable">
            <thead><tr><th>Key</th><th>Field</th><th>Note</th></tr></thead>
            <tbody>
              {INDEX_KEYS.map(k => (
                <tr key={k.key}>
                  <td className="font-mono">{k.key}</td>
                  <td className="font-mono text-[13px]">{k.field}</td>
                  <td className="text-[13px]" style={{ color: 'var(--muted)' }}>{k.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px]">
          See <Link href="/docs/provenance/" className="link">Provenance and verification</Link> for how{' '}
          <span className="font-mono">k</span> and <span className="font-mono">v</span> are assigned.
        </p>
      </section>
    </div>
  )
}
