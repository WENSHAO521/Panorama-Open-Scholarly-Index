import { PsgFormatView, psgFormatMetadata } from '@/components/views/docs/PsgFormatView'

export const metadata = psgFormatMetadata('en')

export default function Page() {
  return <PsgFormatView locale="en" />
}
