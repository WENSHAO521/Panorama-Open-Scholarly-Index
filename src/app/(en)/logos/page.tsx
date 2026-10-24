import { LogosView, logosMetadata } from '@/components/views/LogosView'

export const metadata = logosMetadata('en')

export default function Page() {
  return <LogosView locale="en" />
}
