import { VerifyZoneCertificateView, verifyZoneCertificateMetadata } from '@/components/views/CertificateView'

export const metadata = verifyZoneCertificateMetadata('en')

export default function Page() {
  return <VerifyZoneCertificateView locale="en" />
}
