import { OpenAccessView, openAccessMetadata } from '@/components/views/OpenAccessView'

export const metadata = openAccessMetadata('en')

export default function Page() {
  return <OpenAccessView locale="en" />
}
