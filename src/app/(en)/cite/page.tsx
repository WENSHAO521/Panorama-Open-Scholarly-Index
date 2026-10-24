import { CiteView } from '@/components/views/CiteView'
import { citeMetadata } from '@/components/views/cite-metadata'

export const metadata = citeMetadata('en')

export default function Page() {
  return <CiteView />
}
