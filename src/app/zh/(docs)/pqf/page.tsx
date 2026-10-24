import { PqfView, pqfMetadata } from '@/components/views/docs/PqfView'

export const metadata = pqfMetadata('zh-Hans')

export default function Page() {
  return <PqfView locale="zh-Hans" />
}
