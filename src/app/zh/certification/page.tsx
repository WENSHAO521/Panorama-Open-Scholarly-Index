import { CertificationView, certificationMetadata } from '@/components/views/CertificationView'

export const metadata = certificationMetadata('zh-Hans')

export default function Page() {
  return <CertificationView locale="zh-Hans" />
}
