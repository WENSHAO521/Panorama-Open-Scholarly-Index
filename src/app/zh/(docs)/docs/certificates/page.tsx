import { CertificatesDocView, certificatesDocMetadata } from '@/components/views/docs/CertificatesDocView'

export const metadata = certificatesDocMetadata('zh-Hans')

export default function Page() {
  return <CertificatesDocView locale="zh-Hans" />
}
