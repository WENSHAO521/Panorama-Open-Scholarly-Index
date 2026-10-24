import { DatasetsView, datasetsMetadata } from '@/components/views/DatasetsView'

export const metadata = datasetsMetadata('en')

export default function Page() {
  return <DatasetsView locale="en" />
}
