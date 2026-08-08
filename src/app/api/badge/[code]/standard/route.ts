import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getJournalByCode } from '@/lib/data'
import { badgeStandardSvg } from '@/lib/badge-svg'

// Core Collection only — the same manually-reviewed set used by /citation-reports.
// Auto-discovered/unreviewed records are excluded: badge eligibility is a Core
// Collection feature, not extended to unverified data.
export async function generateStaticParams() {
  const journals = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
  return journals.map(j => ({ code: j.journal_code }))
}

// Any code not returned by generateStaticParams() 404s — this is the actual
// enforcement mechanism for "badges are only available to indexed journals",
// not just a UI-level notice.
export const dynamicParams = false

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const journal = getJournalByCode(code)
  if (!journal || journal.id.startsWith('j-disc-')) {
    return new Response('Not a POSI Core Collection journal', { status: 404 })
  }
  return new Response(badgeStandardSvg(journal), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}
