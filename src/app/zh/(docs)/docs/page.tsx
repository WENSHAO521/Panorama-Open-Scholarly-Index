import { DocsHomeView, docsHomeMetadata } from '@/components/views/docs/DocsHomeView'

export const metadata = docsHomeMetadata('zh-Hans')

export default function Page() {
  return <DocsHomeView locale="zh-Hans" />
}
