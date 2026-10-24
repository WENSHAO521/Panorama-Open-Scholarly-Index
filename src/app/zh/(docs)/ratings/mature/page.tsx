import { AjrMatureView, ajrMatureMetadata } from '@/components/views/docs/AjrMatureView'

export const metadata = ajrMatureMetadata('zh-Hans')

export default function Page() {
  return <AjrMatureView locale="zh-Hans" />
}
