import { AboutView, aboutMetadata } from '@/components/views/docs/AboutView'

export const metadata = aboutMetadata('zh-Hans')

export default function Page() {
  return <AboutView locale="zh-Hans" />
}
