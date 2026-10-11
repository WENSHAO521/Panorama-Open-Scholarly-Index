// One journal record, presented the way a catalog presents an entry:
// identifiers first, then every field with its provenance basis, then the
// computed indicators, each carrying its own version and sample size.
//
// Pure and hook-free so it renders both on statically generated pages and
// inside the client-side viewer for Discovered records. Heavy metric
// lookups are done by the caller and passed in.

import Link from 'next/link'
import { ArrowSquareOut, Certificate, DownloadSimple, Globe } from '@phosphor-icons/react/dist/ssr'
import type { Journal } from '@/lib/types'
import type { PcsEntry } from '@/lib/pcs'
import type { PciEntry } from '@/lib/pci'
import type { CitationStatsEntry } from '@/lib/citation-stats'
import { COLLECTIONS, VERIFICATION, FRESHNESS, collectionOf, verificationOf, freshnessOf, countryName } from '@/lib/records'
import { BASIS, FIELD_BY_KEY } from '@/lib/schema'
import { buildJournalEvaluation, type JournalEvaluation } from '@/lib/evaluation/journal'
import { fmtScore } from '@/lib/evaluation/display'
import { EvaluationCards } from './Evaluation'
import { RankingHistory, type RankingHistoryRow } from './RankingHistory'
import { PosiGrades } from './PosiGrades'
import { IndexChecks } from './IndexChecks'
import { alternateTitleLabel } from '@/lib/titles'
import { PQF_DISCLAIMER } from '@/lib/evaluation/rules'
import { FreshnessTag, VerificationPill, SectionTitle, Note, fmt } from './db'

export interface RecordMetrics {
  /** POSI-EVAL-1.0 evaluation; built from the record alone when absent */
  evaluation?: JournalEvaluation | null
  pcs?: PcsEntry | null
  pci?: PciEntry | null
  citationStats?: CitationStatsEntry | null
  pscName?: string | null
  /** the journal's Citation Ranking in every edition that ranked it */
  rankingHistory?: RankingHistoryRow[]
}

// scholarly-corpus-builder small-sample rule: n < 5 illustrative, 5-19 limited.
function sampleLabel(n: number | null | undefined): { label: string; tone: string } | null {
  if (n === null || n === undefined || n === 0) return null
  if (n < 5) return { label: 'Illustrative, n < 5', tone: 'var(--check)' }
  if (n < 20) return { label: 'Limited sample', tone: 'var(--partial)' }
  return { label: 'Adequate sample', tone: 'var(--verified)' }
}

type FieldSpec = { k: string; value: React.ReactNode; mono?: boolean }

const isEmpty = (v: React.ReactNode) => v === null || v === undefined || v === ''

/**
 * One group of record fields. Fields with a value are listed with their
 * source and basis; empty ones are named in a single "Not recorded" line so
 * a sparse record stays short but still says what is missing.
 */
function FieldGroup({ id, title, intro, fields }: { id: string; title: string; intro?: string; fields: FieldSpec[] }) {
  const have = fields.filter(f => !isEmpty(f.value))
  const missing = fields.filter(f => isEmpty(f.value)).map(f => FIELD_BY_KEY[f.k]?.label ?? f.k)
  return (
    <section aria-labelledby={id} className="px-4 sm:px-5 py-4 first:border-t-0" style={{ borderTop: '1px solid var(--line-soft)' }}>
      <h3 id={id} className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{title}</h3>
      {intro && <p className="mt-1 text-[12.5px] max-w-[65ch]" style={{ color: 'var(--soft)' }}>{intro}</p>}
      {have.length > 0 && (
        <dl className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
          {have.map(({ k, value, mono }) => {
            const f = FIELD_BY_KEY[k]
            return (
              <div key={k} className="min-w-0">
                <dt className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
                  {f?.label ?? k}
                  {f && <span style={{ color: 'var(--soft)' }} title={BASIS[f.basis].description}> · {f.source} · {BASIS[f.basis].label.toLowerCase()}</span>}
                </dt>
                <dd className={`mt-0.5 break-words ${mono ? 'font-mono text-[13px]' : ''}`} style={{ color: 'var(--ink)' }}>{value}</dd>
              </div>
            )
          })}
        </dl>
      )}
      {missing.length > 0 && <p className="mt-3 text-[12.5px]" style={{ color: 'var(--soft)' }}>Not recorded: {missing.join(', ')}</p>}
    </section>
  )
}

function Figure({ label, value, note, sample, href }: {
  label: string
  value: React.ReactNode | null
  note?: React.ReactNode
  sample?: { label: string; tone: string } | null
  href?: string
}) {
  return (
    <div className="flex flex-col">
      <dt>{label}</dt>
      {value === null
        ? <dd className="text-[15px] py-1.5" style={{ color: 'var(--soft)' }}>Not computed</dd>
        : <dd className="figure text-[24px] sm:text-[28px] leading-tight mt-1 tnum break-words">{value}</dd>}
      {note && <dd className="note">{note}</dd>}
      {sample && <dd className="text-[12px] mt-0.5" style={{ color: sample.tone }}>{sample.label}</dd>}
      {href && <dd className="mt-1 text-[12.5px]"><Link href={href} className="link">How it is calculated</Link></dd>}
    </div>
  )
}

export function RecordView({ journal: j, metrics = {}, jsonHref, links }: {
  journal: Journal
  metrics?: RecordMetrics
  jsonHref?: string
  /** Extra per-journal links for the sidebar (profile, certificates). */
  links?: React.ReactNode
}) {
  const k = collectionOf(j)
  const v = verificationOf(j)
  const f = freshnessOf(j)
  const pqf = j.pqf ?? j.ojqf ?? null
  const autoPqf = !pqf ? j.auto_pqf ?? null : null
  const { pcs, citationStats, pscName } = metrics
  // PCI is a Core Collection indicator: no other journal reports one.
  const pci = k === 'core' ? metrics.pci : null
  const evaluation = metrics.evaluation ?? buildJournalEvaluation({ journal: j, pci: pci?.pci ?? null, pcs: pcs?.pcs ?? null })
  const oa = citationStats?.stats
  const issn = j.issn_online ?? j.issn_print

  return (
    <article>
      <header className="pt-8 pb-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:underline">POSI</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
          <Link href="/journals/" className="hover:underline">Journals</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
          <Link href={k === 'core' ? '/core-collection/' : `/journals/?collection=${k}`} className="hover:underline">{COLLECTIONS[k].label}</Link>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="text-[22px] md:text-[26px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{j.title}</h1>
            <p className="mt-1.5 text-[15px]" style={{ color: 'var(--muted)' }}>
              {[j.publisher, countryName(j.registration_country || j.country)].filter(Boolean).join(', ')}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {j.posi_id && <span className="id-tag">{j.posi_id}</span>}
              {j.issn_online && <span className="id-tag">eISSN {j.issn_online}</span>}
              {j.issn_print && j.issn_print !== j.issn_online && <span className="id-tag">pISSN {j.issn_print}</span>}
              <PosiGrades size="md" showEmpty tier={k === 'core' ? 'core' : 'indexed'}
                ajr={evaluation.ajr.rating} quartile={evaluation.ranking.quartile} quartileProvisional={evaluation.ranking.status === 'provisional'}
                zone={evaluation.ranking.zone} zoneStatus={evaluation.ranking.zoneStatus} />
              <VerificationPill v={v} />
              <FreshnessTag f={f} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {j.website_url && (
              <a href={j.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Globe className="h-4 w-4" /> Journal website
              </a>
            )}
            {issn && <Link href={`/publications/?issn=${issn}&sort=newest`} className="btn">Publications</Link>}
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
            This journal is indexed but not certified. POSI built this record from open registries and has not
            reviewed it, so treat each field as <strong>needs check</strong>. The journal can{' '}
            <Link href="/certification/" className="link">apply for certification</Link>.
          </Note>
        </div>
      )}

      <section aria-label="Key figures" className="mb-10">
        <dl className={`stat-strip grid-cols-2 ${k === 'core' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-y-2`}>
          {/* PCI is a Core Collection indicator: other journals do not show it at all. */}
          {k === 'core' && (
            <Figure
              label="Citation impact (PCI)"
              value={pci?.pci != null ? fmtScore(pci.pci) : null}
              note={pci?.pci == null ? undefined : <>{pci.pci_window_start_year}–{pci.pci_window_end_year} · {fmt(pci.pci_citable_items)} citable items{pci.pci_methodology_version && <> · <span className="font-mono whitespace-nowrap">{pci.pci_methodology_version}</span></>}</>}
              sample={pci ? sampleLabel(pci.pci_citable_items) : null}
              href="/methodology/#pci"
            />
          )}
          <Figure
            label="Citation score (PCS)"
            value={pcs?.pcs != null ? fmtScore(pcs.pcs) : null}
            note={pcs ? <>Supplementary · {pcs.pcs_window_start_year}–{pcs.pcs_window_end_year} · {fmt(pcs.pcs_eligible_items)} items{pcs.pcs_methodology_version && <> · <span className="font-mono whitespace-nowrap">{pcs.pcs_methodology_version}</span></>}</> : undefined}
            sample={pcs ? sampleLabel(pcs.pcs_eligible_items) : null}
            href="/methodology/#pcs"
          />
          <Figure
            label="Articles"
            value={j.article_count != null ? fmt(j.article_count) : null}
            note={FIELD_BY_KEY.article_count?.source}
          />
          <div className="flex flex-col min-w-0">
            <dt>Subject</dt>
            {j.psc_category
              ? <dd className="text-[16px] sm:text-[17px] font-semibold leading-snug mt-1.5" style={{ color: 'var(--ink)' }}>{pscName ?? j.psc_category}</dd>
              : <dd className="text-[15px] py-1.5" style={{ color: 'var(--soft)' }}>Not yet classified</dd>}
            {j.psc_category && <dd className="note"><span className="font-mono">{j.psc_category}</span>{j.psc_confidence && ` · confidence ${j.psc_confidence}`}</dd>}
          </div>
        </dl>
        {oa && (
          <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            OpenAlex source statistics (registry values, not POSI indicators): 2-year mean citedness{' '}
            <span className="tnum">{fmtScore(oa.two_yr_mean_citedness, 'n/a')}</span>, h-index{' '}
            <span className="tnum">{fmt(oa.h_index)}</span>, fetched {citationStats?.fetched_at?.slice(0, 10)}.
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="indicators">
            <SectionTitle id="indicators" aside={<span className="font-mono text-[12px]">{evaluation.evaluationVersion}</span>}>Evaluation status</SectionTitle>
            <EvaluationCards ev={evaluation} core={k === 'core' ? 'core' : 'indexed'} autoPqf={autoPqf} />
          </section>

          {!!metrics.rankingHistory?.length && (
            <section aria-labelledby="ranking-history">
              <SectionTitle id="ranking-history">Ranking history</SectionTitle>
              <div className="panel p-4 max-w-[560px]"><RankingHistory rows={metrics.rankingHistory} /></div>
            </section>
          )}

          <section aria-labelledby="details">
            <SectionTitle id="details">Record details</SectionTitle>
            <div className="panel overflow-hidden">
              <FieldGroup id="identity" title="Identity" fields={[
                { k: 'posi_id', value: j.posi_id, mono: true },
                { k: 'issn_online', value: j.issn_online, mono: true },
                { k: 'issn_print', value: j.issn_print, mono: true },
                { k: 'openalex_source_id', value: j.openalex_source_id && (
                  <a href={`https://openalex.org/${j.openalex_source_id}`} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                    {j.openalex_source_id} <ArrowSquareOut className="h-3.5 w-3.5" />
                  </a>
                ), mono: true },
                { k: 'title', value: j.title },
                ...(j.alternate_titles?.length ? [{ k: 'alternate_titles', value: j.alternate_titles.map(alternateTitleLabel).join('; ') }] : []),
                { k: 'publisher', value: j.publisher },
                { k: 'registration_country', value: countryName(j.registration_country) },
              ]} />
              <FieldGroup id="declared" title="Declared by the publisher"
                intro="Stated by the journal about itself. POSI records these as declared and does not present them as measured."
                fields={[
                  { k: 'country', value: countryName(j.country) },
                  { k: 'language', value: j.language },
                  { k: 'website_url', value: j.website_url && <a href={j.website_url} className="link break-all" target="_blank" rel="noopener noreferrer">{j.website_url.replace(/^https?:\/\//, '')}</a> },
                  { k: 'frequency', value: j.frequency },
                  { k: 'license', value: j.license },
                  { k: 'peer_review_type', value: j.peer_review_type },
                  { k: 'apc', value: j.apc && (
                    <span className="block">
                      <span className="font-medium">{j.apc.amount === 0 ? 'No APC' : `${j.apc.currency} ${j.apc.amount.toLocaleString('en-US')}`}</span>
                      {j.apc.note && <span className="block text-[13px] mt-0.5" style={{ color: 'var(--ink-2)' }}>{j.apc.note}</span>}
                      <span className="block text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        As stated on the <a href={j.apc.source_url} className="link" target="_blank" rel="noopener noreferrer">journal’s website</a>, checked {j.apc.checked_at}
                      </span>
                    </span>
                  ) },
                ]} />
              <FieldGroup id="observed" title="Registry and computed values" fields={[
                { k: 'open_access', value: j.open_access == null ? 'Unknown' : j.open_access ? 'Yes' : 'No' },
                { k: 'doaj_status', value: j.doaj_status ? j.doaj_status.replace(/_/g, ' ') : null },
              ]} />
            </div>
          </section>

          {pqf && (
            <section aria-labelledby="pqf">
              <SectionTitle id="pqf" aside={pqf.version}>PQF sub-factors</SectionTitle>
              <p className="text-[13px] mb-3 max-w-[70ch]" style={{ color: 'var(--muted)' }}>{PQF_DISCLAIMER}</p>
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
          <div className="panel p-4 space-y-2">
            <p className="text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>More for this journal</p>
            {links}
            <Link href="/certificate/" className="btn w-full justify-start"><Certificate className="h-4 w-4" /> Certificate of indexing</Link>
            {issn && <IndexChecks issns={[j.issn_online, j.issn_print].filter((x): x is string => !!x)} />}
          </div>
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
              Panorama Open Scholarly Index. ({new Date().getFullYear()}). {j.title} [journal record{j.posi_id ? `, ${j.posi_id}` : ''}]. https://posi.panorama-sg.com/journal/{j.journal_code}/
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
