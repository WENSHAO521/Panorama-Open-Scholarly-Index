import { CoreCollectionView, coreCollectionMetadata } from '@/components/views/CoreCollectionView'

export const metadata = coreCollectionMetadata('zh-Hans')

export default function Page() {
  return <CoreCollectionView locale="zh-Hans" />
}
