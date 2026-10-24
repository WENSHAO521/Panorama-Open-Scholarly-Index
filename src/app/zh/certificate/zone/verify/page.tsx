import { VerifyZoneCertificateView, verifyZoneCertificateMetadata } from '@/components/views/CertificateView'

export const metadata = verifyZoneCertificateMetadata('zh-Hans')

export default function Page() {
  return <VerifyZoneCertificateView locale="zh-Hans" />
}
