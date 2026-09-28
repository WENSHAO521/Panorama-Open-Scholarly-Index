import { getCoreCollection } from '@/lib/data'
import { generateCertificatePdf } from '@/lib/certificate-pdf'

// Core Collection journals only: the certificate asserts current
// certification, so a journal outside the Core Collection has none.
export async function generateStaticParams() {
  return getCoreCollection().map(j => ({ code: j.journal_code }))
}

export const dynamicParams = false

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const journal = getCoreCollection().find(j => j.journal_code === code)
  if (!journal) {
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
