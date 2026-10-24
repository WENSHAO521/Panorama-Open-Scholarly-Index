import { DataAccessView, dataAccessMetadata } from '@/components/views/docs/DataAccessView'

export const metadata = dataAccessMetadata('zh-Hans')

export default function Page() {
  return <DataAccessView locale="zh-Hans" />
}
