import { VerifyCertificateView, verifyCertificateMetadata } from '@/components/views/CertificateView'

export const metadata = verifyCertificateMetadata('zh-Hans')

export default function Page() {
  return <VerifyCertificateView locale="zh-Hans" />
}
