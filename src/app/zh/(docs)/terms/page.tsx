import { TermsView, termsMetadata } from '@/components/views/docs/TermsView'

export const metadata = termsMetadata('zh-Hans')

export default function Page() {
  return <TermsView locale="zh-Hans" />
}
