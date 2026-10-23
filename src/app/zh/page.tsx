import { HomePage, homeMetadata } from '@/components/HomePage'

export const metadata = homeMetadata('zh-Hans')

export default function Page() {
  return <HomePage locale="zh-Hans" />
}
