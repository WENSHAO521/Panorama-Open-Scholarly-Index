// One journal record, presented the way a catalog presents an entry:
// identifiers first, then every field with its provenance basis, then the
// computed indicators, each carrying its own version and sample size.
//
// Pure and hook-free so it renders both on statically generated pages and
// inside the client-side viewer for Discovered records. Heavy metric
// lookups are done by the caller and passed in.

import Link from 'next/link'
import { Certificate, DownloadSimple, Globe } from '@phosphor-icons/react/dist/ssr'
import type { Journal } from '@/lib/types'
import type { PcsEntry } from '@/lib/pcs'
import type { PciEntry } from '@/lib/pci'
import type { CitationStatsEntry } from '@/lib/citation-stats'
import { COLLECTIONS, VERIFICATION, FRESHNESS, collectionOf, verificationOf, freshnessOf } from '@/lib/records'
import { BASIS, FIELD_BY_KEY } from '@/lib/schema'
import { buildJournalEvaluation, type JournalEvaluation } from '@/lib/evaluation/journal'
import { fmtScore } from '@/lib/evaluation/display'
import { EvaluationCards } from './Evaluation'
import { RankingHistory, type RankingHistoryRow } from './RankingHistory'
import { PosiGrades } from './PosiGrades'
import { IndexChecks } from './IndexChecks'
import { alternateTitleLabel } from '@/lib/titles'
import { FreshnessTag, VerificationPill, SectionTitle, Note, fmt } from './db'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/alternates'
import { countryNameIn } from '@/i18n/places'
import { BASIS_ZH, COLLECTIONS_ZH, FIELD_LABEL_ZH, FRESHNESS_ZH, VERIFICATION_ZH, fieldSourceZh } from '@/i18n/records-zh-Hans'

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

// The record's words. Field labels, states and bases come from lib/records and lib/schema in English and from
// i18n/records-zh-Hans in Chinese.
const en = {
  illustrative: 'Illustrative, n < 5', limited: 'Limited sample', adequate: 'Adequate sample',
  notRecorded: 'Not recorded: ', listSep: ', ', notComputed: 'Not computed', how: 'How it is calculated',
  breadcrumb: 'Breadcrumb', journals: 'Journals', website: 'Journal website', publications: 'Publications', json: 'Record JSON',
  discoveredA: 'This journal is indexed but not certified. POSI built this record from open registries and has not reviewed it, so treat each field as ',
  needsCheck: 'needs check', discoveredB: '. The journal can ', apply: 'apply for certification', end: '.',
  evaluation: 'Evaluation status', figures: 'Citations and output',
  pci: 'Citation impact (PCI)', citable: (n: string) => `${n} citable items`, pcs: 'Citation score (PCS)', supplementary: 'Supplementary',
  items: (n: string) => `${n} items`, articles: 'Articles', subject: 'Subject', notClassified: 'Not yet classified', confidence: (c: string) => ` · confidence ${c}`,
  openalexStats: (citedness: React.ReactNode, h: React.ReactNode, date: string | undefined) => <>OpenAlex source statistics (registry values, not POSI indicators): 2-year mean citedness{' '}{citedness}, h-index{' '}{h}, fetched {date}.</>,
  more: 'More for this journal', certificate: 'Certificate of indexing', history: 'Ranking history', details: 'Record details',
  identity: 'Identity', declared: 'Declared by the publisher',
  declaredIntro: 'Stated by the journal about itself. POSI records these as declared and does not present them as measured.',
  noApc: 'No APC', apcStated: (link: React.ReactNode, date: string) => <>As stated on the {link}, checked {date}</>, apcLink: 'journal’s website',
  observed: 'Registry and computed values', unknown: 'Unknown', yes: 'Yes', no: 'No',
  pqf: 'PQF sub-factors', pqfFactors: ['Journal transparency', 'Metadata quality', 'Editorial governance', 'Technical discoverability', 'Citation visibility', 'Research integrity'],
  cite: 'Cite this record', verification: 'Verification: ', freshness: 'Freshness: ', updated: (d: string) => `Updated ${d}. `, unknownDate: 'unknown',
  howStates: 'How states are assigned',
}
const ZH: typeof en = {
  illustrative: '仅供示意，n < 5', limited: '样本有限', adequate: '样本充足',
  notRecorded: '未记录：', listSep: '、', notComputed: '未计算', how: '计算方法',
  breadcrumb: '面包屑导航', journals: '期刊', website: '期刊网站', publications: '文献', json: '记录 JSON',
  discoveredA: '该期刊已被收录，但未经认证。此记录由 POSI 依据开放注册机构的数据建立，尚未经过审阅，请将各字段视为',
  needsCheck: '待核查', discoveredB: '。该期刊可', apply: '申请认证', end: '。',
  evaluation: '评价状态', figures: '引文与发文',
  pci: '引文影响力（PCI）', citable: n => `可引文献 ${n} 篇`, pcs: '引文得分（PCS）', supplementary: '补充指标',
  items: n => `${n} 篇`, articles: '文章数', subject: '学科', notClassified: '尚未分类', confidence: c => ` · 置信度：${({ high: '高', medium: '中', low: '低', verified: '已核实' } as Record<string, string>)[c] ?? c}`,
  openalexStats: (citedness, h, date) => <>OpenAlex 来源统计（注册机构数值，并非 POSI 指标）：两年平均被引率{' '}{citedness}，h 指数{' '}{h}，获取于 {date}。</>,
  more: '该期刊的更多服务', certificate: '收录证书', history: '排名历史', details: '记录详情',
  identity: '基本信息', declared: '出版方自述',
  declaredIntro: '由期刊自行陈述。POSI 将其记为自述信息，不作为测量结果呈现。',
  noApc: '不收取 APC', apcStated: (link, date) => <>依据{link}的说明，核查于 {date}</>, apcLink: '期刊网站',
  observed: '注册机构数值与计算值', unknown: '未知', yes: '是', no: '否',
  pqf: 'PQF 分项指标', pqfFactors: ['期刊透明度', '元数据质量', '编辑治理', '技术可发现性', '引文可见度', '科研诚信'],
  cite: '引用本记录', verification: '核验状态：', freshness: '时效：', updated: d => `更新于 ${d}。`, unknownDate: '未知',
  howStates: '状态的判定方法',
}
const WORDS: Record<Locale, typeof en> = { en, 'zh-Hans': ZH }

// scholarly-corpus-builder small-sample rule: n < 5 illustrative, 5-19 limited.
function sampleLabel(n: number | null | undefined, w: typeof en = en): { label: string; tone: string } | null {
  if (n === null || n === undefined || n === 0) return null
  if (n < 5) return { label: w.illustrative, tone: 'var(--check)' }
  if (n < 20) return { label: w.limited, tone: 'var(--partial)' }
  return { label: w.adequate, tone: 'var(--verified)' }
}

type FieldSpec = { k: string; value: React.ReactNode; mono?: boolean }

const isEmpty = (v: React.ReactNode) => v === null || v === undefined || v === ''

/**
 * One group of record fields. Fields with a value are listed with their
 * source and basis; empty ones are named in a single "Not recorded" line so
 * a sparse record stays short but still says what is missing.
 */
function FieldGroup({ id, title, intro, fields, locale }: { id: string; title: string; intro?: string; fields: FieldSpec[]; locale: Locale }) {
  const zh = locale === 'zh-Hans'
  const w = WORDS[locale]
  const label = (k: string) => (zh ? FIELD_LABEL_ZH[k] : undefined) ?? FIELD_BY_KEY[k]?.label ?? k
  const have = fields.filter(f => !isEmpty(f.value))
  const missing = fields.filter(f => isEmpty(f.value)).map(f => label(f.k))
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
                  {label(k)}
                  {f && (zh
                    ? <span style={{ color: 'var(--soft)' }} title={BASIS_ZH[f.basis].description}> · {fieldSourceZh(f.source)} · {BASIS_ZH[f.basis].label}</span>
                    : <span style={{ color: 'var(--soft)' }} title={BASIS[f.basis].description}> · {f.source} · {BASIS[f.basis].label.toLowerCase()}</span>)}
                </dt>
                <dd className={`mt-0.5 break-words ${mono ? 'font-mono text-[13px]' : ''}`} style={{ color: 'var(--ink)' }}>{value}</dd>
              </div>
            )
          })}
        </dl>
      )}
      {missing.length > 0 && <p className="mt-3 text-[12.5px]" style={{ color: 'var(--soft)' }}>{w.notRecorded}{missing.join(w.listSep)}</p>}
    </section>
  )
}

function Figure({ label, value, note, sample, href, w }: {
  w: typeof en
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
        ? <dd className="text-[15px] py-1.5" style={{ color: 'var(--soft)' }}>{w.notComputed}</dd>
        : <dd className="figure text-[24px] sm:text-[28px] leading-tight mt-1 tnum break-words">{value}</dd>}
      {note && <dd className="note">{note}</dd>}
      {sample && <dd className="text-[12px] mt-0.5" style={{ color: sample.tone }}>{sample.label}</dd>}
      {href && <dd className="mt-1 text-[12.5px]"><Link href={href} className="link">{w.how}</Link></dd>}
    </div>
  )
}

export function RecordView({ journal: j, metrics = {}, jsonHref, links, locale = 'en' }: {
  /** The page's language. */
  locale?: Locale
  journal: Journal
  metrics?: RecordMetrics
  jsonHref?: string
  /** Extra per-journal links for the sidebar (profile, certificates). */
  links?: React.ReactNode
}) {
  const w = WORDS[locale]
  const zh = locale === 'zh-Hans'
  const href = (p: string) => localizedHref(locale, p)
  const country = (raw: string | null | undefined) => countryNameIn(locale, raw)
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
      <header className="pt-6 pb-6 md:pt-8">
        <nav aria-label={w.breadcrumb} className="mb-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          <Link href={href('/')} className="hover:underline">POSI</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
          <Link href={href('/journals/')} className="hover:underline">{w.journals}</Link>
          <span className="mx-1.5" style={{ color: 'var(--soft)' }}>&rsaquo;</span>
          <Link href={href(k === 'core' ? '/core-collection/' : `/journals/?collection=${k}`)} className="hover:underline">{(zh ? COLLECTIONS_ZH : COLLECTIONS)[k].label}</Link>
        </nav>
        <div className="panel p-5 md:p-7 flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div className="min-w-0 flex-1 basis-[420px]">
            <div className="flex flex-wrap items-center gap-2">
              <PosiGrades size="md" showEmpty tier={k === 'core' ? 'core' : 'indexed'} locale={locale}
                ajr={evaluation.ajr.rating} quartile={evaluation.ranking.quartile} quartileProvisional={evaluation.ranking.status === 'provisional'}
                zone={evaluation.ranking.zone} zoneStatus={evaluation.ranking.zoneStatus} />
              <VerificationPill v={v} locale={locale} />
              <FreshnessTag f={f} locale={locale} />
            </div>
            <h1 className="mt-4 text-[24px] md:text-[32px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{j.title}</h1>
            <p className="mt-2 text-[15.5px]" style={{ color: 'var(--ink-2)' }}>
              {[j.publisher, country(j.registration_country || j.country)].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}>
              {j.posi_id && <span>{j.posi_id}</span>}
              {j.issn_online && <span>eISSN {j.issn_online}</span>}
              {j.issn_print && j.issn_print !== j.issn_online && <span>pISSN {j.issn_print}</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {j.website_url && (
              <a href={j.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <Globe className="h-4 w-4" /> {w.website}
              </a>
            )}
            {issn && <Link href={href(`/publications/?issn=${issn}&sort=newest`)} className="btn">{w.publications}</Link>}
            {jsonHref && (
              <a href={jsonHref} className="btn" download>
                <DownloadSimple className="h-4 w-4" /> {w.json}
              </a>
            )}
          </div>
        </div>
      </header>

      {k === 'discovered' && (
        <div className="mb-6">
          <Note tone="warn">
            {w.discoveredA}<strong>{w.needsCheck}</strong>{w.discoveredB}{zh ? '' : ' '}
            <Link href={href('/certification/')} className="link">{w.apply}</Link>{w.end}
          </Note>
        </div>
      )}

      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="indicators">
            <SectionTitle id="indicators" aside={<span className="font-mono text-[12px]">{evaluation.evaluationVersion}</span>}>{w.evaluation}</SectionTitle>
            <EvaluationCards ev={evaluation} core={k === 'core' ? 'core' : 'indexed'} autoPqf={autoPqf} locale={locale} />
          </section>

          <section aria-labelledby="figures">
            <SectionTitle id="figures">{w.figures}</SectionTitle>
            <dl className={`stat-strip grid-cols-2 ${k === 'core' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-y-2`}>
              {/* PCI is a Core Collection indicator: other journals do not show it at all. */}
              {k === 'core' && (
                <Figure w={w}
                  label={w.pci}
                  value={pci?.pci != null ? fmtScore(pci.pci) : null}
                  note={pci?.pci == null ? undefined : <>{pci.pci_window_start_year}–{pci.pci_window_end_year} · {w.citable(fmt(pci.pci_citable_items))}{pci.pci_methodology_version && <> · <span className="font-mono whitespace-nowrap">{pci.pci_methodology_version}</span></>}</>}
                  sample={pci ? sampleLabel(pci.pci_citable_items, w) : null}
                  href={href('/methodology/#pci')}
                />
              )}
              <Figure w={w}
                label={w.pcs}
                value={pcs?.pcs != null ? fmtScore(pcs.pcs) : null}
                note={pcs ? <>{w.supplementary} · {pcs.pcs_window_start_year}–{pcs.pcs_window_end_year} · {w.items(fmt(pcs.pcs_eligible_items))}{pcs.pcs_methodology_version && <> · <span className="font-mono whitespace-nowrap">{pcs.pcs_methodology_version}</span></>}</> : undefined}
                sample={pcs ? sampleLabel(pcs.pcs_eligible_items, w) : null}
                href={href('/methodology/#pcs')}
              />
              <Figure w={w}
                label={w.articles}
                value={j.article_count != null ? fmt(j.article_count) : null}
                note={FIELD_BY_KEY.article_count?.source && (zh ? fieldSourceZh(FIELD_BY_KEY.article_count.source) : FIELD_BY_KEY.article_count.source)}
              />
              <div className="flex flex-col min-w-0">
                <dt>{w.subject}</dt>
                {j.psc_category
                  ? <dd className="text-[16px] sm:text-[17px] font-semibold leading-snug mt-1.5" style={{ color: 'var(--ink)' }}>{pscName ?? j.psc_category}</dd>
                  : <dd className="text-[15px] py-1.5" style={{ color: 'var(--soft)' }}>{w.notClassified}</dd>}
                {j.psc_category && <dd className="note"><span className="font-mono">{j.psc_category}</span>{j.psc_confidence && w.confidence(j.psc_confidence)}</dd>}
              </div>
            </dl>
            {oa && (
              <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                {w.openalexStats(<span className="tnum">{fmtScore(oa.two_yr_mean_citedness, 'n/a')}</span>, <span className="tnum">{fmt(oa.h_index)}</span>, citationStats?.fetched_at?.slice(0, 10))}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:row-span-2 lg:col-start-2 lg:row-start-1">
          <div className="panel p-4 space-y-2">
            <p className="text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>{w.more}</p>
            {links}
            <Link href={href('/certificate/')} className="btn w-full justify-start"><Certificate className="h-4 w-4" /> {w.certificate}</Link>
            {issn && <IndexChecks issns={[j.issn_online, j.issn_print].filter((x): x is string => !!x)} />}
          </div>
          <div className="panel p-4 space-y-4 text-[13.5px] hidden lg:block">
            <StatusNotes j={j} k={k} v={v} f={f} locale={locale} />
          </div>
        </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1">
          {!!metrics.rankingHistory?.length && (
            <section aria-labelledby="ranking-history">
              <SectionTitle id="ranking-history">{w.history}</SectionTitle>
              <div className="panel p-4 max-w-[560px]"><RankingHistory rows={metrics.rankingHistory} locale={locale} /></div>
            </section>
          )}

          <section aria-labelledby="details">
            <SectionTitle id="details">{w.details}</SectionTitle>
            <div className="panel overflow-hidden">
              <FieldGroup id="identity" title={w.identity} locale={locale} fields={[
                { k: 'posi_id', value: j.posi_id, mono: true },
                { k: 'issn_online', value: j.issn_online, mono: true },
                { k: 'issn_print', value: j.issn_print, mono: true },
                { k: 'openalex_source_id', value: j.openalex_source_id && (
                  <a href={`https://openalex.org/${j.openalex_source_id}`} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                    {j.openalex_source_id}
                  </a>
                ), mono: true },
                { k: 'title', value: j.title },
                ...(j.alternate_titles?.length ? [{ k: 'alternate_titles', value: j.alternate_titles.map(alternateTitleLabel).join('; ') }] : []),
                { k: 'publisher', value: j.publisher },
                { k: 'registration_country', value: country(j.registration_country) },
              ]} />
              <FieldGroup id="declared" title={w.declared} locale={locale}
                intro={w.declaredIntro}
                fields={[
                  { k: 'country', value: country(j.country) },
                  { k: 'language', value: j.language },
                  { k: 'website_url', value: j.website_url && <a href={j.website_url} className="link break-all" target="_blank" rel="noopener noreferrer">{j.website_url.replace(/^https?:\/\//, '')}</a> },
                  { k: 'frequency', value: j.frequency },
                  { k: 'license', value: j.license },
                  { k: 'peer_review_type', value: j.peer_review_type },
                  { k: 'apc', value: j.apc && (
                    <span className="block">
                      <span className="font-medium">{j.apc.amount === 0 ? w.noApc : `${j.apc.currency} ${j.apc.amount.toLocaleString('en-US')}`}</span>
                      {j.apc.note && <span className="block text-[13px] mt-0.5" style={{ color: 'var(--ink-2)' }}>{j.apc.note}</span>}
                      <span className="block text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        {w.apcStated(<a href={j.apc.source_url} className="link" target="_blank" rel="noopener noreferrer">{w.apcLink}</a>, j.apc.checked_at)}
                      </span>
                    </span>
                  ) },
                ]} />
              <FieldGroup id="observed" title={w.observed} locale={locale} fields={[
                { k: 'open_access', value: j.open_access == null ? w.unknown : j.open_access ? w.yes : w.no },
                { k: 'doaj_status', value: j.doaj_status ? j.doaj_status.replace(/_/g, ' ') : null },
              ]} />
            </div>
          </section>

          {pqf && (
            <section aria-labelledby="pqf">
              <SectionTitle id="pqf" aside={pqf.version}>{w.pqf}</SectionTitle>
              <div className="panel p-5">
                <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {([
                      [w.pqfFactors[0], pqf.subfactors.jtf, 25],
                      [w.pqfFactors[1], pqf.subfactors.mqf, 25],
                      [w.pqfFactors[2], pqf.subfactors.egf, 20],
                      [w.pqfFactors[3], pqf.subfactors.tdf, 15],
                      [w.pqfFactors[4], pqf.subfactors.cvf, 10],
                      [w.pqfFactors[5], pqf.subfactors.rif, 5],
                    ] as const).map(([label, val, max]) => (
                      <li key={label}>
                        <div className="flex items-baseline justify-between gap-3 text-[14px]">
                          <span style={{ color: 'var(--ink)' }}>{label}</span>
                          <span className="tnum shrink-0"><span className="font-semibold">{val}</span><span style={{ color: 'var(--muted)' }}> / {max}</span></span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (val / max) * 100)}%`, background: 'var(--teal)' }} />
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </section>
          )}

          <div className="panel p-4 space-y-4 text-[13.5px] lg:hidden">
            <StatusNotes j={j} k={k} v={v} f={f} locale={locale} />
          </div>
          <div className="panel p-4 text-[13px]">
            <p className="font-medium mb-2" style={{ color: 'var(--ink)' }}>{w.cite}</p>
            <p className="font-mono text-[12px] leading-relaxed break-words" style={{ color: 'var(--ink-2)' }}>
              Panorama Open Scholarly Index. ({new Date().getFullYear()}). {j.title} [journal record{j.posi_id ? `, ${j.posi_id}` : ''}]. https://posi.panorama-sg.com/journal/{j.journal_code}/
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

/** Verification, freshness and collection, each with the rule behind it. */
function StatusNotes({ j, k, v, f, locale }: { j: Journal; k: ReturnType<typeof collectionOf>; v: ReturnType<typeof verificationOf>; f: ReturnType<typeof freshnessOf>; locale: Locale }) {
  const zh = locale === 'zh-Hans'
  const w = WORDS[locale]
  const ver = (zh ? VERIFICATION_ZH : VERIFICATION)[v]
  const fr = (zh ? FRESHNESS_ZH : FRESHNESS)[f]
  const col = (zh ? COLLECTIONS_ZH : COLLECTIONS)[k]
  return (
    <>
      <div>
        <p className="font-medium" style={{ color: 'var(--ink)' }}>{w.verification}{ver.label}</p>
        <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{ver.rule}</p>
      </div>
      <div style={{ borderTop: '1px solid var(--line-soft)' }} className="pt-4">
        <p className="font-medium" style={{ color: 'var(--ink)' }}>{w.freshness}{fr.label}</p>
        <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {w.updated(j.updated_at?.slice(0, 10) || w.unknownDate)}{fr.rule}
        </p>
      </div>
      <div style={{ borderTop: '1px solid var(--line-soft)' }} className="pt-4">
        <p className="font-medium" style={{ color: 'var(--ink)' }}>{col.label}</p>
        <p className="mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{col.description}</p>
      </div>
      <Link href={localizedHref(locale, '/docs/provenance/')} className="link text-[13px] inline-block">{w.howStates}</Link>
    </>
  )
}
