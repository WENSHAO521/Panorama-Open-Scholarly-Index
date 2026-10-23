import { CertificateView, certificateMetadata } from '@/components/views/CertificateView'

export const metadata = certificateMetadata('zh-Hans')

export default function Page() {
  return <CertificateView locale="zh-Hans" />
}
