import { RatingsView, ratingsMetadata } from '@/components/views/docs/RatingsView'

export const metadata = ratingsMetadata('zh-Hans')

export default function Page() {
  return <RatingsView locale="zh-Hans" />
}
