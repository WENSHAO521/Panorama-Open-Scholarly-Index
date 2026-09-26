import { Suspense } from 'react'
import { CertificateVerifier } from '@/components/CertificateVerifier'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Verify a certificate',
  description: 'Check that a POSI indexing certificate is unaltered and that every listed publication is still indexed.',
}

export default function VerifyCertificatePage() {
  return (
    <div className="wrap pb-10">
      <PageHeader title="Verify a certificate" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Certificate', href: '/certificate/' }, { label: 'Verify' }]}>
        <p className="max-w-[65ch]">Open this page from the certificate&apos;s QR code, or paste its verification address.</p>
      </PageHeader>
      <Suspense fallback={null}>
        <CertificateVerifier />
      </Suspense>
    </div>
  )
}
