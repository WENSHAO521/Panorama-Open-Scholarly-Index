import { PciView, pciMetadata } from '@/components/views/docs/PciView'

export const metadata = pciMetadata('zh-Hans')

export default function Page() {
  return <PciView locale="zh-Hans" />
}
