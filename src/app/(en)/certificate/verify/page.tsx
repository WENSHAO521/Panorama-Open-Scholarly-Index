import { VerifyCertificateView, verifyCertificateMetadata } from '@/components/views/CertificateView'

export const metadata = verifyCertificateMetadata('en')

export default function Page() {
  return <VerifyCertificateView locale="en" />
}
