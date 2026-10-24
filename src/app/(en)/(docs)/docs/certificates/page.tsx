import { CertificatesDocView, certificatesDocMetadata } from '@/components/views/docs/CertificatesDocView'

export const metadata = certificatesDocMetadata('en')

export default function Page() {
  return <CertificatesDocView locale="en" />
}
