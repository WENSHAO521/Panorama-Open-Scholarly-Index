import { ResponsibleUseView, responsibleUseMetadata } from '@/components/views/docs/ResponsibleUseView'

export const metadata = responsibleUseMetadata('en')

export default function Page() {
  return <ResponsibleUseView locale="en" />
}
