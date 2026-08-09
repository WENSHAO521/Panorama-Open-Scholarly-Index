import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS, getJournalByCode } from '@/lib/data'
import { generateCertificatePdf } from '@/lib/certificate-pdf'

// Core Collection only — same eligibility rule as the badge system
// (src/app/api/badge/[code]/*/route.ts): a certificate of inclusion can
// only exist for journals actually in the Core Collection.
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
  const pdfBytes = await generateCertificatePdf(journal)
  return new Response(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
