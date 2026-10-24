import { PqfView, pqfMetadata } from '@/components/views/docs/PqfView'

export const metadata = pqfMetadata('en')

export default function Page() {
  return <PqfView locale="en" />
}
