import { GradesView, gradesMetadata } from '@/components/views/docs/GradesView'

export const metadata = gradesMetadata('zh-Hans')

export default function Page() {
  return <GradesView locale="zh-Hans" />
}
