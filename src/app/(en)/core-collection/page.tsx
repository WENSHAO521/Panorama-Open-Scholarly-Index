import { CoreCollectionView, coreCollectionMetadata } from '@/components/views/CoreCollectionView'

export const metadata = coreCollectionMetadata('en')

export default function Page() {
  return <CoreCollectionView locale="en" />
}
