import { Suspense } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, DISCOVERED_JOURNALS } from '@/lib/data'
import { crossrefFetchJournal, issnGetCountry, oaiHarvestJournal } from '@/lib/api'
import { JournalTabs } from '@/components/JournalTabs'

export const metadata = {
  title: 'Journals',
  description: 'Browse PSG journals and indexed third-party journals, or search all journals in Crossref.',
}

const PER_PAGE = 20

export default async function JournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { tab: tabParam = 'psg', page: pageParam = '1' } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam, 10))

  const [psgRows, manualIndexedRows] = await Promise.all([
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
  ])

  // Discovered journals — split by DOAJ status
  const doajConfirmedRows = DISCOVERED_JOURNALS
    .filter(j => j.doaj_status === 'listed')
    .map(j => ({
      journal: j,
      cr: null as null,
      issnCountry: j.registration_country ?? (j.country || null),
      oaiCount: 0,
    }))

  const nonDoajDiscoveredRows = DISCOVERED_JOURNALS
    .filter(j => j.doaj_status !== 'listed')
    .map(j => ({
      journal: j,
      cr: null as null,
      issnCountry: j.registration_country ?? (j.country || null),
      oaiCount: 0,
    }))

  // Indexed tab = manual indexed + DOAJ-confirmed discovered, paginated
  const allIndexedRows = [...manualIndexedRows, ...doajConfirmedRows]
  const indexedTotal = allIndexedRows.length
  const indexedTotalPages = Math.max(1, Math.ceil(indexedTotal / PER_PAGE))
  const indexedPage = Math.min(currentPage, indexedTotalPages)
  const pagedIndexedRows = allIndexedRows.slice((indexedPage - 1) * PER_PAGE, indexedPage * PER_PAGE)

  // Extended Records tab = non-DOAJ discovered, paginated
  const discoveredTotal = nonDoajDiscoveredRows.length
  const discoveredTotalPages = Math.max(1, Math.ceil(discoveredTotal / PER_PAGE))
  const discoveredPage = Math.min(currentPage, discoveredTotalPages)
  const pagedDiscoveredRows = nonDoajDiscoveredRows.slice((discoveredPage - 1) * PER_PAGE, discoveredPage * PER_PAGE)

  const total = PSG_JOURNALS.length + INDEXED_JOURNALS.length + SHIHARR_JOURNALS.length + OTHER_INDEXED_JOURNALS.length + DISCOVERED_JOURNALS.length
  const totalArticles = [...psgRows, ...manualIndexedRows].reduce(
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

      <Suspense fallback={<div className="text-xs py-8 text-center" style={{ color: 'var(--posi-muted)' }}>Loading journals…</div>}>
        <JournalTabs
          psgRows={psgRows}
          indexedRows={pagedIndexedRows}
          indexedTotal={indexedTotal}
          indexedPage={indexedPage}
          indexedTotalPages={indexedTotalPages}
          discoveredRows={pagedDiscoveredRows}
          discoveredTotal={discoveredTotal}
          discoveredPage={discoveredPage}
          discoveredTotalPages={discoveredTotalPages}
        />
      </Suspense>

      {/* Column legend */}
      <div className="p-4 text-xs flex flex-col sm:flex-row gap-4 mt-8" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: 'var(--posi-muted)' }} />
          <p className="leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
            <strong style={{ color: 'var(--posi-text)' }}>MQS</strong> = Metadata Quality Score (0–100).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>PQF</strong> = POSI Quality Factor (Grade A+→E); <strong style={{ color: '#B45309' }}>PQF*</strong> = auto-assessed from DOAJ signals (pending manual review).{' '}
            <strong style={{ color: 'var(--posi-text)' }}>IRS</strong> = Indexing Readiness Score (A–D).{' '}
            Article counts from OAI-PMH (Crossref fallback).{' '}
            <Link href="/pqf" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>PQF methodology →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
