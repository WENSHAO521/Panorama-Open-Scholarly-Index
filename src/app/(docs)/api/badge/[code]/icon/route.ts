import { getJournalByCode, getCoreCollection, getCandidateJournals } from '@/lib/data'
import { badgeIconSvg } from '@/lib/badge-svg'

export async function generateStaticParams() {
  const journals = [...getCoreCollection(), ...getCandidateJournals()]
  return journals.map(j => ({ code: j.journal_code }))
}

export const dynamicParams = false

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const journal = getJournalByCode(code)
  if (!journal || journal.id.startsWith('j-disc-')) {
    return new Response('Not a POSI Core Collection or candidate journal', { status: 404 })
  }
  return new Response(badgeIconSvg(journal), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}
