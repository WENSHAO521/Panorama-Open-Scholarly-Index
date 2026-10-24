import { LogosView, logosMetadata } from '@/components/views/LogosView'

export const metadata = logosMetadata('zh-Hans')

export default function Page() {
  return <LogosView locale="zh-Hans" />
}
