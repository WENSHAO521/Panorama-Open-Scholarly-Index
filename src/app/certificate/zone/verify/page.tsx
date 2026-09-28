import { Suspense } from 'react'
import { ZoneCertificateVerifier } from '@/components/ZoneCertificateVerifier'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Verify a zone certificate',
  description: 'Check that a POSI zone certificate matches the journal’s zones in the current Journal Rankings.',
  alternates: { canonical: '/certificate/zone/verify/' },
}

export default function VerifyZoneCertificatePage() {
  return (
    <div className="wrap pb-10">
      <PageHeader title="Verify a zone certificate" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Certificate', href: '/certificate/' }, { label: 'Zone', href: '/certificate/zone/' }, { label: 'Verify' }]}>
        <p className="max-w-[65ch]">Opened from the certificate&apos;s QR code, this page checks the certificate against the journal&apos;s current ranking record.</p>
      </PageHeader>
      <Suspense fallback={null}>
        <ZoneCertificateVerifier />
      </Suspense>
    </div>
  )
}
