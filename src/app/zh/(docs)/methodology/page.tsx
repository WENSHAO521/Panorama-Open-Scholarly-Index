import { MethodologyView, methodologyMetadata } from '@/components/views/docs/MethodologyView'

export const metadata = methodologyMetadata('zh-Hans')

export default function Page() {
  return <MethodologyView locale="zh-Hans" />
}
