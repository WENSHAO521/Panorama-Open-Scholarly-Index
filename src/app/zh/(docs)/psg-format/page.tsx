import { PsgFormatView, psgFormatMetadata } from '@/components/views/docs/PsgFormatView'

export const metadata = psgFormatMetadata('zh-Hans')

export default function Page() {
  return <PsgFormatView locale="zh-Hans" />
}
