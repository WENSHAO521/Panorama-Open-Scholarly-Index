import { ContactView, contactMetadata } from '@/components/views/docs/ContactView'

export const metadata = contactMetadata('en')

export default function Page() {
  return <ContactView locale="en" />
}
