import { PublicationsView, publicationsMetadata } from '@/components/views/PublicationsView'

export const metadata = publicationsMetadata('en')

export default function Page() {
  return <PublicationsView locale="en" />
}
