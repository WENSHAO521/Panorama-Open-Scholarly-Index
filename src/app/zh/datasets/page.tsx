import { DatasetsView, datasetsMetadata } from '@/components/views/DatasetsView'

export const metadata = datasetsMetadata('zh-Hans')

export default function Page() {
  return <DatasetsView locale="zh-Hans" />
}
