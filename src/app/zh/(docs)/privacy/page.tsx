import { PrivacyView, privacyMetadata } from '@/components/views/docs/PrivacyView'

export const metadata = privacyMetadata('zh-Hans')

export default function Page() {
  return <PrivacyView locale="zh-Hans" />
}
