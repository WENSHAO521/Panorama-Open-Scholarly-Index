import { CertificationView, certificationMetadata } from '@/components/views/CertificationView'

export const metadata = certificationMetadata('en')

export default function Page() {
  return <CertificationView locale="en" />
}
