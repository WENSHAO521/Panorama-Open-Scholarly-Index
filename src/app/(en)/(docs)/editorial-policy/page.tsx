import { EditorialPolicyView, editorialPolicyMetadata } from '@/components/views/docs/EditorialPolicyView'

export const metadata = editorialPolicyMetadata('en')

export default function Page() {
  return <EditorialPolicyView locale="en" />
}
