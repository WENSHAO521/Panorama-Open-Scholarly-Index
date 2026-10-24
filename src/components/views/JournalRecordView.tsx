// Static journal record pages (/journal/<code>/), in every language they are published in: English for every
// Core, curated and Benchmark record, Simplified Chinese for the Core Collection (see TRANSLATED_PATHS).
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { collectionOf } from '@/lib/records'
import { getStaticRecordJournals } from '@/lib/records-data'
import { getPcsEntry } from '@/lib/pcs'
import { getPciEntry } from '@/lib/pci'
import { getCitationStats } from '@/lib/citation-stats'
import psc from '@/lib/psc-v1.0.snapshot.json'
import { RecordView } from '@/components/RecordView'
import { getCitationRecord, getPcsValue, categoryName } from '@/lib/rankings'
import { getRankingHistory } from '@/lib/ranking-editions'
import { buildJournalEvaluation } from '@/lib/evaluation/journal'
import Link from 'next/link'
import { Certificate, ChartLine, FilePdf } from '@phosphor-icons/react/dist/ssr'
import { dataUrl } from '@/lib/data-base'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'
import { subjectName } from '@/i18n/format'

// Core, other curated and Global Benchmark records get a static page. Discovered
// records (~24k) are served by the in-browser viewer at /record/ to stay
// inside Cloudflare Pages' 20,000-file limit.
export function journalRecordParams(locale: Locale) {
  const journals = locale === 'en' ? getStaticRecordJournals() : getStaticRecordJournals().filter(j => collectionOf(j) === 'core')
  return journals.map(j => ({ code: j.journal_code }))
}

function find(code: string) {
  return getStaticRecordJournals().find(j => j.journal_code === code)
}

export function journalRecordMetadata(code: string, locale: Locale): Metadata {
  const j = find(code)
  if (!j) return { title: locale === 'zh-Hans' ? '未找到记录' : 'Record not found' }
  const issn = j.issn_online ? (locale === 'zh-Hans' ? `（eISSN ${j.issn_online}）` : ` (eISSN ${j.issn_online})`) : ''
  return {
    title: j.title,
    description: locale === 'zh-Hans'
      ? `${j.title}${issn}的 POSI 期刊记录：标识符、核心合集状态、PQF、AJR 评级（核心合集期刊）、PNCI 引文排名与数据溯源。`
      : `POSI journal record for ${j.title}${issn}: identifiers, Core Collection status, PQF, AJR rating (Core Collection journals), PNCI citation ranking and provenance.`,
    alternates: pageAlternates(`/journal/${j.journal_code}/`, locale),
  }
}

const LINKS = {
  en: { profile: 'Publications and citations by year', zone: 'Zone certificate', certification: 'Certification certificate (PDF)' },
  'zh-Hans': { profile: '逐年发文量与被引量', zone: 'POSI Zone 证书', certification: '认证证书（PDF）' },
}

const PSC_NAME: Record<string, string> = Object.fromEntries(psc.categories.map(c => [c.code, c.name]))

export function JournalRecordView({ code, locale }: { code: string; locale: Locale }) {
  const w = LINKS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const j = find(code)
  if (!j) notFound()
  const record = getCitationRecord(j.posi_id)
  const pcs = getPcsEntry(j.posi_id)
  const pci = getPciEntry(j.posi_id)
  const evaluation = buildJournalEvaluation({
    journal: j, ranking: record, pci: pci?.pci ?? null, pcs: pcs?.pcs ?? getPcsValue(j.posi_id),
    categoryName: categoryName(record?.ranking_category_id ?? null),
  })

  const issn = j.issn_online ?? j.issn_print

  return (
    <div className="wrap pb-12">
      <RecordView
        locale={locale}
        journal={j}
        jsonHref={dataUrl(`journal/${j.journal_code}.json`)}
        metrics={{
          pcs,
          pci,
          citationStats: getCitationStats(j.journal_code),
          pscName: j.psc_category && PSC_NAME[j.psc_category] ? subjectName(locale, j.psc_category, PSC_NAME[j.psc_category]) : null,
          evaluation,
          rankingHistory: getRankingHistory(j.posi_id),
        }}
        links={issn && (
          <>
            <Link href={href(`/journal/?issn=${issn}`)} className="btn btn-primary w-full justify-start"><ChartLine className="h-4 w-4" /> {w.profile}</Link>
            {evaluation.ranking.zone != null && (
              <Link href={href(`/certificate/zone/?issn=${issn}`)} className="btn w-full justify-start" prefetch={false}><Certificate className="h-4 w-4" /> {w.zone}</Link>
            )}
            {collectionOf(j) === 'core' && (
              <a href={`/api/certificate/${j.journal_code}/pdf`} className="btn w-full justify-start" target="_blank" rel="noopener"><FilePdf className="h-4 w-4" /> {w.certification}</a>
            )}
          </>
        )}
      />
    </div>
  )
}
