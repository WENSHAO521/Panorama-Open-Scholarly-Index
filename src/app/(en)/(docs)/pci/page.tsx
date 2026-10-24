import { PciView, pciMetadata } from '@/components/views/docs/PciView'

export const metadata = pciMetadata('en')

export default function Page() {
  return <PciView locale="en" />
}
