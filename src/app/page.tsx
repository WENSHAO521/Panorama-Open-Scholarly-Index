import { HomePage } from '@/components/HomePage'
import { homeMetadata } from '@/lib/i18n/metadata'

export const metadata = homeMetadata('en')

export default function Page() {
  return <HomePage locale="en" />
}
