import { CertificateView, certificateMetadata } from '@/components/views/CertificateView'

export const metadata = certificateMetadata('en')

export default function Page() {
  return <CertificateView locale="en" />
}
