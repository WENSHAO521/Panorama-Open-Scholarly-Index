import { Info } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, DISCOVERED_JOURNALS } from '@/lib/data'
import { crossrefFetchJournal, issnGetCountry, oaiHarvestJournal, doajGetJournal } from '@/lib/api'
import { JournalTabs } from '@/components/JournalTabs'

export const metadata = {
  title: 'Journals',
  description: 'Browse PSG journals and indexed third-party journals, or search all journals in Crossref.',
}

export default async function JournalsPage() {
  const [psgRows, indexedRows, discoveredWithDoaj] = await Promise.all([
    Promise.all(
      PSG_JOURNALS.map(async j => {
        const [cr, issnCountry, oaiItems] = await Promise.all([
          j.issn_online ? crossrefFetchJournal(j.issn_online).catch(() => null) : null,
          j.issn_online ? issnGetCountry(j.issn_online).catch(() => null) : null,
          oaiHarvestJournal(j.journal_code).catch(() => []),
        ])
        return { journal: j, cr, issnCountry, oaiCount: oaiItems.length }
      })
    ),
    Promise.all(
      [...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS].map(async j => {
        const [cr, issnCountry, oaiItems] = await Promise.all([
          j.issn_online ? crossrefFetchJournal(j.issn_online).catch(() => null) : null,
          j.issn_online ? issnGetCountry(j.issn_online).catch(() => null) : null,
          oaiHarvestJournal(j.journal_code).catch(() => []),
        ])
        return { journal: j, cr, issnCountry, oaiCount: oaiItems.length }
      })
    ),
    Promise.all(
      DISCOVERED_JOURNALS.map(async j => {
        const doajResult = j.issn_online ? await doajGetJournal(j.issn_online).catch(() => null) : null
        const inDoaj = doajResult?.in_doaj ?? false
        // For DOAJ-confirmed journals, also fetch Crossref meta for publisher_location
        const cr = (inDoaj && j.issn_online) ? await crossrefFetchJournal(j.issn_online).catch(() => null) : null
        const ISO_COUNTRY: Record<string, string> = {
          AF:'Afghanistan',AR:'Argentina',AT:'Austria',AU:'Australia',BE:'Belgium',BR:'Brazil',
          CA:'Canada',CH:'Switzerland',CN:'China',CZ:'Czech Republic',DE:'Germany',DK:'Denmark',
          EG:'Egypt',ES:'Spain',FI:'Finland',FR:'France',GB:'United Kingdom',GR:'Greece',
          HR:'Croatia',HU:'Hungary',ID:'Indonesia',IE:'Ireland',IL:'Israel',IN:'India',
          IR:'Iran',IT:'Italy',JP:'Japan',KR:'South Korea',MX:'Mexico',MY:'Malaysia',
          NL:'Netherlands',NO:'Norway',NZ:'New Zealand',PH:'Philippines',PL:'Poland',
          PT:'Portugal',RO:'Romania',RS:'Serbia',RU:'Russia',SA:'Saudi Arabia',SE:'Sweden',
          SG:'Singapore',SI:'Slovenia',SK:'Slovakia',TH:'Thailand',TR:'Turkey',
          TW:'Taiwan',UA:'Ukraine',US:'United States',ZA:'South Africa',
        }
        const doajCountry = doajResult?.publisher_country_code ? (ISO_COUNTRY[doajResult.publisher_country_code] ?? doajResult.publisher_country_code) : null
        const issnCountry = cr?.publisher_location ?? doajCountry ?? null
        return { journal: j, cr, issnCountry, oaiCount: 0, inDoaj }
      })
    ),
  ])

  const doajConfirmed = discoveredWithDoaj.filter(r => r.inDoaj).map(({ journal, cr, issnCountry, oaiCount }) => ({ journal, cr, issnCountry, oaiCount }))
  const discoveredRows = discoveredWithDoaj.filter(r => !r.inDoaj).map(({ journal, cr, issnCountry, oaiCount }) => ({ journal, cr, issnCountry, oaiCount }))
  const allIndexedRows = [...indexedRows, ...doajConfirmed]

  const total = PSG_JOURNALS.length + INDEXED_JOURNALS.length + SHIHARR_JOURNALS.length + OTHER_INDEXED_JOURNALS.length + DISCOVERED_JOURNALS.length
  const totalArticles = [...psgRows, ...allIndexedRows].reduce(
    (s, { oaiCount, cr, journal }) => s + (oaiCount > 0 ? oaiCount : (cr?.total_dois ?? journal.article_count)), 0
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--posi-border)' }}>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--posi-text)' }}>Journals</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--posi-muted)' }}>
            {total} journals · {totalArticles.toLocaleString()} articles
          </p>
        </div>
      </div>

      <JournalTabs psgRows={psgRows} indexedRows={allIndexedRows} discoveredRows={discoveredRows} />

      {/* Column legend */}
      <div className="p-4 text-xs flex flex-col sm:flex-row gap-4 mt-8" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: 'var(--posi-muted)' }} />
          <p className="leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            <strong style={{ color: 'var(--posi-text)' }}>MQS</strong> = Metadata Quality Score (0–100).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>PQF</strong> = POSI Quality Factor (Grade A+→E).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>IRS</strong> = Indexing Readiness Score (A–D).{' '}
            Article counts from OAI-PMH (Crossref fallback).{' '}
            <Link href="/pqf" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>PQF methodology →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
