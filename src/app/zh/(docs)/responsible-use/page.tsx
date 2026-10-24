import { ResponsibleUseView, responsibleUseMetadata } from '@/components/views/docs/ResponsibleUseView'

export const metadata = responsibleUseMetadata('zh-Hans')

export default function Page() {
  return <ResponsibleUseView locale="zh-Hans" />
}
