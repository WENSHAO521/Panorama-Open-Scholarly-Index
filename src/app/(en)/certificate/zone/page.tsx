import Link from 'next/link'
import { Suspense } from 'react'
import { ZoneCertificateTool } from '@/components/ZoneCertificateTool'
import { PageHeader } from '@/components/db'

export const metadata = {
  title: 'Zone certificate',
  description: 'Issue a verifiable certificate of a journal’s official POSI Zone (POSI 分区): its PNCI percentile zone within its PSC category. Free and immediate.',
}

export default function ZoneCertificatePage() {
  return (
    <div className="wrap pb-10">
      <div className="no-print">
        <PageHeader title="Zone certificate" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Certificate', href: '/certificate/' }, { label: 'Zone' }]}>
          <p className="max-w-[68ch]">
            A certificate of the journal&apos;s POSI Zone (POSI 分区) in the current Citation Ranking: the zone of its PNCI
            percentile within its PSC subject category. It is issued for every journal with an official zone and can be
            verified by anyone from its QR code. See <Link href="/docs/certificates/#zone-certificates" className="link">how zone certificates work</Link>.
          </p>
        </PageHeader>
      </div>
      <Suspense fallback={null}>
        <ZoneCertificateTool />
      </Suspense>
    </div>
  )
}
