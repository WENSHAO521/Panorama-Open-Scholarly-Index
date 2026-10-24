import { TermsView, termsMetadata } from '@/components/views/docs/TermsView'

export const metadata = termsMetadata('en')

export default function Page() {
  return <TermsView locale="en" />
}
