import { PublishersView, publishersMetadata } from '@/components/views/PublishersView'

export const metadata = publishersMetadata('en')

export default function Page() {
  return <PublishersView locale="en" />
}
