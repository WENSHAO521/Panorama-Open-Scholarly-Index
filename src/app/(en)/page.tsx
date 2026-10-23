import { HomePage, homeMetadata } from '@/components/HomePage'

export const metadata = homeMetadata('en')

export default function Page() {
  return <HomePage locale="en" />
}
