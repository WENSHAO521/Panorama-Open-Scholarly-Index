import { ZoneCertificateView, zoneCertificateMetadata } from '@/components/views/CertificateView'

export const metadata = zoneCertificateMetadata('zh-Hans')

export default function Page() {
  return <ZoneCertificateView locale="zh-Hans" />
}
