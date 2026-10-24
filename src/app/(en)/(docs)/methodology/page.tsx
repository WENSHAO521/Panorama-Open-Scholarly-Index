import { MethodologyView, methodologyMetadata } from '@/components/views/docs/MethodologyView'

export const metadata = methodologyMetadata('en')

export default function Page() {
  return <MethodologyView locale="en" />
}
