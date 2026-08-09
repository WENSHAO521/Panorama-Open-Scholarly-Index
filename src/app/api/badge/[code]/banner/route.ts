import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getJournalByCode } from '@/lib/data'
import { badgeBannerSvg } from '@/lib/badge-svg'

export async function generateStaticParams() {
  const journals = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]
  return journals.map(j => ({ code: j.journal_code }))
}

export const dynamicParams = false

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const journal = getJournalByCode(code)
  if (!journal || journal.id.startsWith('j-disc-')) {
    return new Response('Not a POSI Core Collection journal', { status: 404 })
  }
  return new Response(badgeBannerSvg(journal), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}
