import { EditorialPolicyView, editorialPolicyMetadata } from '@/components/views/docs/EditorialPolicyView'

export const metadata = editorialPolicyMetadata('zh-Hans')

export default function Page() {
  return <EditorialPolicyView locale="zh-Hans" />
}
