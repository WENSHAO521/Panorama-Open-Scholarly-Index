import { CiteView } from '@/components/views/CiteView'
import { citeMetadata } from '@/components/views/cite-metadata'

export const metadata = citeMetadata('zh-Hans')

export default function Page() {
  return <CiteView />
}
