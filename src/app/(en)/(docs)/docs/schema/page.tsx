import { SchemaView, schemaMetadata } from '@/components/views/docs/SchemaView'

export const metadata = schemaMetadata('en')

export default function Page() {
  return <SchemaView locale="en" />
}
