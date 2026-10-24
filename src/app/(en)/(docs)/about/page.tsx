import { AboutView, aboutMetadata } from '@/components/views/docs/AboutView'

export const metadata = aboutMetadata('en')

export default function Page() {
  return <AboutView locale="en" />
}
