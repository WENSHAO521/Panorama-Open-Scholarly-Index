import { SubjectsView, subjectsMetadata } from '@/components/views/SubjectsView'

export const metadata = subjectsMetadata('en')

export default function Page() {
  return <SubjectsView locale="en" />
}
