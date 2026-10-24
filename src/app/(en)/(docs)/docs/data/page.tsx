import { DataAccessView, dataAccessMetadata } from '@/components/views/docs/DataAccessView'

export const metadata = dataAccessMetadata('en')

export default function Page() {
  return <DataAccessView locale="en" />
}
