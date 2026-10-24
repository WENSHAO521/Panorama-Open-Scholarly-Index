import { PrivacyView, privacyMetadata } from '@/components/views/docs/PrivacyView'

export const metadata = privacyMetadata('en')

export default function Page() {
  return <PrivacyView locale="en" />
}
