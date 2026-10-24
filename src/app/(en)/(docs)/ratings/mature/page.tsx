import { AjrMatureView, ajrMatureMetadata } from '@/components/views/docs/AjrMatureView'

export const metadata = ajrMatureMetadata('en')

export default function Page() {
  return <AjrMatureView locale="en" />
}
