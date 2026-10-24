import { ProvenanceView, provenanceMetadata } from '@/components/views/docs/ProvenanceView'

export const metadata = provenanceMetadata('en')

export default function Page() {
  return <ProvenanceView locale="en" />
}
