import { ContactView, contactMetadata } from '@/components/views/docs/ContactView'

export const metadata = contactMetadata('zh-Hans')

export default function Page() {
  return <ContactView locale="zh-Hans" />
}
