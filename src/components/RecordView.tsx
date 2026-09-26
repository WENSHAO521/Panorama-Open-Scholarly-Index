// One journal record, presented the way a catalog presents an entry:
// identifiers first, then every field with its provenance basis, then the
// computed indicators, each carrying its own version and sample size.
//
// Pure and hook-free so it renders both on statically generated pages and
// inside the client-side viewer for Discovered records. Heavy metric
// lookups are done by the caller and passed in.

import Link from 'next/link'
import { ArrowSquareOut, DownloadSimple, Globe } from '@phosphor-icons/react/dist/ssr'
import type { Journal } from '@/lib/types'
import type { PcsEntry } from '@/lib/pcs'
import type { PciEntry } from '@/lib/pci'
import type { CitationStatsEntry } from '@/lib/citation-stats'
import { COLLECTIONS, VERIFICATION, FRESHNESS, collectionOf, verificationOf, freshnessOf, countryName } from '@/lib/records'
import { FIELD_BY_KEY, type Basis } from '@/lib/schema'
import { earlyStageStatus, earlyStageDisplayTotal, earlyStageQuartile, earlyStageLifecycleLabel } from '@/lib/early-stage'
import { DATA_CUTOFF } from '@/lib/release'
import { BasisTag, CollectionTag, FreshnessTag, VerificationPill, SectionTitle, Note, fmt } from './db'

export interface RecordMetrics {
  pcs?: PcsEntry | null
  pci?: PciEntry | null
  citationStats?: CitationStatsEntry | null
  pscName?: string | null
}

// scholarly-corpus-builder small-sample rule: n < 5 illustrative, 5-19 limited.
function sampleLabel(n: number | null | undefined): { label: string; tone: string } | null {
  if (n === null || n === undefined || n === 0) return null
  if (n < 5) return { label: 'Illustrative, n < 5', tone: 'var(--check)' }
  if (n < 20) return { label: 'Limited sample', tone: 'var(--partial)' }
  return { label: 'Adequate sample', tone: 'var(--verified)' }
}

function Val({ v, mono }: { v: React.ReactNode; mono?: boolean }) {
  if (v === null || v === undefined || v === '') return <span style={{ color: 'var(--soft)' }}>Not recorded</span>
  return <span className={mono ? 'font-mono text-[13px]' : undefined}>{v}</span>
}

function FieldRow({ k, value, mono, basisOverride }: { k: string; value: React.ReactNode; mono?: boolean; basisOverride?: Basis }) {
  const f = FIELD_BY_KEY[k]
  return (
    <>
      <dt>
        <span className="block">{f?.label ?? k}</span>
        {f && <span className="block text-[11.5px] mt-0.5" style={{ color: 'var(--soft)' }}>{f.source}</span>}
      </dt>
      <dd className="flex items-start justify-between gap-3">
        <Val v={value} mono={mono} />
        {f && <span className="shrink-0 hidden sm:inline"><BasisTag b={basisOverride ?? f.basis} /></span>}
      </dd>
    </>
  )
}

function Metric({ name, value, sub, version, sample, href }: {
  name: string
  value: React.ReactNode
  sub?: React.ReactNode
  version?: string | null
  sample?: { label: string; tone: string } | null
  href?: string
}) {
  return (
    <div className="p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>{name}</p>
        {version && <span className="font-mono text-[11px]" style={{ color: 'var(--soft)' }}>{version}</span>}
      </div>
      <p className="text-[24px] font-semibold tnum tracking-tight" style={{ color: 'var(--ink)' }}>{value}</p>
      {sub && <p className="text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>{sub}</p>}
      {sample && <p className="text-[12px]" style={{ color: sample.tone }}>{sample.label}</p>}
      {href && <Link href={href} className="text-[12.5px] link mt-auto pt-1">Method</Link>}
    </div>
  )
}

export function RecordView({ journal: j, metrics = {}, jsonHref }: { journal: Journal; metrics?: RecordMetrics; jsonHref?: string }) {
  const k = collectionOf(j)
  const v = verificationOf(j)
  const f = freshnessOf(j)
  const pqf = j.pqf ?? j.ojqf ?? null
  const autoPqf = !pqf ? j.auto_pqf ?? null : null
  const r = j.early_stage_rating
  const status = earlyStageStatus(r)
  const ajrTotal = earlyStageDisplayTotal(r)
  const ajrQ = earlyStageQuartile(r)
  const { pcs, pci, citationStats, pscName } = metrics
  const oa = citationStats?.stats

  return (
    <article>
      <header className="pt-8 pb-6 md:pt-10">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>
            <Link href="/journals/" className="hover:underline">Sources</Link>
            <span className="mx-1.5" style={{ color: 'var(--soft)' }}>/</span>
            <Link href={`/journals/?collection=${k}`} className="hover:underline">{COLLECTIONS[k].label}</Link>
          </nav>
          <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{j.title}</h1>
          <p className="mt-1.5 text-[15px]" style={{ color: 'var(--muted)' }}>
            {[j.publisher, countryName(j.registration_country || j.country)].filter(Boolean).join(', ')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {j.posi_id && <span className="id-tag">{j.posi_id}</span>}
            {j.issn_online && <span className="id-tag">eISSN {j.issn_online}</span>}
            {j.issn_print && j.issn_print !== j.issn_online && <span className="id-tag">pISSN {j.issn_print}</span>}
            <CollectionTag k={k} />
            <VerificationPill v={v} />
            <FreshnessTag f={f} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {j.website_url && (
              <a href={j.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Globe className="h-4 w-4" /> Journal website
              </a>
            )}
            {(j.issn_online || j.issn_print) && (
              <Link href={`/publications/?issn=${j.issn_online ?? j.issn_print}&sort=newest`} className="btn">
                Publications
              </Link>
            )}
            {j.openalex_source_id && (
              <a href={`https://openalex.org/${j.openalex_source_id}`} target="_blank" rel="noopener noreferrer" className="btn">
                OpenAlex <ArrowSquareOut className="h-3.5 w-3.5" />
              </a>
            )}
            {k === 'core' && (
              <Link href="/certificate/" className="btn">Indexing certificate</Link>
            )}
            {jsonHref && (
              <a href={jsonHref} className="btn" download>
                <DownloadSimple className="h-4 w-4" /> Record JSON
              </a>
            )}
          </div>
        </div>
      </header>

      {k === 'discovered' && (
        <div className="mb-6">
          <Note tone="warn">
            This is a Discovered record. POSI found it in an open registry and holds its metadata, but has not
            reviewed or admitted the journal. Treat every field as <strong>needs check</strong>.
          </Note>
        </div>
      )}
      {k === 'candidate' && (
        <div className="mb-6">
          <Note tone="warn">
            A PQF re-review found this journal below the eligibility bar. The record is kept, but it is excluded
            from Core Collection counts, rankings and badges until re-review.
          </Note>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="indicators">
            <SectionTitle id="indicators" aside={`As of ${DATA_CUTOFF}`}>Indicators</SectionTitle>
            <div className="panel grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'var(--line)' }}>
              <Metric
                name="Lifecycle rating"
                value={ajrTotal !== null ? ajrTotal.toFixed(1) : <span className="text-[16px] font-medium" style={{ color: status.color }}>{status.label}</span>}
                sub={ajrTotal !== null ? <>{status.label}{ajrQ ? `, ${ajrQ}` : ''}. {earlyStageLifecycleLabel(r)}</> : earlyStageLifecycleLabel(r)}
                version={r?.version ?? null}
                href="/ratings/"
              />
              <Metric
                name="Citation score (PCS)"
                value={pcs?.pcs != null ? pcs.pcs.toFixed(2) : 'n/a'}
                sub={pcs ? `${pcs.pcs_window_start_year} to ${pcs.pcs_window_end_year}, ${fmt(pcs.pcs_eligible_items)} items` : 'Not computed for this record'}
                sample={pcs ? sampleLabel(pcs.pcs_eligible_items) : null}
                version={pcs?.pcs_methodology_version}
                href="/pcs/"
              />
              <Metric
                name="Citation impact (PCI)"
                value={pci?.pci != null ? pci.pci.toFixed(2) : 'n/a'}
                sub={pci ? `${pci.pci_window_start_year} to ${pci.pci_window_end_year}, ${fmt(pci.pci_citable_items)} citable items` : 'Not computed for this record'}
                sample={pci ? sampleLabel(pci.pci_citable_items) : null}
                version={pci?.pci_methodology_version}
                href="/pci/"
              />
              <Metric
                name={pqf ? 'Editorial selection (PQF)' : 'PQF (automated)'}
                value={pqf ? pqf.total : autoPqf ? autoPqf.total : 'n/a'}
                sub={pqf ? `Grade ${pqf.grade}, evaluated ${pqf.evaluated_at}` : autoPqf ? 'Automated pre-screen, not an admission decision' : 'Not assessed'}
                version={(pqf ?? autoPqf)?.version ?? null}
                href="/pqf/"
              />
            </div>
            {oa && (
              <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
                OpenAlex source statistics (registry values, not POSI indicators): 2-year mean citedness{' '}
                <span className="font-mono">{oa.two_yr_mean_citedness?.toFixed(2) ?? 'n/a'}</span>, h-index{' '}
                <span className="font-mono">{fmt(oa.h_index)}</span>, fetched {citationStats?.fetched_at?.slice(0, 10)}.
              </p>
            )}
          </section>

          <section aria-labelledby="identity">
            <SectionTitle id="identity">Identity</SectionTitle>
            <dl className="panel fields overflow-hidden">
              <FieldRow k="posi_id" value={j.posi_id} mono />
              <FieldRow k="issn_online" value={j.issn_online} mono />
              <FieldRow k="issn_print" value={j.issn_print} mono />
              <FieldRow k="openalex_source_id" value={j.openalex_source_id} mono />
              <FieldRow k="title" value={j.title} />
              <FieldRow k="publisher" value={j.publisher} />
              <FieldRow k="registration_country" value={countryName(j.registration_country)} />
            </dl>
          </section>

          <section aria-labelledby="declared">
            <SectionTitle id="declared">Declared by the publisher</SectionTitle>
            <p className="text-[13.5px] mb-3 max-w-[65ch]" style={{ color: 'var(--muted)' }}>
              Stated by the journal about itself. POSI records these as declared and does not present them as measured.
            </p>
            <dl className="panel fields overflow-hidden">
              <FieldRow k="country" value={countryName(j.country)} />
              <FieldRow k="language" value={j.language} />
              <FieldRow k="frequency" value={j.frequency} />
              <FieldRow k="license" value={j.license} />
              <FieldRow k="peer_review_type" value={j.peer_review_type} />
              <FieldRow k="website_url" value={j.website_url ? <a href={j.website_url} className="link break-all" target="_blank" rel="noopener noreferrer">{j.website_url}</a> : null} />
            </dl>
          </section>

          <section aria-labelledby="observed">
            <SectionTitle id="observed">Registry and computed values</SectionTitle>
            <dl className="panel fields overflow-hidden">
              <FieldRow k="article_count" value={fmt(j.article_count)} mono />
              <FieldRow k="open_access" value={j.open_access ? 'Yes' : 'No'} />
              <FieldRow k="doaj_status" value={j.doaj_status ? j.doaj_status.replace(/_/g, ' ') : null} />
              <FieldRow k="psc_category" value={j.psc_category ? <><span className="font-mono">{j.psc_category}</span>{pscName ? ` ${pscName}` : ''}</> : null} />
              <FieldRow k="psc_confidence" value={j.psc_confidence} />
            </dl>
          </section>

          {pqf && (
            <section aria-labelledby="pqf">
              <SectionTitle id="pqf" aside={pqf.version}>PQF sub-factors</SectionTitle>
              <div className="panel overflow-x-auto">
                <table className="dtable">
                  <thead><tr><th>Factor</th><th className="text-right">Score</th><th className="text-right">Max</th></tr></thead>
                  <tbody>
                    {([
                      ['Journal transparency', pqf.subfactors.jtf, 25],
                      ['Metadata quality', pqf.subfactors.mqf, 25],
                      ['Editorial governance', pqf.subfactors.egf, 20],
                      ['Technical discoverability', pqf.subfactors.tdf, 15],
                      ['Citation visibility', pqf.subfactors.cvf, 10],
                      ['Research integrity', pqf.subfactors.rif, 5],
                    ] as const).map(([label, val, max]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td className="text-right font-mono tnum">{val}</td>
                        <td className="text-right font-mono tnum" style={{ color: 'var(--soft)' }}>{max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-4 space-y-4 text-[13.5px]">
            <div>
              <p className="font-medium" style={{ color: 'var(--ink)' }}>Verification: {VERIFICATION[v].label}</p>
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{VERIFICATION[v].rule}</p>
            </div>
            <div style={{ borderTop: '1px solid var(--line-soft)' }} className="pt-4">
              <p className="font-medium" style={{ color: 'var(--ink)' }}>Freshness: {FRESHNESS[f].label}</p>
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                Updated {j.updated_at?.slice(0, 10) || 'unknown'}. {FRESHNESS[f].rule}
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--line-soft)' }} className="pt-4">
              <p className="font-medium" style={{ color: 'var(--ink)' }}>{COLLECTIONS[k].label}</p>
              <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{COLLECTIONS[k].description}</p>
            </div>
            <Link href="/docs/provenance/" className="link text-[13px] inline-block">How states are assigned</Link>
          </div>
          <div className="panel p-4 text-[13px]">
            <p className="font-medium mb-2" style={{ color: 'var(--ink)' }}>Cite this record</p>
            <p className="font-mono text-[12px] leading-relaxed break-words" style={{ color: 'var(--ink-2)' }}>
              Panorama Open Scholarly Index. ({DATA_CUTOFF.slice(0, 4)}). {j.title} [journal record{j.posi_id ? `, ${j.posi_id}` : ''}]. Data snapshot {DATA_CUTOFF}. https://posi.panorama-sg.com/journal/{j.journal_code}/
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
