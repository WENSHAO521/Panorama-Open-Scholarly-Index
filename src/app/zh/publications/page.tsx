import { PublicationsView, publicationsMetadata } from '@/components/views/PublicationsView'

export const metadata = publicationsMetadata('zh-Hans')

export default function Page() {
  return <PublicationsView locale="zh-Hans" />
}
