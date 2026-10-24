import { ProvenanceView, provenanceMetadata } from '@/components/views/docs/ProvenanceView'

export const metadata = provenanceMetadata('zh-Hans')

export default function Page() {
  return <ProvenanceView locale="zh-Hans" />
}
