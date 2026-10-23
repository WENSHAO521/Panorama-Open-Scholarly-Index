import { PublishersView, publishersMetadata } from '@/components/views/PublishersView'

export const metadata = publishersMetadata('zh-Hans')

export default function Page() {
  return <PublishersView locale="zh-Hans" />
}
