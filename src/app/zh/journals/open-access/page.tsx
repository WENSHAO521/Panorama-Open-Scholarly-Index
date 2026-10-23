import { OpenAccessView, openAccessMetadata } from '@/components/views/OpenAccessView'

export const metadata = openAccessMetadata('zh-Hans')

export default function Page() {
  return <OpenAccessView locale="zh-Hans" />
}
