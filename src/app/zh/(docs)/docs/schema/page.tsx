import { SchemaView, schemaMetadata } from '@/components/views/docs/SchemaView'

export const metadata = schemaMetadata('zh-Hans')

export default function Page() {
  return <SchemaView locale="zh-Hans" />
}
