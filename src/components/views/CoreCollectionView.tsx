// The Core Collection (/core-collection/), in every language it is published in.
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCoreCollection } from '@/lib/data'
import { getJournalRanking, categoryName, RANKING_AVAILABLE } from '@/lib/rankings'
import { ajrOf } from '@/lib/evaluation/journal'
import { getPQFStatus, PQF_DISCLAIMER, type PqfStatus } from '@/lib/evaluation/rules'
import { fmtScore, pqfStatusLabel } from '@/lib/evaluation/display'
import { QuartileBadge, ZoneBadge } from '@/components/Evaluation'
import { PageHeader, fmt } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { fill, subjectName } from '@/i18n/format'
import { countryNameIn } from '@/i18n/places'

const en = {
  title: 'Core Collection',
  description: 'Journals certified for the POSI Core Collection after editorial evaluation under the POSI Quality Framework.',
  journals: 'Journals',
  apply: 'Apply for certification',
  leadA: 'Journals that applied for certification and passed editorial evaluation under the POSI Quality Framework. Every other journal registered with Crossref or OpenAlex is indexed in the ',
  directory: 'journal directory',
  leadB: '. Admission criteria are set out in the ',
  policy: 'editorial policy',
  leadC: '.',
  stats: { certified: 'Certified journals', ranked: 'With a Citation Ranking', rated: 'Rated by AJR', publishers: 'Publishers' },
  cols: { journal: 'Journal', publisher: 'Publisher', issn: 'ISSN', subject: 'Subject', pqf: 'PQF', ajr: 'AJR', pnci: 'PNCI', quartile: 'Citation Quartile', zone: 'POSI Zone' },
  sep: ', ',
  unclassified: 'Not yet classified',
  rating: '{model} · Rating {r}', observation: 'Observation', ajrMUnrated: 'AJR-M not yet rated', notRated: 'Not rated',
  pqf: null as Record<PqfStatus, string> | null,
  notAssessed: 'Not assessed',
  noteA: `PQF shows the Core Collection eligibility status. ${PQF_DISCLAIMER} AJR is the lifecycle rating (A+ to D). Citation Quartile (C-Q1 to C-Q4) and POSI Zone come from the journal’s PNCI percentile within its PSC category`,
  notePending: '; they are added here once the first ranking edition is published',
  noteB: '. See ',
  methodology: 'methodology',
  noteC: '.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    title: '核心合集',
    description: '依据 POSI 质量框架（PQF）经编辑评审、获准进入 POSI 核心合集的认证期刊。',
    journals: '期刊',
    apply: '申请认证',
    leadA: '核心合集收录主动申请认证、并通过 POSI 质量框架编辑评审的期刊。在 Crossref 或 OpenAlex 注册的其他期刊均收录于',
    directory: '期刊目录',
    leadB: '。准入标准详见',
    policy: '编辑政策',
    leadC: '。',
    stats: { certified: '认证期刊', ranked: '有引文排名', rated: '已获 AJR 评级', publishers: '出版商' },
    cols: { journal: '期刊', publisher: '出版商', issn: 'ISSN', subject: '学科', pqf: 'PQF', ajr: 'AJR', pnci: 'PNCI', quartile: '引文分区', zone: 'POSI Zone' },
    sep: '，',
    unclassified: '尚未分类',
    rating: '{model} · 评级 {r}', observation: '观察期', ajrMUnrated: 'AJR-M 尚未评级', notRated: '未评级',
    pqf: { eligible: '符合条件', review_required: '需复核', insufficient_evidence: '证据不足', not_eligible: '不符合条件' },
    notAssessed: '未评估',
    noteA: 'PQF 列显示核心合集准入状态。PQF 是准入资格与质量框架评估，并非引文排名指标，不决定引文分区或 POSI Zone。AJR 为期刊生命周期评级（A+ 至 D）。引文分区（C-Q1 至 C-Q4）与 POSI Zone 依据期刊在其 PSC 类别内的 PNCI 百分位划定',
    notePending: '，将在首个排名版本发布后列入本表',
    noteB: '。详见',
    methodology: '评价方法',
    noteC: '。',
  },
}

export function coreCollectionMetadata(locale: Locale): Metadata {
  const w = WORDS[locale]
  return { title: w.title, description: w.description, alternates: pageAlternates('/core-collection/', locale) }
}

export function CoreCollectionView({ locale }: { locale: Locale }) {
  const w = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const pqfLabel = (s: PqfStatus | null | undefined) => (w.pqf ? (s ? w.pqf[s] : w.notAssessed) : pqfStatusLabel(s))
  const journals = getCoreCollection().slice().sort((a, b) => a.title.localeCompare(b.title))
  const rows = journals.map(j => ({ j, r: getJournalRanking(j.posi_id) }))
  const ranked = rows.filter(x => x.r?.rank != null).length

  return (
    <div className="wrap pb-12">
      <PageHeader
        locale={locale}
        title={w.title}
        crumbs={[{ label: 'POSI', href: href('/') }, { label: w.journals, href: href('/journals/') }, { label: w.title }]}
        actions={<Link href={href('/certification/')} className="btn btn-primary">{w.apply}</Link>}
      >
        <p className="max-w-[68ch]">
          {w.leadA}<Link href={href('/journals/')} className="link">{w.directory}</Link>{w.leadB}
          <Link href={href('/editorial-policy/#certification')} className="link">{w.policy}</Link>{w.leadC}
        </p>
      </PageHeader>

      <dl className="stat-strip grid-cols-2 sm:grid-cols-3 max-w-[720px]">
        {[
          [w.stats.certified, fmt(journals.length)],
          // Before the first ranking edition this would always read 0.
          RANKING_AVAILABLE ? [w.stats.ranked, fmt(ranked)] : [w.stats.rated, fmt(journals.filter(j => ajrOf(j).rating).length)],
          [w.stats.publishers, fmt(new Set(journals.map(j => j.publisher)).size)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mt-1 figure text-[24px]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="panel overflow-x-auto mt-8">
        <table className="dtable">
          <thead>
            <tr>
              <th>{w.cols.journal}</th>
              <th>{w.cols.publisher}</th>
              <th>{w.cols.issn}</th>
              <th>{w.cols.subject}</th>
              <th>{w.cols.pqf}</th>
              <th>{w.cols.ajr}</th>
              {RANKING_AVAILABLE && <>
                <th className="text-right">{w.cols.pnci}</th>
                <th>{w.cols.quartile}</th>
                <th>{w.cols.zone}</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ j, r }) => {
              const country = countryNameIn(locale, j.registration_country || j.country)
              const a = ajrOf(j)
              return (
                <tr key={j.id}>
                  <td className="min-w-[240px]">
                    <Link href={href(`/journal/${j.journal_code}/`)} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>{j.title}</Link>
                  </td>
                  <td className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>
                    {j.publisher}
                    {country && <span style={{ color: 'var(--muted)' }}>{w.sep}{country}</span>}
                  </td>
                  <td className="font-mono text-[12.5px] whitespace-nowrap">{j.issn_online ?? j.issn_print ?? '-'}</td>
                  <td className="text-[13px]">{j.psc_category ? subjectName(locale, j.psc_category, categoryName(j.psc_category) ?? j.psc_category) : <span style={{ color: 'var(--muted)' }}>{w.unclassified}</span>}</td>
                  <td className="text-[13px] whitespace-nowrap">{pqfLabel(getPQFStatus((j.pqf ?? j.ojqf)?.total))}</td>
                  <td className="text-[13px] whitespace-nowrap">{a.rating ? fill(w.rating, { model: a.model ?? '', r: a.rating }) : <span style={{ color: 'var(--muted)' }}>{a.lifecycle === 'observation' ? w.observation : a.model === 'AJR-M' ? w.ajrMUnrated : w.notRated}</span>}</td>
                  {RANKING_AVAILABLE && <>
                    <td className="text-right font-mono tnum text-[13px]">{fmtScore(r?.pnci, '-')}</td>
                    <td><QuartileBadge q={r?.q} provisional={r?.status === 'provisional'} locale={locale} /></td>
                    <td><ZoneBadge z={r?.zone} status={r?.zoneStatus} locale={locale} /></td>
                  </>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {w.noteA}{RANKING_AVAILABLE ? '' : w.notePending}{w.noteB}<Link href={href('/methodology/')} className="link">{w.methodology}</Link>{w.noteC}
      </p>
    </div>
  )
}
