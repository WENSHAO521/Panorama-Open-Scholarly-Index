import { DocsHomeView, docsHomeMetadata } from '@/components/views/docs/DocsHomeView'

export const metadata = docsHomeMetadata('en')

export default function Page() {
  return <DocsHomeView locale="en" />
}
