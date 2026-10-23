import { SubjectsView, subjectsMetadata } from '@/components/views/SubjectsView'

export const metadata = subjectsMetadata('zh-Hans')

export default function Page() {
  return <SubjectsView locale="zh-Hans" />
}
