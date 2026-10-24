import { RatingsView, ratingsMetadata } from '@/components/views/docs/RatingsView'

export const metadata = ratingsMetadata('en')

export default function Page() {
  return <RatingsView locale="en" />
}
