import { ZoneCertificateView, zoneCertificateMetadata } from '@/components/views/CertificateView'

export const metadata = zoneCertificateMetadata('en')

export default function Page() {
  return <ZoneCertificateView locale="en" />
}
